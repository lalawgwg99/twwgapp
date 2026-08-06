/**
 * Cloudflare Pages Function: shared event data, registration rules and admin auth.
 */

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;
const LOGIN_BLOCK_MS = 15 * 60 * 1000;
const LOGIN_ATTEMPT_LIMIT = 5;

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch (_error) {
    return jsonResponse({ success: false, error: "請求格式錯誤" }, 400);
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return jsonResponse({ success: false, error: "請求格式錯誤" }, 400);
  }

  const action = data.action;
  const configuredPasscode = env.ADMIN_PASSCODE;
  const suppliedCredential = request.headers.get("X-Admin-Token") || "";

  try {
    if (action === "verify_admin") {
      if (!configuredPasscode) {
        return jsonResponse({ success: false, error: "管理密碼尚未在 Cloudflare 設定" }, 503);
      }
      if (!env.ADMIN_TOKEN_SECRET) {
        return jsonResponse({ success: false, error: "管理權杖密鑰尚未在 Cloudflare 設定" }, 503);
      }
      const throttle = await getLoginThrottle(request, env);
      if (throttle.blocked) {
        return jsonResponse({ success: false, error: "登入嘗試次數過多，請 15 分鐘後再試" }, 429);
      }
      if (!constantTimeEqual(String(data.passcode || ""), configuredPasscode)) {
        await recordFailedLogin(throttle, env);
        return jsonResponse({ success: false, error: "管理密碼不正確" }, 401);
      }
      await clearLoginThrottle(throttle, env);
      return jsonResponse({
        success: true,
        isAdmin: true,
        token: await createAdminToken(env)
      });
    }

    if (action === "verify_token") {
      const valid = await validateAdminToken(suppliedCredential, env);
      return valid
        ? jsonResponse({ success: true, isAdmin: true })
        : jsonResponse({ success: false, error: "管理工作階段已失效" }, 401);
    }

    if (action === "register") {
      return await registerAttendee(data, env);
    }

    const protectedActions = new Set(["create_event", "update_event", "delete_event", "set_checkin", "delete_registration", "update_setting"]);
    if (protectedActions.has(action)) {
      if (!(await validateAdminToken(suppliedCredential, env))) {
        return jsonResponse({ success: false, error: "管理權限不足或工作階段已失效" }, 401);
      }
    }

    if (action === "create_event") {
      const event = normalizeEvent(data.event);
      const error = validateEvent(event);
      if (error) return jsonResponse({ success: false, error }, 400);
      if (!env.DB) return databaseUnavailable();

      await env.DB.prepare(
        `INSERT INTO events
          (id, name, category, custom_badge, price_tier, date, start_date, end_date,
           description, max_people, location, image_url, phone_required, custom_questions, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
      ).bind(
        event.id, event.name, event.category, event.customBadge, event.priceTier,
        event.date, event.startDate, event.endDate, event.description, event.maxPeople,
        event.location, event.image, JSON.stringify(event.customQuestions), event.createdAt
      ).run();
      return jsonResponse({ success: true, event });
    }

    if (action === "update_event") {
      const event = normalizeEvent(data.event);
      const error = validateEvent(event);
      if (error) return jsonResponse({ success: false, error }, 400);
      if (!env.DB) return databaseUnavailable();

      const result = await env.DB.prepare(
        `UPDATE events SET name = ?, category = ?, custom_badge = ?, price_tier = ?,
          date = ?, start_date = ?, end_date = ?, description = ?, max_people = ?,
          location = ?, image_url = ?, custom_questions = ? WHERE id = ?`
      ).bind(
        event.name, event.category, event.customBadge, event.priceTier, event.date,
        event.startDate, event.endDate, event.description, event.maxPeople,
        event.location, event.image, JSON.stringify(event.customQuestions), event.id
      ).run();
      if (!result.meta?.changes) return jsonResponse({ success: false, error: "找不到活動" }, 404);
      return jsonResponse({ success: true, event });
    }

    if (action === "delete_event") {
      const eventId = String(data.eventId || "").trim();
      if (!eventId) return jsonResponse({ success: false, error: "缺少活動編號" }, 400);
      if (!env.DB) return databaseUnavailable();
      await env.DB.batch([
        env.DB.prepare("DELETE FROM registrations WHERE event_id = ?").bind(eventId),
        env.DB.prepare("DELETE FROM events WHERE id = ?").bind(eventId)
      ]);
      return jsonResponse({ success: true });
    }

    if (action === "set_checkin") {
      if (!env.DB) return databaseUnavailable();
      const result = await env.DB.prepare(
        "UPDATE registrations SET checked_in = ? WHERE id = ? AND event_id = ?"
      ).bind(data.checkedIn ? 1 : 0, String(data.registrationId || ""), String(data.eventId || "")).run();
      if (!result.meta?.changes) return jsonResponse({ success: false, error: "找不到報名紀錄" }, 404);
      return jsonResponse({ success: true });
    }

    if (action === "delete_registration") {
      const eventId = String(data.eventId || "").trim();
      const registrationId = String(data.registrationId || "").trim();
      if (!eventId || !registrationId || eventId.length > 100 || registrationId.length > 100) {
        return jsonResponse({ success: false, error: "報名紀錄格式不正確" }, 400);
      }
      if (!env.DB) return databaseUnavailable();
      const result = await env.DB.prepare(
        "DELETE FROM registrations WHERE id = ? AND event_id = ?"
      ).bind(registrationId, eventId).run();
      if (!result.meta?.changes) return jsonResponse({ success: false, error: "找不到報名紀錄" }, 404);
      return jsonResponse({ success: true });
    }

    if (action === "update_setting") {
      const key = String(data.key || "");
      if (!["hero", "quickLinks"].includes(key) || !data.value || typeof data.value !== "object") {
        return jsonResponse({ success: false, error: "網站設定格式不正確" }, 400);
      }
      const serialized = JSON.stringify(data.value);
      if (serialized.length > 1500000) return jsonResponse({ success: false, error: "設定圖片檔案過大" }, 413);
      if (!env.DB) return databaseUnavailable();
      await env.DB.prepare(
        `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
      ).bind(key, serialized, Date.now()).run();
      return jsonResponse({ success: true });
    }
  } catch (error) {
    if (String(error.message || "").includes("UNIQUE")) {
      return jsonResponse({ success: false, error: "此電話號碼已報名過本活動" }, 409);
    }
    console.error("Events API error:", error);
    return jsonResponse({ success: false, error: "伺服器暫時無法處理，請稍後再試" }, 500);
  }

  return jsonResponse({ success: false, error: "未知操作" }, 400);
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) {
    return jsonResponse({ success: true, mode: "client_sync", events: [] });
  }

  const token = request.headers.get("X-Admin-Token") || "";
  const isAdmin = await validateAdminToken(token, env);

  try {
    const [{ results = [] }, { results: settingRows = [] }] = await Promise.all([
      env.DB.prepare("SELECT * FROM events ORDER BY date ASC, created_at DESC").all(),
      env.DB.prepare("SELECT key, value FROM settings WHERE key IN ('hero', 'quickLinks')").all()
    ]);
    const allowedSettingKeys = new Set(["hero", "quickLinks"]);
    const settings = Object.fromEntries(
      settingRows
        .filter(row => allowedSettingKeys.has(row.key))
        .map(row => [row.key, parseJson(row.value, {})])
    );
    const events = await Promise.all(results.map(async (row) => {
      const { results: registrations = [] } = await env.DB.prepare(
        `SELECT id, name, email, phone, is_proxy, proxy_name, proxy_email, answers,
          checked_in, registered_at FROM registrations WHERE event_id = ? ORDER BY registered_at ASC`
      ).bind(row.id).all();

      return {
        id: row.id,
        name: row.name,
        category: row.category,
        customBadge: row.custom_badge || "",
        priceTier: row.price_tier || "",
        date: row.date,
        startDate: row.start_date || "",
        endDate: row.end_date || "",
        description: row.description || "",
        maxPeople: row.max_people,
        location: row.location || "",
        image: row.image_url || "",
        phoneRequired: true,
        customQuestions: parseJson(row.custom_questions, []),
        createdAt: row.created_at,
        registrations: isAdmin
          ? registrations.map(normalizeRegistration)
          : registrations.map(() => ({}))
      };
    }));
    return jsonResponse({ success: true, mode: "database", viewer: isAdmin ? "admin" : "public", events, settings });
  } catch (error) {
    console.error("D1 fetch error:", error);
    return jsonResponse({ success: false, error: "活動資料讀取失敗" }, 500);
  }
}

