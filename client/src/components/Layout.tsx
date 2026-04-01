import { ReactNode, useEffect } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { Toast } from './Toast';
import { ThemeToggle } from './ThemeToggle';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const isDark = useSettingsStore((s) => s.isDark());
  useKeyboardShortcuts();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 text-vault-600 dark:text-vault-400 font-bold text-xl">
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
            <path d="M12 11v4M12 7h.01" />
          </svg>
          CipherVault
        </a>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">
            AES-256-GCM • Client-side encryption
          </span>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t bg-white dark:bg-gray-900 px-4 py-2 text-center text-xs text-gray-400 dark:text-gray-500">
        All encryption happens in your browser. The server never sees your plaintext or password.
      </footer>
      <Toast />
    </div>
  );
}
