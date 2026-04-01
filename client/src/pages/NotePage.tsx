import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNoteStore } from '../store/noteStore';
import { useSettingsStore } from '../store/settingsStore';
import { useNote } from '../hooks/useNote';
import { PasswordDialog } from '../components/PasswordDialog';
import { TabBar } from '../components/TabBar';
import { Editor } from '../components/Editor';
import { MarkdownPreview } from '../components/MarkdownPreview';
import { Toolbar } from '../components/Toolbar';
import { Loader } from '../components/Loader';
import { ExportDialog } from '../components/ExportDialog';
import { ImportDialog } from '../components/ImportDialog';

export function NotePage() {
  const { siteName } = useParams<{ siteName: string }>();
  const navigate = useNavigate();
  const { tabs, isLoading, error, password, siteUrl } = useNoteStore();
  const { settings } = useSettingsStore();
  const { loadNote, saveCurrentNote, deleteCurrentNote } = useNote();

  const [showPasswordDialog, setShowPasswordDialog] = useState(true);
  const [isNewNote, setIsNewNote] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const decodedName = decodeURIComponent(siteName || '');

  useEffect(() => {
    if (!decodedName) {
      navigate('/');
    }
  }, [decodedName, navigate]);

  useEffect(() => {
    const handleSave = () => saveCurrentNote();
    const handleNewTab = () => useNoteStore.getState().addTab();
    window.addEventListener('ciphervault:save', handleSave);
    window.addEventListener('ciphervault:new-tab', handleNewTab);
    return () => {
      window.removeEventListener('ciphervault:save', handleSave);
      window.removeEventListener('ciphervault:new-tab', handleNewTab);
    };
  }, [saveCurrentNote]);

  const handlePasswordSubmit = useCallback(async (pwd: string) => {
    try {
      await loadNote(decodedName, pwd);
      setShowPasswordDialog(false);
      setIsNewNote(false);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes('decrypt') || msg.includes('authentication')) {
        setIsNewNote(true);
      }
    }
  }, [decodedName, loadNote]);

  const handleCreateNote = useCallback(async (pwd: string) => {
    useNoteStore.getState().setPassword(pwd);
    useNoteStore.getState().setSiteUrl(decodedName);
    setShowPasswordDialog(false);
    setIsNewNote(false);
  }, [decodedName]);

  const handleDelete = useCallback(async () => {
    if (confirm('Are you sure you want to delete this note permanently?')) {
      await deleteCurrentNote();
      navigate('/');
    }
  }, [deleteCurrentNote, navigate]);

  if (!decodedName) return null;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-120px)]">
      {isLoading && <Loader message="Processing..." />}

      <PasswordDialog
        isOpen={showPasswordDialog}
        isNew={isNewNote}
        onSubmit={isNewNote ? handleCreateNote : handlePasswordSubmit}
        onCancel={() => navigate('/')}
      />

      <ExportDialog isOpen={showExport} onClose={() => setShowExport(false)} />
      <ImportDialog isOpen={showImport} onClose={() => setShowImport(false)} />

      {!showPasswordDialog && (
        <>
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b text-sm text-gray-500">
            Vault: <strong className="text-gray-900 dark:text-white">{decodedName}</strong>
            {siteUrl && <span className="ml-2 text-xs">• Encrypted with AES-256-GCM</span>}
          </div>

          <TabBar />

          <Toolbar
            onSave={saveCurrentNote}
            onDelete={handleDelete}
            onExport={() => setShowExport(true)}
            onImport={() => setShowImport(true)}
          />

          <div className="flex-1 flex overflow-hidden">
            <div className={`flex-1 flex flex-col ${settings.markdownEnabled ? 'w-1/2 border-r' : 'w-full'}`}>
              {tabs[activeTab] && <Editor tabId={tabs[activeTab].id} />}
            </div>
            {settings.markdownEnabled && tabs[activeTab] && (
              <div className="w-1/2">
                <MarkdownPreview content={tabs[activeTab].content} />
              </div>
            )}
          </div>
        </>
      )}

      {error && (
        <div className="absolute bottom-4 left-4 right-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
