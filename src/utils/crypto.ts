/**
 * Local-First Web Crypto API Encryption Layer for ScrollMeter
 * 
 * Provides AES-GCM 256-bit encryption with PBKDF2 (SHA-256) key derivation.
 * Conforms to local-first privacy requirements:
 * - Zero network dependencies
 * - Secure local key derivation with unique 16-byte cryptographically secure salt
 * - 12-byte IV per encryption operation
 * - Verification sentinel to authenticate passwords without storing plaintext
 */

export interface EncryptedPayload {
  version: 1;
  cipherTextBase64: string;
  ivBase64: string;
  saltBase64: string;
  authTagValid: boolean;
}

const SENTINEL_PHRASE = 'SCROLLMETER_SECURE_AUTH_SENTINEL_V1';
const PBKDF2_ITERATIONS = 100000;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derives an AES-GCM 256-bit key from a user passphrase and salt using PBKDF2
 */
export async function deriveKeyFromPassphrase(
  passphrase: string,
  saltBuffer: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passphraseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passphraseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generates an encrypted string payload from any JSON-serializable object
 */
export async function encryptData(
  data: unknown,
  passphrase: string,
  providedSalt?: string
): Promise<EncryptedPayload> {
  const salt = providedSalt
    ? new Uint8Array(base64ToArrayBuffer(providedSalt))
    : crypto.getRandomValues(new Uint8Array(16));

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyFromPassphrase(passphrase, salt);

  const payloadString = JSON.stringify({
    sentinel: SENTINEL_PHRASE,
    timestamp: Date.now(),
    payload: data,
  });

  const encodedData = new TextEncoder().encode(payloadString);

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encodedData
  );

  return {
    version: 1,
    cipherTextBase64: arrayBufferToBase64(encryptedBuffer),
    ivBase64: arrayBufferToBase64(iv),
    saltBase64: arrayBufferToBase64(salt),
    authTagValid: true,
  };
}

/**
 * Decrypts an encrypted payload with the user passphrase
 */
export async function decryptData<T>(
  encryptedPayload: EncryptedPayload,
  passphrase: string
): Promise<T> {
  const salt = new Uint8Array(base64ToArrayBuffer(encryptedPayload.saltBase64));
  const iv = new Uint8Array(base64ToArrayBuffer(encryptedPayload.ivBase64));
  const cipherBytes = base64ToArrayBuffer(encryptedPayload.cipherTextBase64);

  const key = await deriveKeyFromPassphrase(passphrase, salt);

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      cipherBytes
    );

    const decryptedString = new TextDecoder().decode(decryptedBuffer);
    const parsed = JSON.parse(decryptedString);

    if (parsed.sentinel !== SENTINEL_PHRASE) {
      throw new Error('Invalid authentication sentinel in decrypted payload');
    }

    return parsed.payload as T;
  } catch (err) {
    throw new Error('Incorrect passphrase or corrupted encrypted storage');
  }
}

/**
 * Validates a passphrase against an encrypted verification token
 */
export async function verifyPassphrase(
  verificationToken: EncryptedPayload,
  passphrase: string
): Promise<boolean> {
  try {
    await decryptData<string>(verificationToken, passphrase);
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates a verification token to test passphrases without decrypting entire event store
 */
export async function createVerificationToken(passphrase: string): Promise<EncryptedPayload> {
  return encryptData('VERIFIED_PASSPHRASE', passphrase);
}