async function registerAttendee(data, env) {
  if (String(data.website || '').trim()) {
    return jsonResponse({ success: true });
  }
  const eventId = String(data.eventId || "").trim();
  const attendeeName = String(data.attendeeName || "").trim();
  const attendeePhone = normalizePhone(data.attendeePhone);
  const attendeeEmail = String(data.attendeeEmail || "").trim();
  const isProxy = Boolean(data.isProxy);
  const proxyName = String(data.proxyName || "").trim();
  const proxyEmail = String(data.proxyEmail || "").trim();
  const serializedAnswers = JSON.stringify(data.answers || {});

  if (!eventId || !attendeeName || attendeeName.length > 80 || !/^09\d{8}$/.test(attendeePhone)) {
    return jsonResponse({ success: false, error: "請填寫有效的姓名與台灣手機號碼" }, 400);
  }
  if (attendeeEmail && !isEmail(attendeeEmail)) {
    return jsonResponse({ success: false, error: "Email 格式不正確" }, 400);
  }
  if (attendeeEmail.length > 254 || proxyEmail.length > 254 || proxyName.length > 80) {
    return jsonResponse({ success: false, error: "報名資料超過長度限制" }, 400);
  }
  if (serializedAnswers.length > 30000) {
    return jsonResponse({ success: false, error: "問卷答案內容過長" }, 413);
  }
  if (isProxy && (!proxyName || !isEmail(proxyEmail))) {
    return jsonResponse({ success: false, error: "請填寫代報人姓名與有效 Email" }, 400);
  }
  if (!env.DB) return databaseUnavailable();

  const event = await env.DB.prepare(
    "SELECT id, start_date, end_date, max_people FROM events WHERE id = ?"
  ).bind(eventId).first();
  if (!event) return jsonResponse({ success: false, error: "活動不存在或已下架" }, 404);

  const now = Date.now();
  if (event.start_date && now < parseTaipeiDateTime(event.start_date)) {
    return jsonResponse({ success: false, error: "活動尚未開放報名" }, 409);
  }
  if (event.end_date && now > parseTaipeiDateTime(event.end_date)) {
    return jsonResponse({ success: false, error: "活動報名已截止" }, 409);
  }

  const id = crypto.randomUUID();
  const result = await env.DB.prepare(
    `INSERT INTO registrations
      (id, event_id, name, email, phone, is_proxy, proxy_name, proxy_email,
       answers, checked_in, registered_at)
     SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?
     WHERE (SELECT COUNT(*) FROM registrations WHERE event_id = ?) < ?`
  ).bind(
    id, eventId, attendeeName, attendeeEmail, attendeePhone, isProxy ? 1 : 0,
    proxyName, proxyEmail, serializedAnswers, now,
    eventId, Number(event.max_people)
  ).run();
  if (!result.meta?.changes) return jsonResponse({ success: false, error: "活動名額已滿" }, 409);
  return jsonResponse({ success: true, registrationId: id });
}

