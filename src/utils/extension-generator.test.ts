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
});

test('generatePngIconBase64 returns valid base64 string', () => {
  const b64 = generatePngIconBase64(16);
  assert.ok(typeof b64 === 'string');
  assert.ok(b64.length > 0);
});
