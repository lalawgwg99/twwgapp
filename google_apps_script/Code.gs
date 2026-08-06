/**
 * Google Apps Script (GAS) Backend - Senior-Friendly & Commercial Pro Edition
 * Features: CacheService Rate Limiting, MailApp Automatic Confirmations, Phone Deduplication & Onsite Rapid Check-in
 */

const ADMIN_PASSCODE = "admin888"; // 主辦單位後端安全密碼

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  // 1. CacheService Rate Limiting (防刷 API DDOS 限速：單一 Client 每分鐘限制 30 次)
  const cache = CacheService.getScriptCache();
  const clientIp = (e && e.parameter && e.parameter.ip) || "client_default";
  const rateKey = "rate_limit_" + clientIp;
  const currentCount = Number(cache.get(rateKey) || 0);

  if (currentCount > 30) {
    return jsonResponse({ success: false, error: "流量過高：API 請求頻率過快，請於一分鐘後再試 (429 Too Many Requests)" }, 429);
  }
  cache.put(rateKey, String(currentCount + 1), 60);

  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    let params = {};
    if (e && e.postData && e.postData.contents) {
      params = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      params = e.parameter;
    }

    const action = params.action || "get_events";
    const userPasscode = params.passcode || "";
    const isAdmin = (userPasscode === ADMIN_PASSCODE);

    const ss = SpreadsheetApp.getActiveSpreadsheet() || getOrCreateSpreadsheet();
    const eventsSheet = getOrCreateSheet(ss, "Events");
    const regSheet = getOrCreateSheet(ss, "Registrations");

    // A. 獲取活動列表 (公開/管理員)
    if (action === "get_events") {
      const eventsData = getEventsData(eventsSheet, regSheet, isAdmin);
      return jsonResponse({ success: true, events: eventsData });
    }

    // B. 後端安全驗證密碼
    if (action === "verify_admin" || action === "verify_token") {
      if (isAdmin || userPasscode.indexOf("auth_token_") === 0) {
        const token = "auth_token_" + Utilities.base64Encode(ADMIN_PASSCODE + ":" + Date.now());
        return jsonResponse({ success: true, token: token, message: "後端驗證成功" });
      } else {
        return jsonResponse({ success: false, error: "密碼錯誤，拒絕存取" }, 401);
      }
    }

    // C. 公開報名 (老人友善：電話必填，Email選填，支持代報名與電話重複檢查)
    if (action === "register") {
      const { eventId, attendeeName, attendeePhone, attendeeEmail, isProxy, proxyName, proxyEmail, answers } = params;

      if (!eventId || !attendeeName || !attendeePhone) {
        return jsonResponse({ success: false, error: "長輩姓名與聯絡電話為必填欄位" });
      }

      // 重複報名檢查 (以電話號碼做為唯一值)
      const data = regSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][1] === eventId && String(data[i][4]) === String(attendeePhone)) {
          return jsonResponse({ success: false, error: "此電話號碼已報名過本活動，請勿重複報名！" }, 409);
        }
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

      // GAS 自動發送 Confirmation Email (若有填寫 Email)
      const targetEmail = isProxy ? proxyEmail : attendeeEmail;
      if (targetEmail) {
        try {
          MailApp.sendEmail({
            to: targetEmail,
            subject: "【報名成功確認】您的活動報名紀錄",
            body: `親愛的 ${isProxy ? proxyName : attendeeName} 您好：\n\n感謝您報名活動！\n參加者姓名：${attendeeName}\n聯絡電話：${attendeePhone}\n報名編號：${regId}\n\n若您有任何問題，歡迎隨時聯繫主辦單位。\n祝您活動愉快！`
          });
        } catch (mailErr) {
          console.warn("MailApp Email Send Error:", mailErr);
        }
      }

      return jsonResponse({ success: true, message: "報名成功！資料已寫入 Google 試算表" });
    }

    // D. 現場快速報名 (管理員模式：現場為老人報名並直接標記簽到)
    if (action === "onsite_register") {
      if (!isAdmin) {
        return jsonResponse({ success: false, error: "未授權" }, 401);
      }

      const { eventId, name, phone, autoCheckin } = params;
      const regId = "ONSITE-" + Date.now();
      regSheet.appendRow([
        regId,
        eventId,
        name,
        "",
        phone,
        "{}",
        autoCheckin ? "已報到" : "未報到",
        new Date(),
        "現場工作人員報名",
        ""
      ]);

      return jsonResponse({ success: true, message: "現場報名並簽到成功" });
    }

    // E. 管理員：發布新活動
    if (action === "create_event") {
      if (!isAdmin) {
        return jsonResponse({ success: false, error: "權限不足" }, 401);
      }

      const ev = params.event;
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
        new Date()
      ]);

      return jsonResponse({ success: true, message: "新活動已新增至 Google 試算表" });
    }

    // F. 管理員：切換簽到狀態
    if (action === "toggle_checkin") {
      if (!isAdmin) {
        return jsonResponse({ success: false, error: "權限不足" }, 401);
      }

      const { eventId, phone } = params;
      const data = regSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][1] === eventId && String(data[i][4]) === String(phone)) {
          const currentStatus = data[i][6];
          const newStatus = (currentStatus === "已報到") ? "未報到" : "已報到";
          regSheet.getRange(i + 1, 7).setValue(newStatus);
          return jsonResponse({ success: true, checkedIn: (newStatus === "已報到") });
        }
      }
      return jsonResponse({ success: false, error: "找不到該報名資料" });
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
      sheet.appendRow(["ID", "名稱", "分類", "特色標籤", "票價", "日期", "說明", "人數上限", "地點", "圖片URL", "電話必填", "自訂問卷JSON", "建立時間"]);
    } else if (sheetName === "Registrations") {
      sheet.appendRow(["報名編號", "活動ID", "參加者姓名", "Email", "電話", "問卷回答JSON", "簽到狀態", "報名時間", "代報名模式", "代報人Email"]);
    }
  }
  return sheet;
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
            name: regData[j][2],
            email: regData[j][3],
            phone: regData[j][4],
            answers: JSON.parse(regData[j][5] || "{}"),
            checkedIn: (regData[j][6] === "已報到"),
            registeredAt: regData[j][7]
          });
        } else {
          evRegs.push({}); // Sanitize privacy for public users
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
      phoneRequired: (evData[i][10] === "是"),
      customQuestions: JSON.parse(evData[i][11] || "[]"),
      registrations: evRegs
    });
  }

  return events;
}
