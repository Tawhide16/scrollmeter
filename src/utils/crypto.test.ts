import test from 'node:test';
import assert from 'node:assert';
import { 
  encryptData, 
  decryptData, 
  createVerificationToken, 
  verifyPassphrase 
} from './crypto.ts';

test('Web Crypto AES-GCM: encrypts and decrypts payload correctly', async () => {
  const sampleData = {
    user: 'local_privacy_test',
    viewCount: 42,
    platforms: ['youtube', 'instagram', 'tiktok', 'facebook'],
  };

  const passphrase = 'SuperSecurePassphrase123!';
  const encrypted = await encryptData(sampleData, passphrase);

  assert.strictEqual(encrypted.version, 1);
  assert.ok(encrypted.cipherTextBase64.length > 0);
  assert.ok(encrypted.ivBase64.length > 0);
  assert.ok(encrypted.saltBase64.length > 0);

  // Decrypt with correct passphrase
  const decrypted = await decryptData<typeof sampleData>(encrypted, passphrase);
  assert.deepStrictEqual(decrypted, sampleData);
});

test('Web Crypto AES-GCM: rejects decryption with incorrect passphrase', async () => {
  const sampleData = { secret: 'Confidential viewing history' };
  const encrypted = await encryptData(sampleData, 'CorrectPass123');

  await assert.rejects(
    async () => {
      await decryptData(encrypted, 'WrongPass456');
    },
    /Incorrect passphrase/
  );
});

test('Web Crypto verification token authenticates valid passphrases', async () => {
  const token = await createVerificationToken('MyLocalVaultKey');
  const isValid = await verifyPassphrase(token, 'MyLocalVaultKey');
  assert.strictEqual(isValid, true);

  const isInvalid = await verifyPassphrase(token, 'InvalidVaultKey');
  assert.strictEqual(isInvalid, false);
});
