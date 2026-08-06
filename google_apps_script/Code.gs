/**
 * Google Apps Script (GAS) Backend - Event Editing, Automatic Cutoff & Senior Friendly Edition
 */

const TOKEN_TTL_SECONDS = 6 * 60 * 60;

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const cache = CacheService.getScriptCache();

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return jsonResponse({ success: false, error: "系統忙碌中，請稍後再試" });
  }

  try {
    let params = {};
    if (e && e.postData && e.postData.contents) {
      params = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      params = e.parameter;
    }

    const action = params.action || "get_events";
    const userPasscode = String(params.passcode || "");
    const userToken = String(params.token || "");
    const adminPasscode = PropertiesService.getScriptProperties().getProperty("ADMIN_PASSCODE");
    const isAdmin = Boolean(adminPasscode) && (
      userPasscode === adminPasscode || cache.get("admin_token_" + userToken) === "valid"
    );

    const ss = SpreadsheetApp.getActiveSpreadsheet() || getOrCreateSpreadsheet();
    const eventsSheet = getOrCreateSheet(ss, "Events");
    const regSheet = getOrCreateSheet(ss, "Registrations");
    const settingsSheet = getOrCreateSheet(ss, "Settings");

    if (action === "get_events") {
      const eventsData = getEventsData(eventsSheet, regSheet, isAdmin);
      return jsonResponse({ success: true, mode: "database", events: eventsData, settings: getSettingsData(settingsSheet) });
    }

    if (action === "verify_admin" || action === "verify_token") {
      if (!adminPasscode) {
        return jsonResponse({ success: false, error: "尚未設定 ADMIN_PASSCODE 指令碼屬性" });
      }
      if (isAdmin) {
        const token = userToken || Utilities.getUuid();
        cache.put("admin_token_" + token, "valid", TOKEN_TTL_SECONDS);
        return jsonResponse({ success: true, token: token, isAdmin: true, message: "後端驗證成功" });
      } else {
        return jsonResponse({ success: false, error: "密碼錯誤，拒絕存取" }, 401);
      }
    }

    if (action === "register") {
      const { eventId, attendeeName, attendeePhone, attendeeEmail, isProxy, proxyName, proxyEmail, answers } = params;
      if (String(params.website || "").trim()) return jsonResponse({ success: true });

      const rateKey = "register_" + Utilities.base64EncodeWebSafe(String(eventId) + ":" + normalizePhone(attendeePhone)).slice(0, 80);
      const attemptCount = Number(cache.get(rateKey) || 0);
      if (attemptCount >= 5) {
        return jsonResponse({ success: false, error: "嘗試次數過多，請一分鐘後再試" });
      }
      cache.put(rateKey, String(attemptCount + 1), 60);

      if (!eventId || !attendeeName || !attendeePhone) {
        return jsonResponse({ success: false, error: "長輩姓名與聯絡電話為必填欄位" });
      }
      if (!/^09\d{8}$/.test(normalizePhone(attendeePhone))) {
        return jsonResponse({ success: false, error: "請填寫有效的台灣手機號碼" });
      }
      if (attendeeEmail && !isValidEmail(attendeeEmail)) {
        return jsonResponse({ success: false, error: "Email 格式不正確" });
      }
      if (isProxy && (!proxyName || !isValidEmail(proxyEmail))) {
        return jsonResponse({ success: false, error: "請填寫代報人姓名與有效 Email" });
      }

      const evData = eventsSheet.getDataRange().getValues();
      let targetEvent = null;
      for (let i = 1; i < evData.length; i++) {
        if (evData[i][0] === eventId) {
          targetEvent = {
            maxPeople: Number(evData[i][7]) || 0,
            startDate: evData[i][13],
            endDate: evData[i][14]
          };
          break;
        }
      }

      const now = Date.now();
      if (targetEvent) {
        if (targetEvent.startDate && now < parseTaipeiDateTime(targetEvent.startDate)) {
          return jsonResponse({ success: false, error: "該活動尚未開放報名！" }, 400);
        }
        if (targetEvent.endDate && now > parseTaipeiDateTime(targetEvent.endDate)) {
          return jsonResponse({ success: false, error: "該活動報名已截止關閉！" }, 400);
        }
      }

      const data = regSheet.getDataRange().getValues();
      let eventRegistrationCount = 0;
      for (let i = 1; i < data.length; i++) {
        if (data[i][1] === eventId) eventRegistrationCount += 1;
        if (data[i][1] === eventId && normalizePhone(data[i][4]) === normalizePhone(attendeePhone)) {
          return jsonResponse({ success: false, error: "此電話號碼已報名過本活動，請勿重複報名！" }, 409);
        }
      }
      if (!targetEvent) return jsonResponse({ success: false, error: "找不到活動" });
      if (eventRegistrationCount >= targetEvent.maxPeople) {
        return jsonResponse({ success: false, error: "活動名額已滿" });
      }

      const regId = "REG-" + Date.now();
      regSheet.appendRow([
        regId,
        eventId,
        attendeeName,
        attendeeEmail || "",
        attendeePhone,
        JSON.stringify(answers || {}),
        "未報到",
        new Date(),
        isProxy ? (proxyName || "代報名") : "親自報名",
        isProxy ? (proxyEmail || "") : ""
      ]);

      const targetEmail = isProxy ? proxyEmail : attendeeEmail;
      if (targetEmail) {
        try {
          MailApp.sendEmail({
            to: targetEmail,
            subject: "【報名成功確認】您的活動報名紀錄",
            body: `親愛的 ${isProxy ? proxyName : attendeeName} 您好：\n\n感謝您報名活動！\n參加者姓名：${attendeeName}\n聯絡電話：${attendeePhone}\n報名編號：${regId}\n\n祝您活動愉快！`
          });
        } catch (mailErr) {
          console.warn("MailApp Email Send Error:", mailErr);
        }
      }

      return jsonResponse({ success: true, registrationId: regId, message: "報名成功！資料已寫入 Google 試算表" });
    }

    if (action === "create_event") {
      if (!isAdmin) {
        return jsonResponse({ success: false, error: "權限不足" }, 401);
      }

      const ev = params.event;
      const eventError = validateEventInput(ev);
      if (eventError) return jsonResponse({ success: false, error: eventError });
      eventsSheet.appendRow([
        ev.id,
        ev.name,
        ev.category,
        ev.customBadge || "",
        ev.priceTier || "",
        ev.date,
        ev.description || "",
        ev.maxPeople,
        ev.location || "",
        ev.image || "",
        ev.phoneRequired ? "是" : "否",
        JSON.stringify(ev.customQuestions || []),
        new Date(),
        ev.startDate || "",
        ev.endDate || ""
      ]);

      return jsonResponse({ success: true, message: "新活動 (含截止時間) 已新增至 Google 試算表" });
    }

    // UPDATE PUBLISHED EVENT IN GOOGLE SHEETS
    if (action === "update_event") {
      if (!isAdmin) {
        return jsonResponse({ success: false, error: "權限不足" }, 401);
      }

      const ev = params.event;
      const eventError = validateEventInput(ev);
      if (eventError) return jsonResponse({ success: false, error: eventError });
      const evData = eventsSheet.getDataRange().getValues();
      for (let i = 1; i < evData.length; i++) {
        if (evData[i][0] === ev.id) {
          eventsSheet.getRange(i + 1, 2).setValue(ev.name);
          eventsSheet.getRange(i + 1, 3).setValue(ev.category);
          eventsSheet.getRange(i + 1, 4).setValue(ev.customBadge || "");
          eventsSheet.getRange(i + 1, 5).setValue(ev.priceTier || "");
          eventsSheet.getRange(i + 1, 6).setValue(ev.date);
          eventsSheet.getRange(i + 1, 7).setValue(ev.description || "");
          eventsSheet.getRange(i + 1, 8).setValue(ev.maxPeople);
          eventsSheet.getRange(i + 1, 9).setValue(ev.location || "");
          eventsSheet.getRange(i + 1, 10).setValue(ev.image || "");
          eventsSheet.getRange(i + 1, 12).setValue(JSON.stringify(ev.customQuestions || []));
          eventsSheet.getRange(i + 1, 14).setValue(ev.startDate || "");
          eventsSheet.getRange(i + 1, 15).setValue(ev.endDate || "");
          return jsonResponse({ success: true, message: "活動設定已成功更新至 Google 試算表" });
        }
      }
      return jsonResponse({ success: false, error: "找不到該活動" });
    }

    if (action === "delete_event") {
      if (!isAdmin) return jsonResponse({ success: false, error: "權限不足" });
      const eventId = String(params.eventId || "");
      const regData = regSheet.getDataRange().getValues();
      for (let i = regData.length - 1; i >= 1; i--) {
        if (String(regData[i][1]) === eventId) regSheet.deleteRow(i + 1);
      }
      const eventData = eventsSheet.getDataRange().getValues();
      for (let i = eventData.length - 1; i >= 1; i--) {
        if (String(eventData[i][0]) === eventId) eventsSheet.deleteRow(i + 1);
      }
      return jsonResponse({ success: true });
    }

    if (action === "set_checkin") {
      if (!isAdmin) return jsonResponse({ success: false, error: "權限不足" });
      const regData = regSheet.getDataRange().getValues();
      for (let i = 1; i < regData.length; i++) {
        if (String(regData[i][0]) === String(params.registrationId) && String(regData[i][1]) === String(params.eventId)) {
          regSheet.getRange(i + 1, 7).setValue(params.checkedIn ? "已報到" : "未報到");
          return jsonResponse({ success: true });
        }
      }
      return jsonResponse({ success: false, error: "找不到報名紀錄" });
    }

    if (action === "update_setting") {
      if (!isAdmin) return jsonResponse({ success: false, error: "權限不足" });
      const key = String(params.key || "");
      if (["hero", "quickLinks"].indexOf(key) === -1 || !params.value) {
        return jsonResponse({ success: false, error: "網站設定格式不正確" });
      }
      const serialized = JSON.stringify(params.value);
      if (serialized.length > 1500000) return jsonResponse({ success: false, error: "設定圖片檔案過大" });
      const rows = settingsSheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === key) {
          settingsSheet.getRange(i + 1, 2, 1, 2).setValues([[serialized, new Date()]]);
          return jsonResponse({ success: true });
        }
      }
      settingsSheet.appendRow([key, serialized, new Date()]);
      return jsonResponse({ success: true });
    }

    return jsonResponse({ success: false, error: "未知指令" });

  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function jsonResponse(obj, status = 200) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

