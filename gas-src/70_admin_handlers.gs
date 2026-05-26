function handleGetUsers(payload) {
  if (normalizeRole(payload.role) !== 'ADMIN') {
    return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึง (เฉพาะผู้ดูแลระบบ)" });
  }
  const sheet = getUsersSheet();
  const data = sheet.getDataRange().getValues();
  const users = [];

  for (let i = 1; i < data.length; i++) {
    users.push(buildUserRowResponse(data[i]));
  }
  return createJsonResponse({ success: true, users: users });
}

function handleCreateUser(payload) {
  if (normalizeRole(payload.role) !== 'ADMIN') {
    return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึง (เฉพาะผู้ดูแลระบบ)" });
  }

  const employeeId = normalizeEmployeeId(payload.targetId);
  const name = escapeSheetValue(payload.name);
  const newRole = normalizeRole(payload.newRole);
  const password = sanitizePassword(payload.password);

  if (!employeeId || !name || !newRole || !password) {
    return createJsonResponse({ success: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }
  if (!validateEmployeeId(employeeId)) return createJsonResponse({ success: false, error: "รหัสพนักงานไม่ถูกต้อง" });
  if (VALID_ROLES.indexOf(newRole) === -1) return createJsonResponse({ success: false, error: "สิทธิ์ไม่ถูกต้อง" });
  if (!validatePassword(password) || password.length > 100) {
    return createJsonResponse({ success: false, error: "รหัสผ่านต้องมี 4-100 ตัวอักษร และห้ามขึ้นต้นด้วย = + - หรือ @" });
  }
  if (name.length > 100) return createJsonResponse({ success: false, error: "ชื่อยาวเกินไป" });

  const sheet = getUsersSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (normalizeEmployeeId(data[i][0]) === employeeId) {
      return createJsonResponse({ success: false, error: "รหัสพนักงานนี้มีอยู่แล้ว" });
    }
  }

  const createdAt = formatThaiDateForSheet(new Date());
  sheet.appendRow([employeeId, name, newRole, encodePassword(password), createdAt, "ACTIVE", createdAt]);
  writeAuditLog(payload.employeeId, "createUser", employeeId, "role=" + newRole);

  return createJsonResponse({
    success: true,
    user: {
      employeeId: employeeId,
      name: name,
      role: newRole,
      hasPin: true,
      createdAt: createdAt,
      status: "ACTIVE",
      updatedAt: createdAt
    }
  });
}

function handleUpdateUserRole(payload) {
  if (normalizeRole(payload.role) !== 'ADMIN') {
    return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึง (เฉพาะผู้ดูแลระบบ)" });
  }

  const targetId = normalizeEmployeeId(payload.targetId);
  const newRole = normalizeRole(payload.newRole);
  if (!targetId || !newRole) return createJsonResponse({ success: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  if (!validateEmployeeId(targetId)) return createJsonResponse({ success: false, error: "รหัสพนักงานไม่ถูกต้อง" });
  if (VALID_ROLES.indexOf(newRole) === -1) {
    return createJsonResponse({ success: false, error: "สิทธิ์ไม่ถูกต้อง" });
  }
  if (targetId === normalizeEmployeeId(payload.employeeId) && newRole !== 'ADMIN') {
    return createJsonResponse({ success: false, error: "ไม่สามารถลดสิทธิ์ของตัวเองได้" });
  }

  const sheet = getUsersSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (normalizeEmployeeId(data[i][0]) === targetId) {
      if (normalizeRole(data[i][2] || "GUEST") === "ADMIN" && newRole !== "ADMIN" && countActiveAdmins(data) <= 1) {
        return createJsonResponse({ success: false, error: "ต้องมีผู้ดูแลระบบอย่างน้อย 1 คน" });
      }
      sheet.getRange(i + 1, 3).setValue(newRole);
      sheet.getRange(i + 1, 7).setValue(formatThaiDateForSheet(new Date()));
      setActiveSessionId(targetId, "");
      return createJsonResponse({ success: true });
    }
  }
  return createJsonResponse({ success: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
}

function countActiveAdmins(data) {
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    const role = normalizeRole(data[i][2] || "GUEST");
    const status = String(data[i][5] || "ACTIVE").trim().toUpperCase() || "ACTIVE";
    if (role === "ADMIN" && status !== "DISABLED") count++;
  }
  return count;
}

function buildUserRowResponse(row) {
  return {
    employeeId: normalizeEmployeeId(row[0]),
    name: String(row[1] || ""),
    role: normalizeRole(row[2] || "GUEST"),
    hasPin: !!String(row[3] || "").trim(),
    createdAt: formatSheetDateValue(row[4]),
    status: String(row[5] || "ACTIVE").trim().toUpperCase() || "ACTIVE",
    updatedAt: formatSheetDateValue(row[6])
  };
}

function handleUpdateUser(payload) {
  if (normalizeRole(payload.role) !== 'ADMIN') {
    return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึง (เฉพาะผู้ดูแลระบบ)" });
  }

  const targetId = normalizeEmployeeId(payload.targetId);
  const name = escapeSheetValue(payload.name);
  const newRole = normalizeRole(payload.newRole);
  const password = payload.password ? sanitizePassword(payload.password) : "";
  if (!targetId || !name || !newRole) return createJsonResponse({ success: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  if (!validateEmployeeId(targetId)) return createJsonResponse({ success: false, error: "รหัสพนักงานไม่ถูกต้อง" });
  if (VALID_ROLES.indexOf(newRole) === -1) return createJsonResponse({ success: false, error: "สิทธิ์ไม่ถูกต้อง" });
  if (name.length > 100) return createJsonResponse({ success: false, error: "ชื่อยาวเกินไป" });
  if (password && (!validatePassword(password) || password.length > 100)) {
    return createJsonResponse({ success: false, error: "รหัสผ่านต้องมี 4-100 ตัวอักษร และห้ามขึ้นต้นด้วย = + - หรือ @" });
  }

  const sheet = getUsersSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (normalizeEmployeeId(data[i][0]) === targetId) {
      if (targetId === normalizeEmployeeId(payload.employeeId) && newRole !== 'ADMIN') {
        return createJsonResponse({ success: false, error: "ไม่สามารถลดสิทธิ์ของตัวเองได้" });
      }
      if (normalizeRole(data[i][2] || "GUEST") === "ADMIN" && newRole !== "ADMIN" && countActiveAdmins(data) <= 1) {
        return createJsonResponse({ success: false, error: "ต้องมีผู้ดูแลระบบอย่างน้อย 1 คน" });
      }
      const updatedAt = formatThaiDateForSheet(new Date());
      sheet.getRange(i + 1, 2).setValue(name);
      sheet.getRange(i + 1, 3).setValue(newRole);
      if (password) {
        sheet.getRange(i + 1, 4).setValue(encodePassword(password));
        setActiveSessionId(targetId, "");
      }
      sheet.getRange(i + 1, 7).setValue(updatedAt);
      const row = sheet.getRange(i + 1, 1, 1, USER_HEADERS.length).getValues()[0];
      writeAuditLog(payload.employeeId, "UPDATE_USER", targetId, "role=" + newRole);
      return createJsonResponse({ success: true, user: buildUserRowResponse(row) });
    }
  }
  return createJsonResponse({ success: false, error: "ไม่พบผู้ใช้" });
}

function handleDisableUser(payload) {
  if (normalizeRole(payload.role) !== 'ADMIN') {
    return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึง (เฉพาะผู้ดูแลระบบ)" });
  }
  const targetId = normalizeEmployeeId(payload.targetId);
  if (!targetId || !validateEmployeeId(targetId)) return createJsonResponse({ success: false, error: "รหัสพนักงานไม่ถูกต้อง" });
  if (targetId === normalizeEmployeeId(payload.employeeId)) return createJsonResponse({ success: false, error: "ไม่สามารถปิดบัญชีของตัวเองได้" });

  const sheet = getUsersSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (normalizeEmployeeId(data[i][0]) === targetId) {
      if (normalizeRole(data[i][2] || "GUEST") === "ADMIN" && countActiveAdmins(data) <= 1) {
        return createJsonResponse({ success: false, error: "ต้องมีผู้ดูแลระบบอย่างน้อย 1 คน" });
      }
      const updatedAt = formatThaiDateForSheet(new Date());
      sheet.getRange(i + 1, 6).setValue("DISABLED");
      sheet.getRange(i + 1, 7).setValue(updatedAt);
      setActiveSessionId(targetId, "");
      const row = sheet.getRange(i + 1, 1, 1, USER_HEADERS.length).getValues()[0];
      writeAuditLog(payload.employeeId, "DISABLE_USER", targetId, "");
      return createJsonResponse({ success: true, user: buildUserRowResponse(row) });
    }
  }
  return createJsonResponse({ success: false, error: "ไม่พบผู้ใช้" });
}

function handleDeleteUser(payload) {
  if (normalizeRole(payload.role) !== 'ADMIN') {
    return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึง (เฉพาะผู้ดูแลระบบ)" });
  }
  const targetId = normalizeEmployeeId(payload.targetId);
  if (!targetId || !validateEmployeeId(targetId)) return createJsonResponse({ success: false, error: "รหัสพนักงานไม่ถูกต้อง" });
  if (targetId === normalizeEmployeeId(payload.employeeId)) return createJsonResponse({ success: false, error: "ไม่สามารถลบบัญชีของตัวเองได้" });

  const sheet = getUsersSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (normalizeEmployeeId(data[i][0]) === targetId) {
      if (normalizeRole(data[i][2] || "GUEST") === "ADMIN" && countActiveAdmins(data) <= 1) {
        return createJsonResponse({ success: false, error: "ต้องมีผู้ดูแลระบบอย่างน้อย 1 คน" });
      }
      sheet.deleteRow(i + 1);
      setActiveSessionId(targetId, "");
      writeAuditLog(payload.employeeId, "DELETE_USER", targetId, "");
      return createJsonResponse({ success: true });
    }
  }
  return createJsonResponse({ success: false, error: "ไม่พบผู้ใช้" });
}

function handleGetBranches(payload) {
  if (!hasAnyRole(payload, ["ADMIN", "MESSENGER", "GUEST"])) {
    return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึง" });
  }
  return createJsonResponse({ success: true, branches: readBranches() });
}

function handleCreateBranch(payload) {
  if (normalizeRole(payload.role) !== 'ADMIN') {
    return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึง (เฉพาะผู้ดูแลระบบ)" });
  }
  const name = escapeSheetValue(payload.name || "");
  if (!name) return createJsonResponse({ success: false, error: "กรุณากรอกชื่อแผนก/สาขา" });
  if (name.length > 100) return createJsonResponse({ success: false, error: "ชื่อแผนก/สาขายาวเกินไป" });

  const sheet = getBranchesSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0] || "").trim().toLowerCase() === name.toLowerCase()) {
      return createJsonResponse({ success: false, error: "มีแผนก/สาขานี้แล้ว" });
    }
  }
  sheet.appendRow([name, formatThaiDateForSheet(new Date()), payload.employeeId || ""]);
  writeAuditLog(payload.employeeId, "CREATE_BRANCH", name, "");
  return createJsonResponse({ success: true, branches: readBranches() });
}

