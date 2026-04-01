import { useCallback } from 'react';
import { computeSiteHash, encrypt, decrypt, createEncryptedBlob, parseEncryptedBlob } from '../crypto/engine';
import { fetchNote, saveNote, deleteNote } from '../api/client';
import { useNoteStore } from '../store/noteStore';
import type { Tab } from '../types';

export function useNote() {
  const store = useNoteStore();

  const loadNote = useCallback(async (siteUrl: string, password: string) => {
    store.setLoading(true);
    store.setError(null);

    try {
      const siteHash = await computeSiteHash(siteUrl);
      store.setSiteUrl(siteUrl);
      store.setSiteHash(siteHash);
      store.setPassword(password);

      const response = await fetchNote(siteHash);

      if (!response.note) {
        store.setTabs([{
          id: crypto.randomUUID(),
          title: 'Tab 1',
          content: '',
          order: 0
        }]);
        store.setContentHash(null);
        store.setModified(false);
        return;
      }

      const payload = parseEncryptedBlob(response.note.encrypted_blob);
      store.setEncryptedPayload(payload);

      const plaintext = await decrypt(payload, password, siteUrl);
      const tabs: Tab[] = JSON.parse(plaintext);

      store.setTabs(tabs);
      store.setContentHash(response.note.content_hash);
      store.setModified(false);
    } catch (error) {
      store.setError((error as Error).message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  const saveCurrentNote = useCallback(async () => {
    if (!store.siteUrl || !store.password) {
      throw new Error('No active note to save');
    }

    store.setLoading(true);
    store.setError(null);

    try {
      const plaintext = JSON.stringify(store.tabs);
      const { payload } = await encrypt(plaintext, store.password, store.siteUrl);
      const encryptedBlob = createEncryptedBlob(payload);

      const result = await saveNote(store.siteHash, {
        encrypted_blob: encryptedBlob,
        content_hash: payload.contentHash,
        expected_hash: store.contentHash || undefined
      });

      if (result.conflict) {
        throw new Error('Conflict: Another edit was made since you last saved. Please reload.');
      }

      store.setContentHash(result.content_hash);
      store.setEncryptedPayload(payload);
      store.setModified(false);
      store.addToast('success', 'Note saved successfully');
    } catch (error) {
      store.setError((error as Error).message);
      store.addToast('error', (error as Error).message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  const deleteCurrentNote = useCallback(async () => {
    if (!store.siteHash) {
      throw new Error('No active note to delete');
    }

    store.setLoading(true);

    try {
      await deleteNote(store.siteHash);
      store.reset();
      store.addToast('success', 'Note deleted successfully');
    } catch (error) {
      store.setError((error as Error).message);
      store.addToast('error', (error as Error).message);
      throw error;
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  return { loadNote, saveCurrentNote, deleteCurrentNote };
}
