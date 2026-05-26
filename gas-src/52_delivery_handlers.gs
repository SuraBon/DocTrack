function handleConfirmReceipt(payload) {
  if (!hasAnyRole(payload, ['ADMIN', 'MESSENGER'])) {
    return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึง" });
  }

  // Rate limit: ป้องกัน spam ยืนยันพัสดุ
  const rl = checkWriteRateLimit(payload.employeeId, 'confirmReceipt');
  if (!rl.allowed) {
    return createJsonResponse({ success: false, error: "ส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่" });
  }

  if (!validateTrackingID(payload.trackingID)) {
    return createJsonResponse({ success: false, error: "รูปแบบหมายเลขติดตามไม่ถูกต้อง" });
  }
  if (!payload.photoUrl) {
    return createJsonResponse({ success: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }

  // Location must be provided by the frontend payload during forwarding or delivery
  if (VALID_EVENT_TYPES.indexOf(String(payload.eventType || "")) === -1) {
    return createJsonResponse({ success: false, error: "ประเภทการยืนยันไม่ถูกต้อง" });
  }

  const sanitizedNote = payload.note ? escapeSheetValue(payload.note) : '';
  const eventLocation = escapeSheetValue(payload.location || "");
  const eventDestLocation = escapeSheetValue(payload.destLocation || "");
  const eventPerson = escapeSheetValue(payload.person || "");
  const isFinalDeliveryEvent = payload.eventType === "DELIVERED" || payload.eventType === "PROXY";
  const rawDeliveryMatchStatus = String(payload.deliveryMatchStatus || "");
  const deliveryMatchStatus = isFinalDeliveryEvent
    ? escapeSheetValue(rawDeliveryMatchStatus || "MATCHED_DECLARED_DESTINATION")
    : "";
  const deliveryMismatchReason = isFinalDeliveryEvent && deliveryMatchStatus === "DELIVERED_ELSEWHERE"
    ? escapeSheetValue(payload.deliveryMismatchReason || "")
    : "";
  if (sanitizedNote.length > MAX_NOTE_LENGTH) {
    return createJsonResponse({ success: false, error: "หมายเหตุยาวเกินไป" });
  }
  if (eventLocation.length > 100 || eventDestLocation.length > 100) {
    return createJsonResponse({ success: false, error: "ชื่อสาขายาวเกินไป" });
  }
  if (eventPerson.length > 200) {
    return createJsonResponse({ success: false, error: "ชื่อผู้รับ/ผู้ส่งต่อยาวเกินไป" });
  }
  if (deliveryMatchStatus && VALID_DELIVERY_MATCH_STATUSES.indexOf(deliveryMatchStatus) === -1) {
    return createJsonResponse({ success: false, error: "สถานะยืนยันปลายทางไม่ถูกต้อง" });
  }
  if (deliveryMismatchReason.length > 500) {
    return createJsonResponse({ success: false, error: "เหตุผลที่ส่งคนละจุดยาวเกินไป" });
  }
  if (deliveryMatchStatus === "DELIVERED_ELSEWHERE" && !deliveryMismatchReason) {
    return createJsonResponse({ success: false, error: "กรุณาระบุเหตุผลที่ส่งคนละจุด" });
  }
  const imageValidation = validateImagePayload(payload.photoUrl);
  if (!imageValidation.ok) {
    return createJsonResponse({ success: false, error: imageValidation.error });
  }
  const storage = getParcelStorageByTrackingId(payload.trackingID);
  if (!storage) {
    return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึง" });
  }
  const sheet = storage.sheet;
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0] === payload.trackingID) {
      const rowIndex = i + 1;
      const currentStatus = row[8];
      const noteStr = String(row[7] || "");
      const activeAssignment = getActiveDeliveryAssignmentFromEvents(getParcelEventsForSpreadsheet(storage.spreadsheet, payload.trackingID));
      if (
        activeAssignment &&
        activeAssignment.assignedToId &&
        activeAssignment.assignedToId !== normalizeEmployeeId(payload.employeeId) &&
        normalizeRole(payload.role) !== "ADMIN" &&
        payload.eventType !== "FORWARD"
      ) {
        return createJsonResponse({
          success: false,
          error: "งานนี้มีผู้รับงานแล้ว: " + activeAssignment.assignedToName,
          assignedToId: activeAssignment.assignedToId,
          assignedToName: activeAssignment.assignedToName
        });
      }

      let isActuallyDelivered = currentStatus === "ส่งสำเร็จ";

      // ── State Machine Validation ──────────────────────────────────────────
      // Valid transitions:
      //   รอจัดส่ง    → กำลังจัดส่ง  (FORWARD)
      //   กำลังจัดส่ง → กำลังจัดส่ง  (FORWARD)
      //   รอจัดส่ง    → ส่งสำเร็จ   (DELIVERED / PROXY)
      //   กำลังจัดส่ง → ส่งสำเร็จ   (DELIVERED / PROXY)
      //   ส่งสำเร็จ  → ❌ ห้ามเปลี่ยน
      if (isActuallyDelivered) {
        return createJsonResponse({ success: false, error: "รายการนี้ถูกส่งสำเร็จแล้ว ไม่สามารถเปลี่ยนสถานะได้" });
      }

      let newStatus = currentStatus;
      if (payload.eventType === 'DELIVERED' || payload.eventType === 'PROXY') {
        newStatus = "ส่งสำเร็จ";
      } else if (payload.eventType === 'FORWARD') {
        if (currentStatus === "ส่งสำเร็จ") {
          return createJsonResponse({ success: false, error: "ไม่สามารถส่งต่อรายการที่ส่งสำเร็จแล้ว" });
        }
        newStatus = "กำลังจัดส่ง";
      }

      // Only update main status if it changed
      if (newStatus !== currentStatus) {
        sheet.getRange(rowIndex, 9).setValue(newStatus);
      }

      let finalPhotoUrl = imageValidation.value;

      if (finalPhotoUrl && finalPhotoUrl.startsWith('data:image')) {
        try {
          // ค้นหาหรือสร้างโฟลเดอร์หลักชื่อ ShipTrack_Images
          const systemFolder = getShipTrackFolder();
          let rootFolder;
          const rootFolderIterator = systemFolder
            ? systemFolder.getFoldersByName("ShipTrack_Images")
            : DriveApp.getFoldersByName("ShipTrack_Images");
          if (rootFolderIterator.hasNext()) {
            rootFolder = rootFolderIterator.next();
          } else {
            rootFolder = systemFolder
              ? systemFolder.createFolder("ShipTrack_Images")
              : DriveApp.createFolder("ShipTrack_Images");
            try {
              rootFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            } catch (e) { }
          }

          // สร้างโฟลเดอร์ย่อยตามเดือน (เช่น 2026-04)
          const dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM");
          let folders = rootFolder.getFoldersByName(dateStr);
          let folder;
          if (folders.hasNext()) {
            folder = folders.next();
          } else {
            folder = rootFolder.createFolder(dateStr);
            try {
              folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            } catch (e) { }
          }

          const splitData = finalPhotoUrl.split(',');
          const base64Data = splitData[1];
          const mimeTypeMatch = splitData[0].match(/:(.*?);/);
          const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
          const extension = mimeType === 'image/jpeg' ? 'jpg' : (mimeType.split('/')[1] || 'jpg');

          const filename = payload.trackingID + "_" + new Date().getTime() + "." + extension;
          const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, filename);

          const file = folder.createFile(blob);
          try {
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          } catch (e) { }

          finalPhotoUrl = "https://drive.google.com/uc?export=view&id=" + file.getId();
        } catch (e) {
          return createJsonResponse({ success: false, error: "ไม่สามารถบันทึกรูปภาพได้ กรุณาลองใหม่" });
        }
      }

      // Update main sheet's photo if delivered, or leave it. Actually, update it if it's the latest proof.
      if (finalPhotoUrl) {
        sheet.getRange(rowIndex, 10).setValue(finalPhotoUrl);
      }

      if (sanitizedNote) {
        const existingNote = sheet.getRange(rowIndex, 8).getValue();
        sheet.getRange(rowIndex, 8).setValue(existingNote ? existingNote + "\n" + sanitizedNote : sanitizedNote);
      }

      const eventLatitude = sanitizeCoordinate(payload.latitude, -90, 90);
      const eventLongitude = sanitizeCoordinate(payload.longitude, -180, 180);

      // Save sanitized coordinates into main tracking columns (if provided)
      if (eventLatitude !== "" && eventLongitude !== "") {
        sheet.getRange(rowIndex, 11).setValue(eventLatitude);
        sheet.getRange(rowIndex, 12).setValue(eventLongitude);
      }

      // Insert structured event into ParcelEvents
      if (payload.eventType) {
        const eventSheet = getEventSheetForSpreadsheet(storage.spreadsheet);
        if (eventSheet) {
          const eventId = "EVT" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMddHHmmssSSS") + Math.floor(Math.random() * 1000);
          const eventTimeStr = formatThaiDateForSheet(new Date());
          eventSheet.appendRow([
            eventId,
            payload.trackingID,
            eventTimeStr,
            payload.eventType,
            eventLocation,
            eventDestLocation,
            eventPerson,
            finalPhotoUrl || "",
            eventLatitude,
            eventLongitude,
            sanitizedNote || "",
            deliveryMatchStatus,
            deliveryMismatchReason
          ]);
        }
      }

      writeAuditLog(payload.employeeId, "CONFIRM_RECEIPT_" + (payload.eventType || "UNKNOWN"), payload.trackingID, "Status: " + currentStatus + " → " + newStatus);
      return createJsonResponse({ success: true });
    }
  }

  return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึง" });
}