function handleDeleteBranch(payload) {
  if (normalizeRole(payload.role) !== 'ADMIN') {
    return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึง (เฉพาะผู้ดูแลระบบ)" });
  }
  const name = escapeSheetValue(payload.name || "");
  if (!name) return createJsonResponse({ success: false, error: "กรุณาระบุแผนก/สาขา" });

  const sheet = getBranchesSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0] || "").trim().toLowerCase() === name.toLowerCase()) {
      sheet.deleteRow(i + 1);
      writeAuditLog(payload.employeeId, "DELETE_BRANCH", name, "");
      return createJsonResponse({ success: true, branches: readBranches() });
    }
  }
  return createJsonResponse({ success: false, error: "ไม่พบแผนก/สาขา" });
}

function handleDeleteParcel(payload) {
  if (normalizeRole(payload.role) !== 'ADMIN') {
    return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึง (เฉพาะผู้ดูแลระบบ)" });
  }

  const trackingID = String(payload.trackingID || "").trim();
  if (!trackingID) return createJsonResponse({ success: false, error: "กรุณาระบุหมายเลขติดตาม" });
  if (!validateTrackingID(trackingID)) return createJsonResponse({ success: false, error: "รูปแบบหมายเลขติดตามไม่ถูกต้อง" });

  const storage = getParcelStorageByTrackingId(trackingID);
  if (!storage) return createJsonResponse({ success: false, error: "ไม่พบรายการส่งที่ระบุ" });
  const sheet = storage.sheet;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === trackingID) {
      const parcelInfo = "ผู้ส่ง:" + data[i][2] + " ผู้รับ:" + data[i][4];
      sheet.deleteRow(i + 1);
      const eventSheet = getEventSheetForSpreadsheet(storage.spreadsheet);
      if (eventSheet) {
        const eventData = eventSheet.getDataRange().getValues();
        for (let j = eventData.length - 1; j >= 1; j--) {
          if (String(eventData[j][1]).trim() === trackingID) {
            eventSheet.deleteRow(j + 1);
          }
        }
      }
      writeAuditLog(payload.employeeId, "DELETE_PARCEL", trackingID, parcelInfo);
      return createJsonResponse({ success: true });
    }
  }
  return createJsonResponse({ success: false, error: "ไม่พบรายการส่งที่ระบุ" });
}

