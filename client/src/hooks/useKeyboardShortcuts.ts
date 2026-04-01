import { useEffect, useCallback } from 'react';
import { useNoteStore } from '../store/noteStore';

export function useKeyboardShortcuts() {
  const { isModified } = useNoteStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isMod = e.metaKey || e.ctrlKey;

    if (isMod && e.key === 's') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('ciphervault:save'));
    }

    if (isMod && e.key === 'n') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('ciphervault:new-tab'));
    }

    if (isMod && e.key === 'w') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('ciphervault:close-tab'));
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { isModified };
}
