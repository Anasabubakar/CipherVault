import { useNoteStore } from '../store/noteStore';
import { useSettingsStore } from '../store/settingsStore';

interface ToolbarProps {
  onSave: () => void;
  onDelete: () => void;
  onExport: () => void;
  onImport: () => void;
}

export function Toolbar({ onSave, onDelete, onExport, onImport }: ToolbarProps) {
  const { isModified, isLoading } = useNoteStore();
  const { settings, setMarkdownEnabled } = useSettingsStore();

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b bg-white dark:bg-gray-900">
      <button
        onClick={onSave}
        disabled={!isModified || isLoading}
        className="btn-primary text-sm"
        title="Save (Ctrl+S)"
      >
        💾 Save
      </button>

      <button
        onClick={() => setMarkdownEnabled(!settings.markdownEnabled)}
        className={`btn-secondary text-sm ${settings.markdownEnabled ? 'ring-2 ring-vault-500' : ''}`}
        title="Toggle Markdown preview"
      >
        📝 Preview
      </button>

      <div className="flex-1" />

      <button
        onClick={onExport}
        className="btn-secondary text-sm"
        title="Export encrypted backup"
      >
        📤 Export
      </button>

      <button
        onClick={onImport}
        className="btn-secondary text-sm"
        title="Import encrypted backup"
      >
        📥 Import
      </button>

      <button
        onClick={onDelete}
        disabled={isLoading}
        className="btn-danger text-sm"
        title="Delete this note permanently"
      >
        🗑️ Delete
      </button>

      {isModified && (
        <span className="text-xs text-orange-500 ml-2" role="status">
          Unsaved changes
        </span>
      )}
    </div>
  );
}
