/**
 * Google Apps Script (GAS) Backend for Apple Native Event Registration App
 * Web App Deployment Strategy for Google Sheets & Server-side Security
 */

const ADMIN_PASSCODE = "admin888"; // 設定主辦單位真實後端安全密碼

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
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

    // 1. 公開瀏覽：獲取活動列表 (若非管理員，不傳回報名個資)
    if (action === "get_events") {
      const eventsData = getEventsData(eventsSheet, regSheet, isAdmin);
      return jsonResponse({ success: true, events: eventsData });
    }

    // 2. 後端真正驗證管理員密碼
    if (action === "verify_admin") {
      if (isAdmin) {
        const token = Utilities.base64Encode(ADMIN_PASSCODE + ":" + Date.now());
        return jsonResponse({ success: true, token: token, message: "管理員驗證成功" });
      } else {
        return jsonResponse({ success: false, error: "密碼錯誤，拒絕存取" });
      }
    }

    // 3. 公開報名：參加者填寫報名表
    if (action === "register") {
      const { eventId, name, email, phone, answers } = params;
      if (!eventId || !name || !email) {
        return jsonResponse({ success: false, error: "缺少必填欄位" });
      }

      regSheet.appendRow([
        "REG-" + Date.now(),
        eventId,
        name,
        email,
        phone || "",
        JSON.stringify(answers || {}),
        "未報到",
        new Date()
      ]);

      return jsonResponse({ success: true, message: "報名成功！資料已存入 Google 試算表" });
    }

    // 4. 管理員限定：發布新活動
    if (action === "create_event") {
      if (!isAdmin) {
        return jsonResponse({ success: false, error: "權限不足，後端拒絕執行" });
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

      return jsonResponse({ success: true, message: "活動已新增至 Google 試算表" });
    }

    // 5. 管理員限定：切換簽到狀態
    if (action === "toggle_checkin") {
      if (!isAdmin) {
        return jsonResponse({ success: false, error: "權限不足" });
      }

      const { eventId, email } = params;
      const data = regSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][1] === eventId && data[i][3] === email) {
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

function jsonResponse(obj) {
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
      sheet.appendRow(["報名編號", "活動ID", "姓名", "Email", "電話", "問卷回答JSON", "簽到狀態", "報名時間"]);
    }
  }
  return sheet;
}