function parseTaipeiDateTime(value) {
  if (Object.prototype.toString.call(value) === "[object Date]") return value.getTime();
  const text = String(value || "");
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(text);
  return new Date(hasTimezone ? text : text + "+08:00").getTime();
}

function validateEventInput(ev) {
  if (!ev || !ev.id || !ev.name || !ev.category || !ev.date || !ev.endDate) return "活動必填欄位不完整";
  const maxPeople = Number(ev.maxPeople);
  if (!Number.isInteger(maxPeople) || maxPeople < 1 || maxPeople > 9999) return "人數上限必須介於 1 到 9999";
  if (ev.startDate && parseTaipeiDateTime(ev.startDate) >= parseTaipeiDateTime(ev.endDate)) return "報名截止時間必須晚於開放時間";
  if (parseTaipeiDateTime(ev.endDate) >= parseTaipeiDateTime(ev.date + "T23:59:59")) return "報名截止時間必須早於活動結束日";
  return "";
}

function safeParseJson(value, fallback) {
  try {
    return JSON.parse(value || "");
  } catch (err) {
    return fallback;
  }
}

function getOrCreateSpreadsheet() {
  const files = DriveApp.getFilesByName("TWWGApp_Event_Database");
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }
  return SpreadsheetApp.create("TWWGApp_Event_Database");
}

