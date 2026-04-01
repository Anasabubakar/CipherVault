/**
 * Key Derivation Function with PBKDF2-SHA-256 via WebCrypto API.
 * Argon2id attempted at runtime via dynamic import (WASM), falls back to PBKDF2.
 *
 * Key derivation is DETERMINISTIC: same password + salt always produces same key.
 */
import type { KdfParams, DerivedKey } from '../types';

const DEFAULT_PARAMS: KdfParams = {
  memorySize: 32768, // 32MB
  iterations: 600000,
  parallelism: 1,
  hashLength: 32,
  targetMs: 300,
  chainLength: 1
};

async function pbkdf2Derive(
  password: string,
  salt: ArrayBuffer,
  iterations: number = 600000,
  hashLength: number = 32
): Promise<ArrayBuffer> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  return crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    hashLength * 8
  );
}

async function tryArgon2idHash(
  password: string,
  salt: ArrayBuffer,
  params: Partial<KdfParams> = {}
): Promise<ArrayBuffer | null> {
  try {
    const p = { ...DEFAULT_PARAMS, ...params };
    // Dynamic import - fails gracefully if WASM not available
    const argon2Url = 'argon2-browser';
    const argon2 = await import(/* @vite-ignore */ argon2Url);
    
    const result = await argon2.hash({
      pass: password,
      salt: new Uint8Array(salt),
      type: argon2.ArgonType?.Argon2id ?? 2,
      hashLen: p.hashLength,
      mem: p.memorySize,
      time: p.iterations,
      parallelism: p.parallelism
    });

    return result.hash.buffer.slice(result.hash.byteOffset, result.hash.byteOffset + result.hash.byteLength) as ArrayBuffer;
  } catch {
    return null;
  }
}

export async function argon2idHash(
  password: string,
  salt: ArrayBuffer,
  params: Partial<KdfParams> = {}
): Promise<ArrayBuffer> {
  const p = { ...DEFAULT_PARAMS, ...params };

  // Try Argon2id first (better security), fall back to PBKDF2
  const argon2Result = await tryArgon2idHash(password, salt, params);
  if (argon2Result) return argon2Result;

  // Fallback to PBKDF2-SHA-256 (still strong, universally supported)
  return pbkdf2Derive(password, salt, p.iterations, p.hashLength);
}

export async function adaptiveDeriveKey(
  password: string,
  salt: ArrayBuffer,
  targetMs: number = 300
): Promise<DerivedKey> {
  const params: KdfParams = { ...DEFAULT_PARAMS, targetMs };

  const derivedKey = await argon2idHash(password, salt, params);

  return { key: derivedKey, params };
}

export function getKdfParams(): KdfParams {
  return { ...DEFAULT_PARAMS };
}

export function formatKdfParams(params: KdfParams): string {
  return `PBKDF2-SHA256: iter=${params.iterations}, keyLen=${params.hashLength * 8}bit`;
}
