import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestGet, onRequestPost } from '../functions/api/events.js';

function post(body, env = {}) {
  return onRequestPost({
    request: new Request('https://example.test/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }),
    env
  });
}

test('GET provides an explicit client fallback when D1 is not bound', async () => {
  const response = await onRequestGet({ request: new Request('https://example.test/api/events'), env: {} });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, mode: 'client_sync', events: [] });
});

test('admin login fails closed when no server secret is configured', async () => {
  const response = await post({ action: 'verify_admin', passcode: 'anything' });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).success, false);
});

test('admin login fails closed when the signing secret is missing', async () => {
  const env = { ADMIN_PASSCODE: 'private-passcode' };
  const response = await post({ action: 'verify_admin', passcode: env.ADMIN_PASSCODE }, env);
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /權杖密鑰/);
});

test('admin tokens are signed and forged tokens are rejected', async () => {
  const env = { ADMIN_PASSCODE: 'a-long-private-passcode', ADMIN_TOKEN_SECRET: 'a-separate-token-secret' };
  const login = await post({ action: 'verify_admin', passcode: env.ADMIN_PASSCODE }, env);
  const loginData = await login.json();
  assert.equal(loginData.success, true);
  assert.match(loginData.token, /^\d+\.[A-Za-z0-9_-]+$/);

  const valid = await onRequestPost({
    request: new Request('https://example.test/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': loginData.token },
      body: JSON.stringify({ action: 'verify_token' })
    }),
    env
  });
  assert.equal(valid.status, 200);

  const forged = await onRequestPost({
    request: new Request('https://example.test/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': '9999999999999.forged' },
      body: JSON.stringify({ action: 'verify_token' })
    }),
    env
  });
  assert.equal(forged.status, 401);
});

test('GET explicitly distinguishes public masks from complete admin registration data', async () => {
  const eventRow = {
    id: 'event-1', name: '活動', category: '分類', custom_badge: '', price_tier: '',
    date: '2026-08-10', start_date: '', end_date: '2026-08-09T10:00',
    description: '', max_people: 10, location: '', image_url: '', custom_questions: '[]', created_at: 1
  };
  const registrationRow = {
    id: 'reg-1', name: '王小明', email: '', phone: '0912345678', is_proxy: 0,
    proxy_name: '', proxy_email: '', answers: '{}', checked_in: 0, registered_at: 1
  };
  const DB = {
    prepare(sql) {
      const statement = {
        bind() { return statement; },
        async all() {
          if (sql.startsWith('SELECT * FROM events')) return { results: [eventRow] };
          if (sql.startsWith('SELECT key, value FROM settings')) return { results: [] };
          if (sql.includes('FROM registrations WHERE event_id')) return { results: [registrationRow] };
          return { results: [] };
        }
      };
      return statement;
    }
  };
  const env = { ADMIN_PASSCODE: 'private-passcode', ADMIN_TOKEN_SECRET: 'token-secret', DB };
  const publicData = await (await onRequestGet({ request: new Request('https://example.test/api/events'), env })).json();
  assert.equal(publicData.viewer, 'public');
  assert.deepEqual(publicData.events[0].registrations, [{}]);

  const loginData = await (await post({ action: 'verify_admin', passcode: env.ADMIN_PASSCODE }, env)).json();
  const adminData = await (await onRequestGet({
    request: new Request('https://example.test/api/events', { headers: { 'X-Admin-Token': loginData.token } }),
    env
  })).json();
  assert.equal(adminData.viewer, 'admin');
  assert.equal(adminData.events[0].registrations[0].name, registrationRow.name);
  assert.equal(adminData.events[0].registrations[0].phone, registrationRow.phone);
});

test('registration rejects invalid phone numbers before storage', async () => {
  const response = await post({
    action: 'register',
    eventId: 'event-1',
    attendeeName: '測試使用者',
    attendeePhone: '123'
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /手機號碼/);
});

test('event timing is validated before database access', async () => {
  const env = { ADMIN_PASSCODE: 'private-passcode', ADMIN_TOKEN_SECRET: 'token-secret' };
  const loginData = await (await post({ action: 'verify_admin', passcode: env.ADMIN_PASSCODE }, env)).json();
  const response = await onRequestPost({
    request: new Request('https://example.test/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': loginData.token },
      body: JSON.stringify({
        action: 'create_event',
        event: { id: 'e1', name: '活動', category: '分類', date: '2026-08-10', startDate: '2026-08-09T12:00', endDate: '2026-08-09T10:00', maxPeople: 10 }
      })
    }),
    env
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /截止時間/);
});

test('check-in keeps text registration ids intact', async () => {
  const boundValues = [];
  const env = {
    ADMIN_PASSCODE: 'private-passcode',
    ADMIN_TOKEN_SECRET: 'token-secret',
    DB: {
      prepare() {
        return {
          bind(...values) {
            boundValues.push(...values);
            return { run: async () => ({ meta: { changes: 1 } }) };
          }
        };
      }
    }
  };
  const loginData = await (await post({ action: 'verify_admin', passcode: env.ADMIN_PASSCODE }, env)).json();
  const response = await onRequestPost({
    request: new Request('https://example.test/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': loginData.token },
      body: JSON.stringify({ action: 'set_checkin', eventId: 'event-1', registrationId: 'reg-uuid', checkedIn: true })
    }),
    env
  });
  assert.equal(response.status, 200);
  assert.deepEqual(boundValues, [1, 'reg-uuid', 'event-1']);
});

test('writes fail explicitly when D1 is unavailable', async () => {
  const env = { ADMIN_PASSCODE: 'private-passcode', ADMIN_TOKEN_SECRET: 'token-secret' };
  const loginData = await (await post({ action: 'verify_admin', passcode: env.ADMIN_PASSCODE }, env)).json();
  const response = await onRequestPost({
    request: new Request('https://example.test/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': loginData.token },
      body: JSON.stringify({
        action: 'create_event',
        event: { id: 'e1', name: '活動', category: '分類', date: '2026-08-10', endDate: '2026-08-09T10:00', maxPeople: 10 }
      })
    }),
    env
  });
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /停止寫入/);
});

test('admin login is blocked after five failed attempts from one source', async () => {
  const rows = new Map();
  const DB = {
    prepare(sql) {
      let values = [];
      const statement = {
        bind(...args) {
          values = args;
          return statement;
        },
        async first() {
          return rows.get(values[0]) || null;
        },
        async run() {
          if (sql.startsWith('DELETE FROM admin_login_attempts WHERE updated_at')) {
            for (const [key, row] of rows) if (row.updated_at < values[0]) rows.delete(key);
          } else if (sql.startsWith('DELETE FROM admin_login_attempts WHERE key')) {
            rows.delete(values[0]);
          } else if (sql.startsWith('INSERT INTO admin_login_attempts')) {
            rows.set(values[0], { attempts: values[1], blocked_until: values[2], updated_at: values[3] });
          }
          return { meta: { changes: 1 } };
        }
      };
      return statement;
    }
  };
  const env = { ADMIN_PASSCODE: 'correct-passcode', ADMIN_TOKEN_SECRET: 'token-secret', DB };
  const login = passcode => onRequestPost({
    request: new Request('https://example.test/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.8' },
      body: JSON.stringify({ action: 'verify_admin', passcode })
    }),
    env
  });

  for (let attempt = 0; attempt < 5; attempt++) {
    assert.equal((await login('wrong-passcode')).status, 401);
  }
  const blocked = await login('wrong-passcode');
  assert.equal(blocked.status, 429);
  assert.match((await blocked.json()).error, /15 分鐘/);
});