function handleStartDelivery(payload) {
  if (!hasAnyRole(payload, ['ADMIN', 'MESSENGER'])) {
    return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึง" });
  }

  const rl = checkWriteRateLimit(payload.employeeId, 'startDelivery');
  if (!rl.allowed) {
    return createJsonResponse({ success: false, error: "ส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่" });
  }

  if (!validateTrackingID(payload.trackingID)) {
    return createJsonResponse({ success: false, error: "รูปแบบหมายเลขติดตามไม่ถูกต้อง" });
  }

  const storage = getParcelStorageByTrackingId(payload.trackingID);
  if (!storage) {
    return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึง" });
  }

  const sheet = storage.sheet;
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0] === payload.trackingID) {
      if (!canReadParcelRow(payload, row)) {
        return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึง" });
      }

      const rowIndex = i + 1;
      const currentStatus = String(row[8] || "");
      const events = getParcelEventsForSpreadsheet(storage.spreadsheet, payload.trackingID);
      const activeAssignment = getActiveDeliveryAssignmentFromEvents(events);
      const currentEmployeeId = normalizeEmployeeId(payload.employeeId);

      if (currentStatus === "ส่งสำเร็จ") {
        return createJsonResponse({ success: false, error: "รายการนี้ส่งสำเร็จแล้ว ไม่สามารถรับงานซ้ำได้" });
      }

      if (activeAssignment && activeAssignment.assignedToId && activeAssignment.assignedToId !== currentEmployeeId) {
        return createJsonResponse({
          success: false,
          error: "งานนี้มีผู้รับงานแล้ว: " + activeAssignment.assignedToName,
          assignedToId: activeAssignment.assignedToId,
          assignedToName: activeAssignment.assignedToName
        });
      }

      if (activeAssignment && activeAssignment.assignedToId === currentEmployeeId) {
        return createJsonResponse({
          success: true,
          alreadyStarted: true,
          assignedToId: activeAssignment.assignedToId,
          assignedToName: activeAssignment.assignedToName
        });
      }

      if (currentStatus !== "กำลังจัดส่ง") {
        sheet.getRange(rowIndex, 9).setValue("กำลังจัดส่ง");
      }

      const startLatitude = sanitizeCoordinate(payload.latitude, -90, 90);
      const startLongitude = sanitizeCoordinate(payload.longitude, -180, 180);
      const originLatitude = sanitizeCoordinate(row[13], -90, 90);
      const originLongitude = sanitizeCoordinate(row[14], -180, 180);
      const pickupDistance = getDistanceMeters(startLatitude, startLongitude, originLatitude, originLongitude);
      const autoPickedUp = pickupDistance !== null && pickupDistance <= AUTO_PICKUP_RADIUS_METERS;

      const eventSheet = getEventSheetForSpreadsheet(storage.spreadsheet);
      if (eventSheet) {
        const eventId = "EVT" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMddHHmmssSSS") + Math.floor(Math.random() * 1000);
        const eventTimeStr = formatThaiDateForSheet(new Date());
        const assignedToName = escapeSheetValue(payload.operatorName || payload.name || payload.employeeId || "");
        eventSheet.appendRow([
          eventId,
          payload.trackingID,
          eventTimeStr,
          "START_DELIVERY",
          escapeSheetValue(row[3] || ""),
          escapeSheetValue(row[5] || ""),
          assignedToName,
          "",
          startLatitude,
          startLongitude,
          buildAssignmentNote(payload.employeeId),
          "",
          ""
        ]);
        if (autoPickedUp) {
          const pickupEventId = "EVT" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMddHHmmssSSS") + Math.floor(Math.random() * 1000);
          eventSheet.appendRow([
            pickupEventId,
            payload.trackingID,
            eventTimeStr,
            "PICKUP",
            escapeSheetValue(row[3] || ""),
            escapeSheetValue(row[5] || ""),
            assignedToName,
            "",
            startLatitude,
            startLongitude,
            "autoPickup=originGpsMatched;distanceMeters=" + Math.round(pickupDistance),
            "",
            ""
          ]);
        }
      }

      writeAuditLog(payload.employeeId, "START_DELIVERY", payload.trackingID, "Status: " + currentStatus + " → กำลังจัดส่ง");
      return createJsonResponse({
        success: true,
        assignedToId: currentEmployeeId,
        assignedToName: payload.operatorName || payload.name || payload.employeeId || "",
        autoPickedUp: autoPickedUp
      });
    }
  }

  return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึง" });
}

