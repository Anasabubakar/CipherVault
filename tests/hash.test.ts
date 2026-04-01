/**
 * Comprehensive tests for SHA-256 and HMAC-SHA-256.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import {
  sha256,
  sha256Hex,
  sha256Base64,
  importHmacKey,
  hmacSha256,
  hmacSha256Base64,
  verifyHmac
} from '../client/src/crypto/hash';
import { arrayBufferToHex } from '../client/src/crypto/utils';

describe('Hash Functions', () => {
  describe('SHA-256', () => {
    it('should hash empty string', async () => {
      const hash = await sha256('');
      const hex = arrayBufferToHex(hash);
      // SHA-256 of empty string is a known test vector
      expect(hex).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    });

    it('should hash "abc"', async () => {
      const hash = await sha256('abc');
      const hex = arrayBufferToHex(hash);
      // SHA-256 of "abc" is a known test vector
      expect(hex).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    });

    it('should hash a longer string', async () => {
      const input = 'The quick brown fox jumps over the lazy dog';
      const hash = await sha256Hex(input);
      expect(hash).toBe('d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592');
    });

    it('should produce different hashes for different inputs', async () => {
      const hash1 = await sha256Hex('hello');
      const hash2 = await sha256Hex('Hello');
      expect(hash1).not.toBe(hash2);
    });

    it('should produce consistent hashes for same input', async () => {
      const hash1 = await sha256Hex('test-input');
      const hash2 = await sha256Hex('test-input');
      expect(hash1).toBe(hash2);
    });

    it('should hash an ArrayBuffer', async () => {
      const buffer = new Uint8Array([72, 101, 108, 108, 111]).buffer;
      const hash = await sha256Hex(buffer);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should hash base64 encoded', async () => {
      const b64 = await sha256Base64('test');
      expect(b64).toMatch(/^[A-Za-z0-9+/]+=*$/);
      // Base64 of SHA-256 is 32 bytes → 44 chars with padding
      expect(b64.length).toBe(44);
    });

    it('should handle unicode strings', async () => {
      const hash = await sha256Hex('你好世界');
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
      expect(hash).not.toBe(await sha256Hex('hello'));
    });

    it('should handle very long strings', async () => {
      const longString = 'x'.repeat(1_000_000);
      const hash = await sha256Hex(longString);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should handle strings with null bytes', async () => {
      const hash = await sha256Hex('hello\0world');
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
      expect(hash).not.toBe(await sha256Hex('hello'));
    });
  });

  describe('HMAC-SHA-256', () => {
    let hmacKey: CryptoKey;

    beforeAll(async () => {
      const keyData = new Uint8Array(32);
      for (let i = 0; i < 32; i++) keyData[i] = i;
      hmacKey = await importHmacKey(keyData.buffer);
    });

    it('should produce a valid HMAC signature', async () => {
      const data = new TextEncoder().encode('test message');
      const signature = await hmacSha256(hmacKey, data.buffer);
      expect(signature.byteLength).toBe(32); // SHA-256 produces 32-byte MAC
    });

    it('should produce consistent HMACs for same input', async () => {
      const data = new TextEncoder().encode('consistent');
      const sig1 = await hmacSha256(hmacKey, data.buffer);
      const sig2 = await hmacSha256(hmacKey, data.buffer);
      expect(arrayBufferToHex(sig1)).toBe(arrayBufferToHex(sig2));
    });

    it('should produce different HMACs for different messages', async () => {
      const data1 = new TextEncoder().encode('message1');
      const data2 = new TextEncoder().encode('message2');
      const sig1 = await hmacSha256(hmacKey, data1.buffer);
      const sig2 = await hmacSha256(hmacKey, data2.buffer);
      expect(arrayBufferToHex(sig1)).not.toBe(arrayBufferToHex(sig2));
    });

    it('should produce different HMACs with different keys', async () => {
      const key1Data = new Uint8Array(32).fill(1);
      const key2Data = new Uint8Array(32).fill(2);
      const key1 = await importHmacKey(key1Data.buffer);
      const key2 = await importHmacKey(key2Data.buffer);
      const data = new TextEncoder().encode('same message');
      const sig1 = await hmacSha256(key1, data.buffer);
      const sig2 = await hmacSha256(key2, data.buffer);
      expect(arrayBufferToHex(sig1)).not.toBe(arrayBufferToHex(sig2));
    });

    it('should verify correct signature', async () => {
      const data = new TextEncoder().encode('verify me');
      const signature = await hmacSha256(hmacKey, data.buffer);
      const isValid = await verifyHmac(hmacKey, signature, data.buffer);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect signature', async () => {
      const data = new TextEncoder().encode('verify me');
      const signature = await hmacSha256(hmacKey, data.buffer);
      // Corrupt the signature
      const corrupted = new Uint8Array(signature);
      corrupted[0] ^= 0xFF;
      const isValid = await verifyHmac(hmacKey, corrupted.buffer, data.buffer);
      expect(isValid).toBe(false);
    });

    it('should produce base64-encoded HMAC', async () => {
      const data = new TextEncoder().encode('test');
      const b64 = await hmacSha256Base64(hmacKey, data.buffer);
      expect(b64).toMatch(/^[A-Za-z0-9+/]+=*$/);
      expect(b64.length).toBe(44); // 32 bytes → 44 base64 chars
    });

    it('should handle empty message', async () => {
      const data = new ArrayBuffer(0);
      const signature = await hmacSha256(hmacKey, data);
      expect(signature.byteLength).toBe(32);
    });
  });
});