function handleEditParcel(payload) {
  if (normalizeRole(payload.role) !== 'ADMIN') {
    return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึง (เฉพาะผู้ดูแลระบบ)" });
  }

  const trackingID = String(payload.trackingID || "").trim();
  const updates = payload.updates;
  if (!trackingID || !updates) return createJsonResponse({ success: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  if (!validateTrackingID(trackingID)) return createJsonResponse({ success: false, error: "รูปแบบหมายเลขติดตามไม่ถูกต้อง" });

  // Validate update values
  const allowedFields = ["senderName", "senderBranch", "receiverName", "receiverBranch", "description"];
  const fieldMap = { senderName: "ผู้ส่ง", senderBranch: "สาขาผู้ส่ง", receiverName: "ผู้รับ", receiverBranch: "สาขาผู้รับ", description: "รายละเอียด" };
  for (const key of Object.keys(updates)) {
    if (!allowedFields.includes(key)) return createJsonResponse({ success: false, error: "ฟิลด์ไม่ถูกต้อง: " + key });
    if (typeof updates[key] !== 'string' || updates[key].length > 200) return createJsonResponse({ success: false, error: "ค่าไม่ถูกต้องสำหรับฟิลด์: " + key });
    updates[key] = escapeSheetValue(updates[key]);
  }

  const storage = getParcelStorageByTrackingId(trackingID);
  if (!storage) return createJsonResponse({ success: false, error: "ไม่พบรายการส่งที่ระบุ" });
  const sheet = storage.sheet;
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === trackingID) {
      const rowIndex = i + 1;
      const changedFields = [];
      for (const key of allowedFields) {
        if (updates[key]) {
          const colName = fieldMap[key];
          const colIdx = headers.indexOf(colName);
          if (colIdx >= 0) {
            sheet.getRange(rowIndex, colIdx + 1).setValue(updates[key]);
            changedFields.push(key + "=" + updates[key]);
          }
        }
      }
      writeAuditLog(payload.employeeId, "EDIT_PARCEL", trackingID, changedFields.join(", "));
      return createJsonResponse({ success: true });
    }
  }
  return createJsonResponse({ success: false, error: "ไม่พบรายการส่งที่ระบุ" });
}

