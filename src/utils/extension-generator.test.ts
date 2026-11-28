import test from 'node:test';
import assert from 'node:assert';
import { getExtensionSourceFiles, generatePngIconBase64 } from './extension-generator.js';

test('manifest.json is present at root and contains valid Manifest V3 structure', () => {
  const files = getExtensionSourceFiles();
  const manifestFile = files.find((f) => f.path === 'manifest.json');

  assert.ok(manifestFile, 'manifest.json must be present in the source files');
  assert.equal(manifestFile.category, 'manifest');

  const parsed = JSON.parse(manifestFile.code);
  assert.equal(parsed.manifest_version, 3);
  assert.equal(parsed.name, 'ScrollMeter - Short-form Video Tracker');
  assert.ok(parsed.permissions.includes('storage'));
  assert.ok(parsed.permissions.includes('alarms'));
  assert.ok(parsed.permissions.includes('notifications'));
  assert.ok(parsed.host_permissions.some((p: string) => p.includes('youtube.com')));
  assert.ok(parsed.host_permissions.some((p: string) => p.includes('instagram.com')));
  assert.ok(parsed.host_permissions.some((p: string) => p.includes('tiktok.com')));
  assert.ok(parsed.host_permissions.some((p: string) => p.includes('facebook.com')));
  assert.equal(parsed.action.default_popup, 'popup/popup.html');
  assert.ok(parsed.commands);
  assert.equal(parsed.commands._execute_action.suggested_key.default, 'Alt+Shift+S');
  assert.equal(parsed.commands['toggle-tracking'].suggested_key.default, 'Alt+Shift+P');
});

test('generatePngIconBase64 returns valid base64 string', () => {
  const b64 = generatePngIconBase64(16);
  assert.ok(typeof b64 === 'string');
  assert.ok(b64.length > 0);
});

test('service-worker.js includes midnight alarm reset and alarms onAlarm listener', () => {
  const files = getExtensionSourceFiles();
  const sw = files.find((f) => f.path === 'background/service-worker.js');
  assert.ok(sw, 'background/service-worker.js must exist');
  assert.ok(sw.code.includes('chrome.alarms.onAlarm.addListener'));
  assert.ok(sw.code.includes('midnight-badge-reset'));
  assert.ok(sw.code.includes('scheduleMidnightResetAlarm'));
});

