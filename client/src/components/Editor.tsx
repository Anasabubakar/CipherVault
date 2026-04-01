import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useNoteStore } from '../store/noteStore';

interface EditorProps {
  tabId: string;
}

export function Editor({ tabId }: EditorProps) {
  const { tabs, updateTabContent } = useNoteStore();
  const tab = tabs.find((t) => t.id === tabId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showLineNumbers, setShowLineNumbers] = useState(true);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [tab?.content]);

  if (!tab) return null;

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const content = tab.content;
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      updateTabContent(tabId, newContent);
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      });
    }
  };

  const lines = tab.content.split('\n');

  return (
    <div className="flex-1 flex flex-col relative">
      <div className="flex items-center justify-between px-3 py-1 bg-gray-50 dark:bg-gray-850 border-b text-xs text-gray-400">
        <span>{lines.length} lines • {tab.content.length} characters</span>
        <button
          onClick={() => setShowLineNumbers(!showLineNumbers)}
          className="hover:text-gray-600 dark:hover:text-gray-300"
        >
          {showLineNumbers ? '#' : '—'}
        </button>
      </div>
      <div className="flex-1 flex overflow-auto">
        {showLineNumbers && (
          <div className="text-right pr-2 pl-3 py-3 text-xs text-gray-300 dark:text-gray-600 select-none font-mono bg-gray-50 dark:bg-gray-900/50">
            {lines.map((_, i) => (
              <div key={i} className="leading-6">{i + 1}</div>
            ))}
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={tab.content}
          onChange={(e) => updateTabContent(tabId, e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 p-3 font-mono text-sm bg-white dark:bg-gray-900 resize-none outline-none min-h-[400px] leading-6"
          placeholder="Start typing your encrypted notes..."
          spellCheck={false}
          aria-label={`Editor for ${tab.title}`}
        />
      </div>
    </div>
  );
}
