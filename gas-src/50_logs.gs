function normalizeLogLimit(value) {
  return Math.min(Math.max(parseInt(value) || 50, 1), 100);
}

function includesLogQuery(values, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  for (let i = 0; i < values.length; i++) {
    if (String(values[i] || "").toLowerCase().indexOf(q) !== -1) return true;
  }
  return false;
}

function paginateLogs(rows, limit, offset) {
  const totalCount = rows.length;
  return {
    rows: rows.slice(offset, offset + limit),
    totalCount: totalCount,
    hasMore: offset + limit < totalCount
  };
}

function handleGetAuditLogs(payload) {
  if (normalizeRole(payload.role) !== 'ADMIN') {
    return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึง (เฉพาะผู้ดูแลระบบ)" });
  }

  const limit = normalizeLogLimit(payload.limit);
  const offset = Math.max(parseInt(payload.offset) || 0, 0);
  const query = String(payload.query || "").trim();
  const actionFilter = String(payload.actionFilter || "").trim().toLowerCase();
  const actorFilter = String(payload.actorId || "").trim().toLowerCase();
  const targetFilter = String(payload.targetId || "").trim().toLowerCase();
  const ss = getSpreadsheet();
  const auditSheet = ss.getSheetByName("AuditLog");
  if (!auditSheet || auditSheet.getLastRow() <= 1) {
    return createJsonResponse({ success: true, logs: [], totalCount: 0, hasMore: false });
  }

  const data = auditSheet.getRange(2, 1, auditSheet.getLastRow() - 1, 5).getValues();
  const logs = [];
  for (let i = data.length - 1; i >= 0; i--) {
    const row = data[i];
    const log = {
      timestamp: formatSheetDateValue(row[0]),
      actorId: String(row[1] || ""),
      action: String(row[2] || ""),
      targetId: String(row[3] || ""),
      details: String(row[4] || "")
    };
    if (actionFilter && log.action.toLowerCase().indexOf(actionFilter) === -1) continue;
    if (actorFilter && log.actorId.toLowerCase().indexOf(actorFilter) === -1) continue;
    if (targetFilter && log.targetId.toLowerCase().indexOf(targetFilter) === -1) continue;
    if (!includesLogQuery([log.timestamp, log.actorId, log.action, log.targetId, log.details], query)) continue;
    logs.push(log);
  }

  const page = paginateLogs(logs, limit, offset);
  return createJsonResponse({ success: true, logs: page.rows, totalCount: page.totalCount, hasMore: page.hasMore });
}

function handleGetParcelActivityLogs(payload) {
  if (normalizeRole(payload.role) !== 'ADMIN') {
    return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึง (เฉพาะผู้ดูแลระบบ)" });
  }

  const limit = normalizeLogLimit(payload.limit);
  const offset = Math.max(parseInt(payload.offset) || 0, 0);
  const query = String(payload.query || "").trim();
  const eventTypeFilter = String(payload.eventType || "").trim().toUpperCase();
  const trackingFilter = String(payload.trackingId || "").trim().toLowerCase();
  const activities = [];

  getYearSpreadsheetsForRead().forEach(function (entry) {
    const eventSheet = entry.spreadsheet.getSheetByName("ParcelEvents");
    if (!eventSheet || eventSheet.getLastRow() <= 1) return;
    const data = eventSheet.getRange(2, 1, eventSheet.getLastRow() - 1, EVENT_HEADERS.length).getValues();
    for (let i = data.length - 1; i >= 0; i--) {
      const activity = parseEventRow(data[i]);
      const eventType = String(activity.eventType || "").toUpperCase();
      const trackingId = String(activity.trackingId || "");
      if (eventTypeFilter && eventType !== eventTypeFilter) continue;
      if (trackingFilter && trackingId.toLowerCase().indexOf(trackingFilter) === -1) continue;
      if (!includesLogQuery([
        activity.id,
        activity.trackingId,
        activity.timestamp,
        activity.eventType,
        activity.location,
        activity.destLocation,
        activity.person,
        activity.note,
        activity.deliveryMatchStatus,
        activity.deliveryMismatchReason
      ], query)) continue;
      activities.push(activity);
    }
  });

  const page = paginateLogs(activities, limit, offset);
  return createJsonResponse({ success: true, activities: page.rows, totalCount: page.totalCount, hasMore: page.hasMore });
}