function normalizeEvent(raw = {}) {
  return {
    id: String(raw.id || "").trim(),
    name: String(raw.name || "").trim(),
    category: String(raw.category || "").trim(),
    customBadge: String(raw.customBadge || "").trim(),
    priceTier: String(raw.priceTier || "").trim(),
    date: String(raw.date || "").trim(),
    startDate: String(raw.startDate || "").trim(),
    endDate: String(raw.endDate || "").trim(),
    description: String(raw.description || "").trim(),
    maxPeople: Number(raw.maxPeople),
    location: String(raw.location || "").trim(),
    image: String(raw.image || "").trim(),
    customQuestions: Array.isArray(raw.customQuestions) ? raw.customQuestions.slice(0, 30) : [],
    createdAt: Number(raw.createdAt) || Date.now()
  };
}

function validateEvent(event) {
  if (!event.id || !event.name || !event.category || !event.date || !event.endDate) return "活動必填欄位不完整";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date) ||
      !Number.isFinite(parseTaipeiDateTime(`${event.date}T00:00`)) ||
      !Number.isFinite(parseTaipeiDateTime(event.endDate))) return "活動日期格式不正確";
  if (event.startDate && !Number.isFinite(parseTaipeiDateTime(event.startDate))) return "報名開放時間格式不正確";
  if (!Number.isInteger(event.maxPeople) || event.maxPeople < 1 || event.maxPeople > 9999) return "人數上限必須介於 1 到 9999";
  if (event.startDate && parseTaipeiDateTime(event.startDate) >= parseTaipeiDateTime(event.endDate)) return "報名截止時間必須晚於開放時間";
  if (parseTaipeiDateTime(event.endDate) >= parseTaipeiDateTime(`${event.date}T23:59:59`)) return "報名截止時間必須早於活動結束日";
  if (event.id.length > 100 || event.name.length > 120 || event.category.length > 40 ||
      event.customBadge.length > 60 || event.priceTier.length > 60 || event.location.length > 300 ||
      event.description.length > 3000 || JSON.stringify(event.customQuestions).length > 30000) {
    return "活動文字內容超過長度限制";
  }
  if (event.image.length > 1000000) return "活動圖片檔案過大";
  if (event.image && !/^(?:https:\/\/|data:image\/(?:jpeg|png|webp);base64,|assets\/)/i.test(event.image)) {
    return "活動圖片必須使用 HTTPS 網址或圖片檔案";
  }
  return "";
}

