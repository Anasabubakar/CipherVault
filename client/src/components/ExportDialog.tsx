import { useNoteStore } from '../store/noteStore';
import { encrypt, createEncryptedBlob } from '../crypto/engine';
import { generateId } from '../crypto/utils';
import type { ExportData } from '../types';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportDialog({ isOpen, onClose }: ExportDialogProps) {
  const { siteUrl, siteHash, password, tabs } = useNoteStore();

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      const plaintext = JSON.stringify(tabs);
      const { payload, kdfParams } = await encrypt(plaintext, password, siteUrl);

      const exportData: ExportData = {
        version: '1.0.0',
        siteHash,
        encryptedBlob: createEncryptedBlob(payload),
        contentHash: payload.contentHash,
        exportedAt: new Date().toISOString(),
        kdfParams
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ciphervault-${siteHash.slice(0, 8)}-${generateId().slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      alert(`Export failed: ${(error as Error).message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Export encrypted backup">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Export Encrypted Backup
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          This exports your notes as an encrypted JSON file. The file is encrypted with your current password and can be imported back later.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleExport} className="btn-primary flex-1">Export</button>
        </div>
      </div>
    </div>
  );
}