function handleGetParcels(payload) {
  const limit = Math.min(Math.max(parseInt(payload.limit) || 50, 1), 100);
  const offset = Math.max(parseInt(payload.offset) || 0, 0);
  const parcels = [];
  let skipped = 0;
  let totalCount = 0;
  let hasMore = false;

  const sheets = getParcelSheetsForRead();
  if (!sheets.length) {
    return createJsonResponse({ success: true, parcels: [], totalCount: 0, hasMore: false });
  }

  sheets.forEach(function (entry) {
    const sheet = entry.sheet;
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return;

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();

    for (let i = data.length - 1; i >= 0; i--) {
      const row = data[i];

      if (payload.status && payload.status !== "ทั้งหมด") {
        if (row[8] !== payload.status) {
          continue;
        }
      }

      totalCount++;
      if (skipped < offset) {
        skipped++;
        continue;
      }
      if (parcels.length >= limit) {
        hasMore = true;
        continue;
      }

      const parcel = {};
      for (let j = 0; j < headers.length; j++) {
        parcel[headers[j]] = row[j];
      }

      parcel["วันที่สร้าง"] = formatSheetDateValue(parcel["วันที่สร้าง"]);

      parcels.push(parcel);
    }
  });

  const trackingIds = parcels.map(function (p) { return p.TrackingID; });
  const eventsMap = getEventsForTrackingIds(trackingIds);
  const routeSamplesMap = getRouteSamplesForTrackingIds(trackingIds);
  for (let p of parcels) {
    p.events = eventsMap[p.TrackingID] || [];
    p.routeSamples = routeSamplesMap[p.TrackingID] || [];
  }

  return createJsonResponse({
    success: true,
    parcels: parcels,
    totalCount: totalCount,
    hasMore: hasMore
  });
}

function handleGetParcel(payload) {
  if (!validateTrackingID(payload.trackingID)) {
    return createJsonResponse({ success: false, error: "รูปแบบหมายเลขติดตามไม่ถูกต้อง" });
  }
  const isGuest = normalizeRole(payload.role) === "GUEST";
  const storage = getParcelStorageByTrackingId(payload.trackingID);
  if (!storage) {
    return createJsonResponse({ success: false, error: "ไม่พบข้อมูล" });
  }
  const sheet = storage.sheet;
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0] === payload.trackingID) {
      if (!isGuest && !canReadParcelRow(payload, row)) {
        return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึงรายการนี้" });
      }

      const parcel = {};
      for (let j = 0; j < headers.length; j++) {
        parcel[headers[j]] = row[j];
      }

      parcel["วันที่สร้าง"] = formatSheetDateValue(parcel["วันที่สร้าง"]);

      if (isGuest) {
        return createJsonResponse({ success: true, parcel: redactParcelForGuest(parcel) });
      }

      const eventsMap = getParcelEventsMap();
      parcel.events = eventsMap[payload.trackingID] || [];
      parcel.routeSamples = getRouteSamplesForSpreadsheet(storage.spreadsheet, payload.trackingID);

      return createJsonResponse({ success: true, parcel: parcel });
    }
  }

  return createJsonResponse({ success: false, error: "ไม่พบข้อมูล" });
}

