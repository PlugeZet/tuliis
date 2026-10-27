import { useCallback, useEffect, useRef } from 'react';
import { updateNote } from '../db';
import { useUIStore } from '../store';
import type { NoteUpdateInput } from '../types';

export function useAutoSave(noteId: string | null, delay = 400) {
  const pendingUpdatesRef = useRef<NoteUpdateInput | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noteIdRef = useRef<string | null>(noteId);
  const setSaveStatus = useUIStore((state) => state.setSaveStatus);

  // Update noteId reference
  useEffect(() => {
    // If switching notes, flush any pending changes for the previous note first
    if (noteIdRef.current && noteIdRef.current !== noteId && pendingUpdatesRef.current) {
      const prevId = noteIdRef.current;
      const updates = pendingUpdatesRef.current;
      pendingUpdatesRef.current = null;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      updateNote(prevId, updates).catch(console.error);
      setSaveStatus('saved');
    }
    noteIdRef.current = noteId;
  }, [noteId, setSaveStatus]);

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (noteIdRef.current && pendingUpdatesRef.current) {
      const updates = pendingUpdatesRef.current;
      pendingUpdatesRef.current = null;
      try {
        await updateNote(noteIdRef.current, updates);
      } finally {
        setSaveStatus('saved');
      }
    }
  }, [setSaveStatus]);

  const triggerSave = useCallback(
    (updates: NoteUpdateInput) => {
      if (!noteIdRef.current) return;

      // Merge pending updates
      pendingUpdatesRef.current = {
        ...pendingUpdatesRef.current,
        ...updates,
      };

      setSaveStatus('saving');

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(async () => {
        timerRef.current = null;
        if (noteIdRef.current && pendingUpdatesRef.current) {
          const toSave = pendingUpdatesRef.current;
          pendingUpdatesRef.current = null;
          try {
            await updateNote(noteIdRef.current, toSave);
          } finally {
            setSaveStatus('saved');
          }
        }
      }, delay);
    },
    [delay, setSaveStatus]
  );

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (noteIdRef.current && pendingUpdatesRef.current) {
        const id = noteIdRef.current;
        const updates = pendingUpdatesRef.current;
        pendingUpdatesRef.current = null;
        updateNote(id, updates).catch(console.error);
        setSaveStatus('saved');
      }
    };
  }, [setSaveStatus]);

  return {
    triggerSave,
    flush,
  };
}
