import { useState, FormEvent } from 'react';
import { useNoteStore } from '../store/noteStore';
import { decrypt, parseEncryptedBlob } from '../crypto/engine';
import type { ExportData, Tab } from '../types';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportDialog({ isOpen, onClose }: ImportDialogProps) {
  const { setPassword, setTabs, setModified } = useNoteStore();
  const [file, setFile] = useState<File | null>(null);
  const [importPassword, setImportPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleImport = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!importPassword) {
      setError('Please enter the password for this backup');
      return;
    }

    setLoading(true);

    try {
      const text = await file.text();
      const data: ExportData = JSON.parse(text);

      if (!data.encryptedBlob || !data.version) {
        throw new Error('Invalid CipherVault export file');
      }

      const payload = parseEncryptedBlob(data.encryptedBlob);
      const plaintext = await decrypt(payload, importPassword, data.siteHash);
      const tabs: Tab[] = JSON.parse(plaintext);

      setPassword(importPassword);
      setTabs(tabs);
      setModified(true);
      onClose();
    } catch (err) {
      setError(`Import failed: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Import encrypted backup">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Import Encrypted Backup
        </h2>
        <form onSubmit={handleImport} className="space-y-4">
          <div>
            <label htmlFor="import-file" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Backup File
            </label>
            <input
              id="import-file"
              type="file"
              accept=".json"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="import-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Backup Password
            </label>
            <input
              id="import-password"
              type="password"
              value={importPassword}
              onChange={(e) => setImportPassword(e.target.value)}
              className="input"
              placeholder="Password used when exporting"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg" role="alert">
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Importing...' : 'Import'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