function handleExportSummary(payload) {
  if (!hasAnyRole(payload, ['ADMIN', 'MESSENGER'])) {
    return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึง" });
  }
  let total = 0, pending = 0, transit = 0, delivered = 0;

  // Build events map once for derived status calculation
  const eventsMap = getParcelEventsMap();

  getParcelSheetsForRead().forEach(function (entry) {
    const data = entry.sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      let status = String(row[8] || "");
      const trackingID = String(row[0] || "");
      total++;

      // Apply derived status: if last event was FORWARD, treat as กำลังจัดส่ง
      if (status === "ส่งสำเร็จ") {
        const events = eventsMap[trackingID] || [];
        const actionEvents = events.filter(function (e) {
          return e.eventType === 'FORWARD' || e.eventType === 'START_DELIVERY' || e.eventType === 'PICKUP' || e.eventType === 'RELEASE_DELIVERY' || e.eventType === 'DELIVERED' || e.eventType === 'PROXY';
        });
        if (
          actionEvents.length > 0 &&
          (actionEvents[actionEvents.length - 1].eventType === 'FORWARD' || actionEvents[actionEvents.length - 1].eventType === 'START_DELIVERY' || actionEvents[actionEvents.length - 1].eventType === 'PICKUP')
        ) {
          status = "กำลังจัดส่ง";
        } else if (actionEvents.length > 0 && actionEvents[actionEvents.length - 1].eventType === 'RELEASE_DELIVERY') {
          status = "รอจัดส่ง";
        }
      }

      if (status === "รอจัดส่ง") pending++;
      else if (status === "กำลังจัดส่ง") transit++;
      else if (status === "ส่งสำเร็จ") delivered++;
    }
  });

  return createJsonResponse({
    success: true,
    summary: { total, pending, transit, delivered }
  });
}

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


function sanitizeRouteSampleId(value) {
  return String(value || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80);
}

function handleSyncRouteSamples(payload) {
  if (!hasAnyRole(payload, ['ADMIN', 'MESSENGER'])) {
    return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึง" });
  }

  const rl = checkWriteRateLimit(payload.employeeId, 'syncRouteSamples');
  if (!rl.allowed) {
    return createJsonResponse({ success: false, error: "ส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่" });
  }

  if (!validateTrackingID(payload.trackingID)) {
    return createJsonResponse({ success: false, error: "รูปแบบหมายเลขติดตามไม่ถูกต้อง" });
  }

  const samples = Array.isArray(payload.samples) ? payload.samples.slice(0, 500) : [];
  if (samples.length === 0) {
    return createJsonResponse({ success: true, savedCount: 0, skippedCount: 0 });
  }

  const storage = getParcelStorageByTrackingId(payload.trackingID);
  if (!storage) {
    return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึง" });
  }

  const data = storage.sheet.getDataRange().getValues();
  let parcelRow = null;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(payload.trackingID).trim()) {
      parcelRow = data[i];
      break;
    }
  }

  if (!parcelRow || !canReadParcelRow(payload, parcelRow)) {
    return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึง" });
  }

  const routeSheet = getRouteSampleSheetForSpreadsheet(storage.spreadsheet);
  if (!routeSheet) {
    return createJsonResponse({ success: false, error: "Route sample sheet unavailable" });
  }

  const existingIds = {};
  const existingSamples = getRouteSamplesForSpreadsheet(storage.spreadsheet, payload.trackingID);
  for (let i = 0; i < existingSamples.length; i++) {
    existingIds[String(existingSamples[i].id)] = true;
  }

  let savedCount = 0;
  let skippedCount = 0;
  const rowsToAppend = [];
  const operatorName = escapeSheetValue(payload.operatorName || payload.name || payload.employeeId || "");
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i] || {};
    const sampleId = sanitizeRouteSampleId(sample.id || (String(payload.trackingID) + "_" + i));
    if (!sampleId) {
      skippedCount++;
      continue;
    }

    if (existingIds[sampleId]) {
      skippedCount++;
      continue;
    }

    const latitude = sanitizeCoordinate(sample.latitude, -90, 90);
    const longitude = sanitizeCoordinate(sample.longitude, -180, 180);
    if (latitude === "" || longitude === "") {
      skippedCount++;
      continue;
    }

    const rawDate = sample.timestamp ? new Date(String(sample.timestamp)) : new Date();
    const eventDate = isNaN(rawDate.getTime()) ? new Date() : rawDate;
    rowsToAppend.push([
      sampleId,
      payload.trackingID,
      formatThaiDateForSheet(eventDate),
      latitude,
      longitude,
      sample.accuracy !== undefined && sample.accuracy !== null && isFinite(Number(sample.accuracy)) ? Math.round(Number(sample.accuracy)) : "",
      sample.speed !== undefined && sample.speed !== null && isFinite(Number(sample.speed)) ? Number(sample.speed).toFixed(2) : "",
      sample.heading !== undefined && sample.heading !== null && isFinite(Number(sample.heading)) ? Math.round(Number(sample.heading)) : "",
      operatorName,
      formatThaiDateForSheet(new Date())
    ]);
    existingIds[sampleId] = true;
    savedCount++;
  }

  if (rowsToAppend.length > 0) {
    routeSheet
      .getRange(routeSheet.getLastRow() + 1, 1, rowsToAppend.length, rowsToAppend[0].length)
      .setValues(rowsToAppend);
  }

  if (savedCount > 0) {
    writeAuditLog(payload.employeeId, "SYNC_ROUTE_SAMPLES", payload.trackingID, "Saved route samples: " + savedCount);
  }
  return createJsonResponse({ success: true, savedCount: savedCount, skippedCount: skippedCount });
}

