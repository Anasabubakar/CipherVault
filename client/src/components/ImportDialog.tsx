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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Import encrypted backup">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Import Encrypted Backup
        </h2>
        <form onSubmit={handleImport} className="space-y-4">
          <div>
            <label htmlFor="import-file" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            <label htmlFor="import-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
          {error && <p className="text-sm text-red-500" role="alert">{error}</p>}
          <div className="flex gap-3">
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
