/**
 * SHA-256 and HMAC-SHA-256 via WebCrypto API.
 */

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function sha256(data: string | ArrayBuffer): Promise<ArrayBuffer> {
  const input = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return crypto.subtle.digest('SHA-256', input);
}

export async function sha256Hex(data: string | ArrayBuffer): Promise<string> {
  const hash = await sha256(data);
  return arrayBufferToHex(hash);
}

export async function sha256Base64(data: string | ArrayBuffer): Promise<string> {
  const hash = await sha256(data);
  return arrayBufferToBase64(hash);
}

export async function importHmacKey(keyData: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function hmacSha256(key: CryptoKey, data: ArrayBuffer): Promise<ArrayBuffer> {
  return crypto.subtle.sign('HMAC', key, data);
}

export async function hmacSha256WithRawKey(
  rawKey: ArrayBuffer,
  data: ArrayBuffer
): Promise<ArrayBuffer> {
  const hmacKey = await importHmacKey(rawKey);
  return hmacSha256(hmacKey, data);
}

export async function hmacSha256Base64(
  key: CryptoKey,
  data: ArrayBuffer
): Promise<string> {
  const mac = await hmacSha256(key, data);
  return arrayBufferToBase64(mac);
}

export async function verifyHmac(
  key: CryptoKey,
  signature: ArrayBuffer,
  data: ArrayBuffer
): Promise<boolean> {
  return crypto.subtle.verify('HMAC', key, signature, data);
}
