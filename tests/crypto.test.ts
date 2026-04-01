/**
 * Comprehensive tests for the crypto utility functions.
 */
import { describe, it, expect } from 'vitest';
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  arrayBufferToHex,
  hexToArrayBuffer,
  concatBuffers,
  generateId
} from '../client/src/crypto/utils';

describe('Crypto Utilities', () => {
  describe('Base64 encoding/decoding', () => {
    it('should encode and decode empty buffer', () => {
      const buffer = new ArrayBuffer(0);
      const encoded = arrayBufferToBase64(buffer);
      const decoded = base64ToArrayBuffer(encoded);
      expect(decoded.byteLength).toBe(0);
    });

    it('should encode and decode single byte', () => {
      const buffer = new Uint8Array([0]).buffer;
      const encoded = arrayBufferToBase64(buffer);
      expect(encoded).toBe('AA==');
      const decoded = base64ToArrayBuffer(encoded);
      expect(new Uint8Array(decoded)[0]).toBe(0);
    });

    it('should encode and decode 255 byte', () => {
      const buffer = new Uint8Array([255]).buffer;
      const encoded = arrayBufferToBase64(buffer);
      expect(encoded).toBe('/w==');
      const decoded = base64ToArrayBuffer(encoded);
      expect(new Uint8Array(decoded)[0]).toBe(255);
    });

    it('should roundtrip a multi-byte buffer', () => {
      const original = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const encoded = arrayBufferToBase64(original.buffer);
      expect(encoded).toBe('SGVsbG8=');
      const decoded = base64ToArrayBuffer(encoded);
      expect(Array.from(new Uint8Array(decoded))).toEqual([72, 101, 108, 108, 111]);
    });

    it('should roundtrip all byte values 0-255', () => {
      const allBytes = new Uint8Array(256);
      for (let i = 0; i < 256; i++) allBytes[i] = i;
      const encoded = arrayBufferToBase64(allBytes.buffer);
      const decoded = new Uint8Array(base64ToArrayBuffer(encoded));
      expect(Array.from(decoded)).toEqual(Array.from(allBytes));
    });

    it('should roundtrip a large buffer (64KB)', () => {
      // Node.js crypto.getRandomValues limits to 65536 bytes per call
      const large = new Uint8Array(65536);
      crypto.getRandomValues(large);
      const encoded = arrayBufferToBase64(large.buffer);
      const decoded = new Uint8Array(base64ToArrayBuffer(encoded));
      expect(decoded.length).toBe(large.length);
      expect(Array.from(decoded.slice(0, 100))).toEqual(Array.from(large.slice(0, 100)));
      expect(Array.from(decoded.slice(-100))).toEqual(Array.from(large.slice(-100)));
    });

    it('should roundtrip a 1MB buffer constructed without getRandomValues', () => {
      const large = new Uint8Array(1024 * 1024);
      // Fill with pattern instead of crypto.getRandomValues (which has 64KB limit)
      for (let i = 0; i < large.length; i++) {
        large[i] = i & 0xFF;
      }
      const encoded = arrayBufferToBase64(large.buffer);
      const decoded = new Uint8Array(base64ToArrayBuffer(encoded));
      expect(decoded.length).toBe(large.length);
      expect(Array.from(decoded.slice(0, 100))).toEqual(Array.from(large.slice(0, 100)));
    });
  });

  describe('Hex encoding/decoding', () => {
    it('should encode and decode empty buffer', () => {
      const buffer = new ArrayBuffer(0);
      const encoded = arrayBufferToHex(buffer);
      expect(encoded).toBe('');
      const decoded = hexToArrayBuffer(encoded);
      expect(decoded.byteLength).toBe(0);
    });

    it('should encode to lowercase hex', () => {
      const buffer = new Uint8Array([0, 15, 255]).buffer;
      const encoded = arrayBufferToHex(buffer);
      expect(encoded).toBe('000fff');
    });

    it('should roundtrip a buffer', () => {
      const original = new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF]);
      const hex = arrayBufferToHex(original.buffer);
      expect(hex).toBe('deadbeef');
      const decoded = new Uint8Array(hexToArrayBuffer(hex));
      expect(Array.from(decoded)).toEqual([0xDE, 0xAD, 0xBE, 0xEF]);
    });

    it('should roundtrip all byte values', () => {
      const allBytes = new Uint8Array(256);
      for (let i = 0; i < 256; i++) allBytes[i] = i;
      const hex = arrayBufferToHex(allBytes.buffer);
      expect(hex.length).toBe(512);
      const decoded = new Uint8Array(hexToArrayBuffer(hex));
      expect(Array.from(decoded)).toEqual(Array.from(allBytes));
    });
  });

  describe('Buffer concatenation', () => {
    it('should concatenate empty buffers', () => {
      const result = concatBuffers(new ArrayBuffer(0), new ArrayBuffer(0));
      expect(result.byteLength).toBe(0);
    });

    it('should concatenate two buffers', () => {
      const a = new Uint8Array([1, 2, 3]);
      const b = new Uint8Array([4, 5, 6]);
      const result = new Uint8Array(concatBuffers(a.buffer, b.buffer));
      expect(Array.from(result)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should concatenate three buffers', () => {
      const a = new Uint8Array([1]);
      const b = new Uint8Array([2]);
      const c = new Uint8Array([3]);
      const result = new Uint8Array(concatBuffers(a.buffer, b.buffer, c.buffer));
      expect(Array.from(result)).toEqual([1, 2, 3]);
    });

    it('should handle concatenating with empty buffer', () => {
      const a = new Uint8Array([1, 2]);
      const empty = new ArrayBuffer(0);
      const result = new Uint8Array(concatBuffers(empty, a.buffer, empty));
      expect(Array.from(result)).toEqual([1, 2]);
    });
  });

  describe('ID generation', () => {
    it('should generate a 32-character hex string', () => {
      const id = generateId();
      expect(id).toMatch(/^[0-9a-f]{32}$/);
    });

    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(100);
    });
  });
});