function normalizeRegistration(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    isProxy: Boolean(row.is_proxy),
    proxyName: row.proxy_name,
    proxyEmail: row.proxy_email,
    answers: parseJson(row.answers, {}),
    checkedIn: Boolean(row.checked_in),
    registeredAt: row.registered_at
  };
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseTaipeiDateTime(value) {
  const text = String(value || '');
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(text);
  return new Date(hasTimezone ? text : `${text}+08:00`).getTime();
}

function parseJson(value, fallback) {
  try { return JSON.parse(value || ""); } catch (_error) { return fallback; }
}

async function getLoginThrottle(request, env) {
  const clientIp = request.headers.get("CF-Connecting-IP") || "";
  if (!clientIp || !env.DB) return { key: "", attempts: 0, blocked: false };

  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS admin_login_attempts (
      key TEXT PRIMARY KEY,
      attempts INTEGER NOT NULL DEFAULT 0,
      blocked_until INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    )`
  ).run();
  const now = Date.now();
  await env.DB.prepare("DELETE FROM admin_login_attempts WHERE updated_at < ?")
    .bind(now - 24 * 60 * 60 * 1000).run();
  const key = await sign(clientIp, env.ADMIN_TOKEN_SECRET);
  const row = await env.DB.prepare(
    "SELECT attempts, blocked_until FROM admin_login_attempts WHERE key = ?"
  ).bind(key).first();

  if (row?.blocked_until && Number(row.blocked_until) > now) {
    return { key, attempts: Number(row.attempts) || 0, blocked: true };
  }
  if (row?.blocked_until) {
    await env.DB.prepare("DELETE FROM admin_login_attempts WHERE key = ?").bind(key).run();
    return { key, attempts: 0, blocked: false };
  }
  return { key, attempts: Number(row?.attempts) || 0, blocked: false };
}

async function recordFailedLogin(throttle, env) {
  if (!throttle.key || !env.DB) return;
  const attempts = throttle.attempts + 1;
  const blockedUntil = attempts >= LOGIN_ATTEMPT_LIMIT ? Date.now() + LOGIN_BLOCK_MS : 0;
  await env.DB.prepare(
    `INSERT INTO admin_login_attempts (key, attempts, blocked_until, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET attempts = excluded.attempts,
       blocked_until = excluded.blocked_until, updated_at = excluded.updated_at`
  ).bind(throttle.key, attempts, blockedUntil, Date.now()).run();
}

async function clearLoginThrottle(throttle, env) {
  if (!throttle.key || !env.DB) return;
  await env.DB.prepare("DELETE FROM admin_login_attempts WHERE key = ?").bind(throttle.key).run();
}

async function createAdminToken(env) {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const signature = await sign(String(expiresAt), env.ADMIN_TOKEN_SECRET);
  return `${expiresAt}.${signature}`;
}

async function validateAdminToken(token, env) {
  if (!env.ADMIN_PASSCODE || !env.ADMIN_TOKEN_SECRET || !token || String(token).length > 512) return false;
  const [expiresAt, signature, extra] = String(token).split(".");
  if (extra || !/^\d+$/.test(expiresAt) || Number(expiresAt) < Date.now()) return false;
  const expected = await sign(expiresAt, env.ADMIN_TOKEN_SECRET);
  return constantTimeEqual(signature, expected);
}

async function sign(value, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function constantTimeEqual(left, right) {
  left = String(left || "");
  right = String(right || "");
  let mismatch = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i++) mismatch |= (left.charCodeAt(i) || 0) ^ (right.charCodeAt(i) || 0);
  return mismatch === 0;
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function databaseUnavailable() {
  return jsonResponse({ success: false, error: "資料庫尚未連線，為避免資料遺失已停止寫入" }, 503);
}
