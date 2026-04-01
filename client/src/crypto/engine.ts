/**
 * CipherVault Crypto Engine
 * AES-256-GCM encryption via WebCrypto API with HKDF key expansion and HMAC authentication.
 *
 * Crypto Flow:
 *   1. siteHash = SHA-256(siteURL)
 *   2. masterKey = argon2id_chain(password, siteHash, target_ms=300)
 *   3. encKey = HKDF(masterKey, salt=siteHash, info="enc", 32 bytes)
 *   4. authKey = HKDF(masterKey, salt=siteHash, info="auth", 32 bytes)
 *   5. iv = crypto.getRandomValues(12 bytes)
 *   6. ciphertext = AES-256-GCM(encKey, iv, plaintext + siteHash)
 *   7. mac = HMAC-SHA-256(authKey, ciphertext)
 *   8. return base64(iv + ciphertext + mac)
 */
import { sha256, hmacSha256, verifyHmac } from './hash';
import { deriveBothKeys } from './hkdf';
import { adaptiveDeriveKey } from './kdf';
import {
  arrayBufferToBase64,
  base64ToArrayBuffer
} from './utils';
import type { EncryptedPayload, KdfParams } from '../types';

const IV_LENGTH = 12;
const GCM_TAG_LENGTH = 128;

export async function computeSiteHash(siteUrl: string): Promise<string> {
  const normalized = siteUrl.trim().toLowerCase();
  const hash = await sha256(normalized);
  return arrayBufferToBase64(hash);
}

export async function encrypt(
  plaintext: string,
  password: string,
  siteUrl: string
): Promise<{ payload: EncryptedPayload; kdfParams: KdfParams }> {
  const siteHashRaw = await sha256(siteUrl.trim().toLowerCase());

  const derived = await adaptiveDeriveKey(password, siteHashRaw);
  const { encKey, authKey } = await deriveBothKeys(derived.key, siteHashRaw);

  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const encoder = new TextEncoder();
  const siteHashSuffix = new Uint8Array(siteHashRaw);
  const plaintextBytes = encoder.encode(plaintext);

  const combined = new Uint8Array(plaintextBytes.byteLength + siteHashSuffix.byteLength);
  combined.set(plaintextBytes, 0);
  combined.set(siteHashSuffix, plaintextBytes.byteLength);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: GCM_TAG_LENGTH },
    encKey,
    combined
  );

  const ciphertext = ciphertextBuffer;
  const mac = await hmacSha256(authKey, ciphertext);

  const payload: EncryptedPayload = {
    iv: arrayBufferToBase64(iv.buffer),
    ciphertext: arrayBufferToBase64(ciphertext),
    mac: arrayBufferToBase64(mac),
    contentHash: arrayBufferToBase64(await sha256(ciphertext))
  };

  return { payload, kdfParams: derived.params };
}

export async function decrypt(
  payload: EncryptedPayload,
  password: string,
  siteUrl: string
): Promise<string> {
  const siteHashRaw = await sha256(siteUrl.trim().toLowerCase());

  const derived = await adaptiveDeriveKey(password, siteHashRaw);
  const { encKey, authKey } = await deriveBothKeys(derived.key, siteHashRaw);

  const ciphertextBuffer = base64ToArrayBuffer(payload.ciphertext);
  const macBuffer = base64ToArrayBuffer(payload.mac);

  const isValid = await verifyHmac(authKey, macBuffer, ciphertextBuffer);
  if (!isValid) {
    throw new Error('Decryption failed: invalid authentication tag (wrong password or corrupted data)');
  }

  const iv = base64ToArrayBuffer(payload.iv);

  let combined: ArrayBuffer;
  try {
    combined = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv), tagLength: GCM_TAG_LENGTH },
      encKey,
      ciphertextBuffer
    );
  } catch {
    throw new Error('Decryption failed: GCM authentication failed (wrong password or corrupted data)');
  }

  const combinedBytes = new Uint8Array(combined);
  const siteHashBytes = new Uint8Array(siteHashRaw);
  const siteHashLen = siteHashBytes.byteLength;

  if (combinedBytes.byteLength < siteHashLen) {
    throw new Error('Decryption failed: plaintext too short, missing site hash suffix');
  }

  const plaintextBytes = combinedBytes.slice(0, combinedBytes.byteLength - siteHashLen);
  const suffixBytes = combinedBytes.slice(combinedBytes.byteLength - siteHashLen);

  let suffixMatch = true;
  for (let i = 0; i < siteHashLen; i++) {
    if (siteHashBytes[i] !== suffixBytes[i]) {
      suffixMatch = false;
    }
  }

  if (!suffixMatch) {
    throw new Error('Decryption failed: wrong password (site hash mismatch)');
  }

  const decoder = new TextDecoder();
  return decoder.decode(plaintextBytes);
}

export async function changePassword(
  payload: EncryptedPayload,
  oldPassword: string,
  newPassword: string,
  siteUrl: string
): Promise<{ payload: EncryptedPayload; kdfParams: KdfParams }> {
  const plaintext = await decrypt(payload, oldPassword, siteUrl);
  return encrypt(plaintext, newPassword, siteUrl);
}

export function createEncryptedBlob(payload: EncryptedPayload): string {
  const data = JSON.stringify(payload);
  return arrayBufferToBase64(new TextEncoder().encode(data).buffer);
}

export function parseEncryptedBlob(blob: string): EncryptedPayload {
  try {
    const json = new TextDecoder().decode(base64ToArrayBuffer(blob));
    const parsed = JSON.parse(json);
    if (!parsed.iv || !parsed.ciphertext || !parsed.mac) {
      throw new Error('Invalid encrypted blob format');
    }
    return parsed as EncryptedPayload;
  } catch (e) {
    throw new Error(`Failed to parse encrypted blob: ${(e as Error).message}`);
  }
}