function handleReleaseDelivery(payload) {
  if (!hasAnyRole(payload, ['ADMIN', 'MESSENGER'])) {
    return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึง" });
  }

  const rl = checkWriteRateLimit(payload.employeeId, 'releaseDelivery');
  if (!rl.allowed) {
    return createJsonResponse({ success: false, error: "ส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่" });
  }

  if (!validateTrackingID(payload.trackingID)) {
    return createJsonResponse({ success: false, error: "รูปแบบหมายเลขติดตามไม่ถูกต้อง" });
  }

  const storage = getParcelStorageByTrackingId(payload.trackingID);
  if (!storage) {
    return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึง" });
  }

  const sheet = storage.sheet;
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0] === payload.trackingID) {
      if (!canReadParcelRow(payload, row)) {
        return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึง" });
      }

      const rowIndex = i + 1;
      const currentStatus = String(row[8] || "");
      const events = getParcelEventsForSpreadsheet(storage.spreadsheet, payload.trackingID);
      const activeAssignment = getActiveDeliveryAssignmentFromEvents(events);
      const currentEmployeeId = normalizeEmployeeId(payload.employeeId);
      const isAdmin = normalizeRole(payload.role) === "ADMIN";

      if (currentStatus === "ส่งสำเร็จ") {
        return createJsonResponse({ success: false, error: "รายการนี้ส่งสำเร็จแล้ว ไม่สามารถคืนงานได้" });
      }

      if (!activeAssignment) {
        if (currentStatus !== "รอจัดส่ง") {
          sheet.getRange(rowIndex, 9).setValue("รอจัดส่ง");
        }
        return createJsonResponse({ success: true, alreadyReleased: true });
      }

      if (!isAdmin && activeAssignment.assignedToId && activeAssignment.assignedToId !== currentEmployeeId) {
        return createJsonResponse({
          success: false,
          error: "คืนงานได้เฉพาะคนที่รับงานไว้หรือผู้ดูแลระบบ",
          assignedToId: activeAssignment.assignedToId,
          assignedToName: activeAssignment.assignedToName
        });
      }

      sheet.getRange(rowIndex, 9).setValue("รอจัดส่ง");

      const eventSheet = getEventSheetForSpreadsheet(storage.spreadsheet);
      if (eventSheet) {
        const eventId = "EVT" + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMddHHmmssSSS") + Math.floor(Math.random() * 1000);
        const eventTimeStr = formatThaiDateForSheet(new Date());
        eventSheet.appendRow([
          eventId,
          payload.trackingID,
          eventTimeStr,
          "RELEASE_DELIVERY",
          escapeSheetValue(row[3] || ""),
          escapeSheetValue(row[5] || ""),
          escapeSheetValue(payload.operatorName || payload.name || payload.employeeId || ""),
          "",
          "",
          "",
          buildAssignmentNote(payload.employeeId),
          "",
          ""
        ]);
      }

      writeAuditLog(payload.employeeId, "RELEASE_DELIVERY", payload.trackingID, "Status: " + currentStatus + " → รอจัดส่ง");
      return createJsonResponse({ success: true });
    }
  }

  return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึง" });
}
