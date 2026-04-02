import { useNoteStore } from '../store/noteStore';
import { useSettingsStore } from '../store/settingsStore';

interface ToolbarProps {
  onSave: () => void;
  onDelete: () => void;
  onExport: () => void;
  onImport: () => void;
}

const SaveIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ExportIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const ImportIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export function Toolbar({ onSave, onDelete, onExport, onImport }: ToolbarProps) {
  const { isModified, isLoading } = useNoteStore();
  const { settings, setMarkdownEnabled } = useSettingsStore();

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b bg-white dark:bg-gray-900/80">
      <button
        onClick={onSave}
        disabled={!isModified || isLoading}
        className="btn-primary text-sm"
        title="Save (Ctrl+S)"
      >
        <SaveIcon />
        <span>Save</span>
      </button>

      <button
        onClick={() => setMarkdownEnabled(!settings.markdownEnabled)}
        className={`btn-secondary text-sm ${settings.markdownEnabled ? 'ring-2 ring-vault-500' : ''}`}
        title="Toggle Markdown preview"
      >
        <EyeIcon />
        <span>Preview</span>
      </button>

      <div className="flex-1" />

      <button
        onClick={onExport}
        className="btn-secondary text-sm"
        title="Export encrypted backup"
      >
        <ExportIcon />
        <span className="hidden sm:inline">Export</span>
      </button>

      <button
        onClick={onImport}
        className="btn-secondary text-sm"
        title="Import encrypted backup"
      >
        <ImportIcon />
        <span className="hidden sm:inline">Import</span>
      </button>

      <button
        onClick={onDelete}
        disabled={isLoading}
        className="btn-danger text-sm"
        title="Delete this note permanently"
      >
        <TrashIcon />
        <span className="hidden sm:inline">Delete</span>
      </button>

      {isModified && (
        <span className="text-xs text-amber-500 dark:text-amber-400 ml-2 flex items-center gap-1" role="status">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="8" />
          </svg>
          Unsaved
        </span>
      )}
    </div>
  );
}