function handleSearchParcels(payload) {
  const query = sanitizeText(payload.query || "");
  if (!query) {
    return createJsonResponse({ success: true, parcels: [] });
  }

  // Query length limit (frontend also enforces 100 chars)
  if (query.length > 100) {
    return createJsonResponse({ success: false, error: "คำค้นหายาวเกินไป" });
  }

  const role = normalizeRole(payload.role);
  const isGuest = role === "GUEST";
  if (!isGuest && !hasAnyRole(payload, ['ADMIN', 'MESSENGER'])) {
    return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึง" });
  }

  // Rate limit: max 30 searches per minute per authenticated user.
  const cache = CacheService.getScriptCache();
  const searchActor = isGuest ? "guest" : normalizeEmployeeId(payload.employeeId);
  const rateLimitKey = "search_rate_" + searchActor;
  const rateRaw = cache.get(rateLimitKey);
  const rateCount = rateRaw ? Number(rateRaw) : 0;
  if (rateCount >= 30) {
    return createJsonResponse({ success: false, error: "ส่งคำขอบ่อยเกินไป กรุณารอสักครู่" });
  }
  cache.put(rateLimitKey, String(rateCount + 1), 60);

  if (isGuest && !validateTrackingID(query) && query.length < 2) {
    return createJsonResponse({ success: true, parcels: [] });
  }

  const queryLower = query.toLowerCase();
  const parcels = [];

  const sheets = getParcelSheetsForRead();
  for (let s = 0; s < sheets.length && parcels.length < 50; s++) {
    const sheet = sheets[s].sheet;
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) continue;
    const headers = data[0];

    for (let i = data.length - 1; i >= 1; i--) {
      const row = data[i];
      const tracking = String(row[0] || "").toLowerCase();
      const sender = String(row[2] || "").toLowerCase();
      const receiver = String(row[4] || "").toLowerCase();
      const destination = String(row[5] || "").toLowerCase();
      const description = String(row[6] || "").toLowerCase();

      if (isGuest) {
        if (tracking !== queryLower && receiver.indexOf(queryLower) === -1) continue;
      } else {
        if (!canReadParcelRow(payload, row)) continue;
        if (tracking.indexOf(queryLower) === -1 && sender.indexOf(queryLower) === -1 && receiver.indexOf(queryLower) === -1 && destination.indexOf(queryLower) === -1 && description.indexOf(queryLower) === -1) {
          continue;
        }
      }

      const parcel = {};
      for (let j = 0; j < headers.length; j++) {
        parcel[headers[j]] = row[j];
      }

      parcel["วันที่สร้าง"] = formatSheetDateValue(parcel["วันที่สร้าง"]);
      if (isGuest) {
        parcels.push(redactParcelForGuest(parcel));
        if (parcels.length >= 50) break;
        continue;
      }

      parcels.push(parcel);
      if (parcels.length >= 50) break;
    }
  }

  if (!isGuest && parcels.length > 0) {
    // Attach events only for authenticated users. Public search should not expose proof images or GPS trails.
    const trackingIds = parcels.map(function (p) { return p.TrackingID; });
    const eventsMap = getEventsForTrackingIds(trackingIds);
    const routeSamplesMap = getRouteSamplesForTrackingIds(trackingIds);
    for (let p of parcels) {
      p.events = eventsMap[p.TrackingID] || [];
      p.routeSamples = routeSamplesMap[p.TrackingID] || [];
    }
  }

  return createJsonResponse({ success: true, parcels: parcels });
}
