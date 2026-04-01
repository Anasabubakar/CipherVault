import { create } from 'zustand';
import type { Tab, EncryptedPayload, KdfParams, ToastMessage } from '../types';
import { generateId } from '../crypto/utils';

interface NoteStore {
  siteUrl: string;
  siteHash: string;
  password: string;
  tabs: Tab[];
  isModified: boolean;
  isLoading: boolean;
  error: string | null;
  encryptedPayload: EncryptedPayload | null;
  contentHash: string | null;
  kdfParams: KdfParams | null;
  toasts: ToastMessage[];

  setSiteUrl: (url: string) => void;
  setSiteHash: (hash: string) => void;
  setPassword: (password: string) => void;
  setTabs: (tabs: Tab[]) => void;
  addTab: () => void;
  removeTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  updateTabTitle: (id: string, title: string) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  setModified: (modified: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setEncryptedPayload: (payload: EncryptedPayload | null) => void;
  setContentHash: (hash: string | null) => void;
  setKdfParams: (params: KdfParams | null) => void;
  addToast: (type: ToastMessage['type'], message: string, durationMs?: number) => void;
  removeToast: (id: string) => void;
  reset: () => void;
}

const createDefaultTab = (): Tab => ({
  id: generateId(),
  title: 'Tab 1',
  content: '',
  order: 0
});

const initialState = {
  siteUrl: '',
  siteHash: '',
  password: '',
  tabs: [createDefaultTab()],
  isModified: false,
  isLoading: false,
  error: null,
  encryptedPayload: null,
  contentHash: null,
  kdfParams: null,
  toasts: []
};

export const useNoteStore = create<NoteStore>((set) => ({
  ...initialState,

  setSiteUrl: (siteUrl) => set({ siteUrl }),
  setSiteHash: (siteHash) => set({ siteHash }),
  setPassword: (password) => set({ password }),

  setTabs: (tabs) => set({ tabs, isModified: true }),

  addTab: () =>
    set((state) => {
      const newTab: Tab = {
        id: generateId(),
        title: `Tab ${state.tabs.length + 1}`,
        content: '',
        order: state.tabs.length
      };
      return { tabs: [...state.tabs, newTab], isModified: true };
    }),

  removeTab: (id) =>
    set((state) => {
      if (state.tabs.length <= 1) return state;
      const tabs = state.tabs
        .filter((t) => t.id !== id)
        .map((t, i) => ({ ...t, order: i }));
      return { tabs, isModified: true };
    }),

  updateTabContent: (id, content) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, content } : t)),
      isModified: true
    })),

  updateTabTitle: (id, title) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, title } : t)),
      isModified: true
    })),

  reorderTabs: (fromIndex, toIndex) =>
    set((state) => {
      const tabs = [...state.tabs];
      const [moved] = tabs.splice(fromIndex, 1);
      tabs.splice(toIndex, 0, moved);
      return { tabs: tabs.map((t, i) => ({ ...t, order: i })), isModified: true };
    }),

  setModified: (isModified) => set({ isModified }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setEncryptedPayload: (encryptedPayload) => set({ encryptedPayload }),
  setContentHash: (contentHash) => set({ contentHash }),
  setKdfParams: (kdfParams) => set({ kdfParams }),

  addToast: (type, message, durationMs = 4000) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id: generateId(), type, message, durationMs }
      ]
    })),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    })),

  reset: () => set({ ...initialState, tabs: [createDefaultTab()] })
}));
