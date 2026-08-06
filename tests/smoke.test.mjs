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

test('event timing is validated even in client fallback mode', async () => {
  const env = { ADMIN_PASSCODE: 'private-passcode' };
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