function handleUpdateProfile(payload) {
  // Any authenticated user can update their own profile
  if (!hasAnyRole(payload, ['ADMIN', 'MESSENGER'])) {
    return createJsonResponse({ success: false, error: "ไม่มีสิทธิ์เข้าถึง" });
  }

  const employeeId = normalizeEmployeeId(payload.employeeId);
  if (!employeeId) return createJsonResponse({ success: false, error: "Missing employeeId" });

  const newName = payload.newName ? escapeSheetValue(payload.newName) : null;
  const newPassword = payload.newPassword ? sanitizePassword(payload.newPassword) : null;
  const currentPassword = payload.currentPassword ? sanitizePassword(payload.currentPassword) : null;

  // Validate lengths
  if (newName && newName.length > 200) return createJsonResponse({ success: false, error: "ชื่อยาวเกินไป" });
  if (newPassword && !validatePassword(newPassword)) return createJsonResponse({ success: false, error: "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร และห้ามขึ้นต้นด้วย = + - หรือ @" });
  if (newPassword && newPassword.length > 100) return createJsonResponse({ success: false, error: "รหัสผ่านยาวเกินไป" });

  const sheet = getUsersSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (normalizeEmployeeId(data[i][0]) !== employeeId) continue;

    const rowIndex = i + 1;
    const currentPin = String(data[i][3] || "").trim();

    // If changing password, must verify current password first
    if (newPassword) {
      if (!currentPassword) return createJsonResponse({ success: false, error: "กรุณากรอกรหัสผ่านปัจจุบันเพื่อเปลี่ยนรหัสผ่าน" });
      const passwordCheck = verifyPasswordRecord(currentPin, currentPassword);
      if (!passwordCheck.ok) return createJsonResponse({ success: false, error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
      if (passwordCheck.needsMigration) {
        sheet.getRange(rowIndex, 4).setValue(encodePassword(currentPassword));
      }
    }

    const changedFields = [];
    if (newName) {
      sheet.getRange(rowIndex, 2).setValue(newName);
      changedFields.push("name=" + newName);
    }
    if (newPassword) {
      sheet.getRange(rowIndex, 4).setValue(encodePassword(newPassword));
      changedFields.push("password=***");
    }

    if (changedFields.length === 0) return createJsonResponse({ success: false, error: "ไม่มีข้อมูลที่ต้องการแก้ไข" });

    writeAuditLog(employeeId, "UPDATE_PROFILE", employeeId, changedFields.join(", "));

    // Return updated user info (without password)
    const updatedName = newName || String(data[i][1] || "").trim();
    const role = normalizeRole(data[i][2] || "GUEST");
    const token = generateToken(employeeId, role, getApiKey());

    return createJsonResponse({
      success: true,
      user: { employeeId, name: updatedName, role, token }
    });
  }

  return createJsonResponse({ success: false, error: "ไม่พบผู้ใช้งาน" });
}
