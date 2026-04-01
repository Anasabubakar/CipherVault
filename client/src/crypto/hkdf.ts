/**
 * HKDF (HMAC-based Key Derivation Function) via WebCrypto API.
 * Used to derive separate encryption and authentication keys from master key.
 */

const HKDF_INFO_ENC = new TextEncoder().encode('ciphervault-enc');
const HKDF_INFO_AUTH = new TextEncoder().encode('ciphervault-auth');

export async function hkdf(
  masterKey: ArrayBuffer,
  salt: ArrayBuffer,
  info: Uint8Array,
  length: number = 32
): Promise<ArrayBuffer> {
  const importedKey = await crypto.subtle.importKey(
    'raw',
    masterKey,
    'HKDF',
    false,
    ['deriveBits']
  );

  return crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt,
      info
    },
    importedKey,
    length * 8
  );
}

export async function deriveEncKey(
  masterKey: ArrayBuffer,
  salt: ArrayBuffer
): Promise<CryptoKey> {
  const rawKey = await hkdf(masterKey, salt, HKDF_INFO_ENC, 32);

  return crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function deriveAuthKey(
  masterKey: ArrayBuffer,
  salt: ArrayBuffer
): Promise<CryptoKey> {
  const rawKey = await hkdf(masterKey, salt, HKDF_INFO_AUTH, 32);

  return crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function deriveBothKeys(
  masterKey: ArrayBuffer,
  salt: ArrayBuffer
): Promise<{ encKey: CryptoKey; authKey: CryptoKey }> {
  const [encKey, authKey] = await Promise.all([
    deriveEncKey(masterKey, salt),
    deriveAuthKey(masterKey, salt)
  ]);

  return { encKey, authKey };
}
