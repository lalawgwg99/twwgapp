import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, script, css] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../app.js', import.meta.url), 'utf8'),
  readFile(new URL('../styles.css', import.meta.url), 'utf8')
]);

test('HTML ids are unique', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(ids.filter((id, index) => ids.indexOf(id) !== index), []);
});

test('every inline event handler references an implemented function', () => {
  const browserBuiltIns = new Set(['close', 'confirm', 'open', 'scrollTo']);
  const handlers = [...html.matchAll(/on(?:click|submit|change|input)="([^"]+)"/g)]
    .flatMap(match => [...match[1].matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)].map(call => call[1]))
    .filter(name => name !== 'if' && !browserBuiltIns.has(name));
  const missing = [...new Set(handlers)].filter(name => (
    !script.includes(`window.${name} =`) && !script.includes(`function ${name}(`)
  ));
  assert.deepEqual(missing, []);
});

test('CSS delimiters remain balanced', () => {
  assert.equal((css.match(/{/g) || []).length, (css.match(/}/g) || []).length);
});

test('the public page permits browser zoom and uses versioned assets', () => {
  assert.doesNotMatch(html, /user-scalable\s*=\s*no|maximum-scale\s*=\s*1/);
  assert.match(html, /styles\.css\?v=20260806_pro8/);
  assert.match(html, /app\.js\?v=20260806_pro8/);
});

test('production frontend uses only the same-origin Cloudflare API', () => {
  assert.match(script, /fetch\('\/api\/events'/);
  assert.doesNotMatch(html, /openGASSettingModal|串接 GAS/);
  assert.doesNotMatch(script, /script\.google\.com/);
});

test('Hero scheduling and event image controls are complete', () => {
  assert.match(html, /id="hero-input-startdate"/);
  assert.match(html, /id="hero-input-enddate"/);
  assert.match(html, /id="hero-input-countdown-enabled"/);
  assert.match(html, /id="edit-event-img-file"/);
});

test('Hero image is never cropped and the logo links home', () => {
  assert.match(css, /\.hero-poster-img\s*\{[^}]*object-fit:\s*contain/s);
  assert.doesNotMatch(css, /\.hero-poster-box\s*\{[^}]*aspect-ratio:\s*2\s*\/\s*1/s);
  assert.match(html, /<a href="\/" class="brand-home-link"[^>]*aria-label="回到萬家福五甲店活動首頁"/);
});

test('admin login refreshes private registration data before opening the dashboard', () => {
  assert.match(script, /adminSessionToken = token;[\s\S]*?await syncEventsFromBackend\(\);[\s\S]*?switchView\('admin'\)/);
  assert.match(html, /onclick="refreshAdminData\(event\)"/);
  assert.match(script, /完整名單尚未載入/);
});

test('the top announcement bar and its settings are fully removed', () => {
  for (const source of [html, script, css]) {
    assert.doesNotMatch(source, /service-announcement|service-strip|announcement-ticker|跑馬燈/);
  }
});

test('frequent public controls provide 44px touch targets', () => {
  assert.match(css, /\.quick-link-pill\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.pill-btn\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.footer-section a\s*\{[^}]*min-height:\s*44px/s);
  assert.match(css, /\.footer-social-links a\s*\{[^}]*width:\s*44px[^}]*height:\s*44px/s);
});

test('admins can cancel one registration with confirmation and release its spot', () => {
  assert.match(script, /requestBackend\('delete_registration'/);
  assert.match(script, /刪除後會立即釋放名額，且無法復原/);
  assert.match(script, /class="btn-registration-delete"/);
  assert.match(script, /registrations\.splice\(regIndex, 1\)/);
});

test('store description includes hardware, appliances and 3C products', () => {
  assert.match(script, /居家五金、家電與 3C 用品/);
});
