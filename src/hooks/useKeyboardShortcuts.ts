import { useEffect } from 'react';
import { useUIStore } from '../store';
import { createNote } from '../db';

export function useKeyboardShortcuts() {
  const toggleCommandPalette = useUIStore((state) => state.toggleCommandPalette);
  const setCommandPaletteOpen = useUIStore((state) => state.setCommandPaletteOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const isCommandPaletteOpen = useUIStore((state) => state.isCommandPaletteOpen);
  const isTrashOpen = useUIStore((state) => state.isTrashOpen);
  const setTrashOpen = useUIStore((state) => state.setTrashOpen);
  const setActiveNoteId = useUIStore((state) => state.setActiveNoteId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + K: Toggle Command Palette
      if (modifier && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }

      // Cmd/Ctrl + \: Toggle Sidebar
      if (modifier && e.key === '\\') {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Cmd/Ctrl + Alt + N: Quick New Note
      if (modifier && e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        createNote(null, 'Untitled').then((newNote) => {
          setActiveNoteId(newNote.id);
        });
        return;
      }

      // Escape key: close open modals
      if (e.key === 'Escape') {
        if (isCommandPaletteOpen) {
          e.preventDefault();
          setCommandPaletteOpen(false);
        } else if (isTrashOpen) {
          e.preventDefault();
          setTrashOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    toggleCommandPalette,
    setCommandPaletteOpen,
    toggleSidebar,
    isCommandPaletteOpen,
    isTrashOpen,
    setTrashOpen,
    setActiveNoteId,
  ]);
}
