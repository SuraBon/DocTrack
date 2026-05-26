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