function getOrCreateSheet(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (sheetName === "Events") {
      sheet.appendRow(["ID", "名稱", "分類", "特色標籤", "票價", "日期", "說明", "人數上限", "地點", "圖片URL", "電話必填", "自訂問卷JSON", "建立時間", "開放報名時間", "報名截止時間"]);
    } else if (sheetName === "Registrations") {
      sheet.appendRow(["報名編號", "活動ID", "參加者姓名", "Email", "電話", "問卷回答JSON", "簽到狀態", "報名時間", "代報名模式", "代報人Email"]);
    } else if (sheetName === "Settings") {
      sheet.appendRow(["設定名稱", "JSON內容", "更新時間"]);
    }
  }
  return sheet;
}

function getSettingsData(settingsSheet) {
  const settings = {};
  const rows = settingsSheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const key = String(rows[i][0] || "");
    if (key) settings[key] = safeParseJson(rows[i][1], {});
  }
  return settings;
}

function getEventsData(eventsSheet, regSheet, isAdmin) {
  const events = [];
  const evData = eventsSheet.getDataRange().getValues();
  const regData = regSheet.getDataRange().getValues();

  for (let i = 1; i < evData.length; i++) {
    const evId = evData[i][0];
    const evRegs = [];

    for (let j = 1; j < regData.length; j++) {
      if (regData[j][1] === evId) {
        if (isAdmin) {
          evRegs.push({
            id: regData[j][0],
            name: regData[j][2],
            email: regData[j][3],
            phone: regData[j][4],
            isProxy: regData[j][8] !== "親自報名",
            proxyName: regData[j][8] === "親自報名" ? "" : regData[j][8],
            proxyEmail: regData[j][9] || "",
            answers: safeParseJson(regData[j][5], {}),
            checkedIn: (regData[j][6] === "已報到"),
            registeredAt: regData[j][7]
          });
        } else {
          evRegs.push({});
        }
      }
    }

    events.push({
      id: evId,
      name: evData[i][1],
      category: evData[i][2],
      customBadge: evData[i][3],
      priceTier: evData[i][4],
      date: evData[i][5],
      description: evData[i][6],
      maxPeople: evData[i][7],
      location: evData[i][8],
      image: evData[i][9],
      phoneRequired: true,
      customQuestions: safeParseJson(evData[i][11], []),
      startDate: evData[i][13] || "",
      endDate: evData[i][14] || "",
      registrations: evRegs
    });
  }

  return events;
}
