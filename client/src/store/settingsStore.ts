import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme, Settings } from '../types';

interface SettingsStore {
  settings: Settings;
  setTheme: (theme: Theme) => void;
  setAutoSave: (enabled: boolean) => void;
  setMarkdownEnabled: (enabled: boolean) => void;
  isDark: () => boolean;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: {
        theme: 'system',
        autoSave: true,
        autoSaveIntervalMs: 30000,
        markdownEnabled: false
      },

      setTheme: (theme: Theme) =>
        set((state) => ({
          settings: { ...state.settings, theme }
        })),

      setAutoSave: (enabled: boolean) =>
        set((state) => ({
          settings: { ...state.settings, autoSave: enabled }
        })),

      setMarkdownEnabled: (enabled: boolean) =>
        set((state) => ({
          settings: { ...state.settings, markdownEnabled: enabled }
        })),

      isDark: () => {
        const { theme } = get().settings;
        if (theme === 'system') {
          return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return theme === 'dark';
      }
    }),
    { name: 'ciphervault-settings' }
  )
);
