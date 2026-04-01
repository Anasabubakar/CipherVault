export interface Tab {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface Note {
  siteHash: string;
  tabs: Tab[];
  createdAt: string;
  updatedAt: string;
}

export interface EncryptedPayload {
  iv: string;
  ciphertext: string;
  mac: string;
  contentHash: string;
}

export interface ApiNote {
  site_hash: string;
  encrypted_blob: string;
  content_hash: string;
  created_at: string;
  updated_at: string;
}

export interface ApiGetResponse {
  note: ApiNote | null;
}

export interface ApiPostRequest {
  encrypted_blob: string;
  content_hash: string;
  expected_hash?: string;
}

export interface ApiPostResponse {
  success: boolean;
  content_hash: string;
  conflict?: boolean;
}

export interface ApiDeleteResponse {
  success: boolean;
}

export interface KdfParams {
  memorySize: number;
  iterations: number;
  parallelism: number;
  hashLength: number;
  targetMs: number;
  chainLength: number;
}

export interface DerivedKey {
  key: ArrayBuffer;
  params: KdfParams;
}

export interface ExportData {
  version: string;
  siteHash: string;
  encryptedBlob: string;
  contentHash: string;
  exportedAt: string;
  kdfParams: KdfParams;
}

export interface PasswordStrength {
  score: number;
  label: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  feedback: string[];
  crackTime: string;
}

export type Theme = 'light' | 'dark' | 'system';

export interface Settings {
  theme: Theme;
  autoSave: boolean;
  autoSaveIntervalMs: number;
  markdownEnabled: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  durationMs?: number;
}
