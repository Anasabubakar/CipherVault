import { useState, useRef, useEffect } from 'react';
import { useNoteStore } from '../store/noteStore';

const PlusIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const PencilIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export function TabBar() {
  const { tabs, activeTabId, setActiveTabId, addTab, removeTab, updateTabTitle } = useNoteStore();
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTabId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTabId]);

  const startEditing = (tabId: string, currentTitle: string) => {
    setEditingTabId(tabId);
    setEditValue(currentTitle);
  };

  const finishEditing = () => {
    if (editingTabId && editValue.trim()) {
      updateTabTitle(editingTabId, editValue.trim());
    }
    setEditingTabId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      finishEditing();
    } else if (e.key === 'Escape') {
      setEditingTabId(null);
    }
  };

  return (
    <div className="flex items-center gap-1 border-b bg-gray-50 dark:bg-gray-900/80 px-2 overflow-x-auto" role="tablist">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tab"
          aria-selected={tab.id === activeTabId}
          onClick={() => setActiveTabId(tab.id)}
          className={`group flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium cursor-pointer whitespace-nowrap transition-all duration-150 ${
            tab.id === activeTabId
              ? 'bg-white dark:bg-gray-800 text-vault-600 dark:text-vault-400 border-b-2 border-vault-500 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/60'
          }`}
        >
          {editingTabId === tab.id ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={finishEditing}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none outline-none w-24 min-w-[60px] text-inherit border-b border-vault-400 px-0.5"
              aria-label={`Rename tab ${tab.title}`}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <>
              <span
                className="truncate max-w-[120px]"
                onDoubleClick={() => startEditing(tab.id, tab.title)}
              >
                {tab.title}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing(tab.id, tab.title);
                }}
                className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                aria-label={`Rename tab ${tab.title}`}
              >
                <PencilIcon />
              </button>
            </>
          )}
          {tabs.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeTab(tab.id);
              }}
              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
              aria-label={`Close tab ${tab.title}`}
            >
              <CloseIcon />
            </button>
          )}
        </div>
      ))}
      <button
        onClick={addTab}
        className="px-2 py-1.5 text-gray-400 hover:text-vault-600 dark:hover:text-vault-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ml-1"
        aria-label="Add new tab"
      >
        <PlusIcon />
      </button>
    </div>
  );
}
