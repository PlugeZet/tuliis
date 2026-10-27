import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, FileText } from 'lucide-react';
import { db, seedInitialData, createNote } from './db';
import { useUIStore } from './store';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Editor } from './components/Editor';
import { CommandPalette } from './components/CommandPalette';
import { TrashModal } from './components/TrashModal';

export const App: React.FC = () => {
  const activeNoteId = useUIStore((state) => state.activeNoteId);
  const setActiveNoteId = useUIStore((state) => state.setActiveNoteId);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Query active note reactively
  const activeNote = useLiveQuery(
    () => (activeNoteId ? db.notes.get(activeNoteId) : undefined),
    [activeNoteId]
  );

  // Initial seed and default note selection
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        const seeded = await seedInitialData();
        if (!isMounted) return;

        if (seeded) {
          setActiveNoteId(seeded.id);
        } else {
          // If already has notes, select the most recently updated unarchived note
          const mostRecent = await db.notes
            .filter((n) => !n.isArchived)
            .reverse()
            .sortBy('updatedAt');

          if (mostRecent.length > 0 && !activeNoteId) {
            setActiveNoteId(mostRecent[0].id);
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [setActiveNoteId, activeNoteId]);

  // Handle case where active note was archived or deleted
  useEffect(() => {
    if (activeNote && activeNote.isArchived) {
      setActiveNoteId(null);
    }
  }, [activeNote, setActiveNoteId]);

  const handleCreateNewPage = async () => {
    const newNote = await createNote(null, 'Untitled');
    setActiveNoteId(newNote.id);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-[#191919] select-text">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        <Header noteId={activeNote?.id ?? null} />

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
          {isInitializing ? (
            <div className="h-full flex items-center justify-center text-xs text-[#787774]">
              Loading workspace...
            </div>
          ) : activeNote ? (
            <Editor note={activeNote} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none text-[#787774]">
              <div className="w-12 h-12 rounded-lg bg-[#F7F6F3] border border-[#E9E9E7] flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-[#787774]" />
              </div>
              <h2 className="text-sm font-semibold text-[#191919] mb-1">
                No page selected
              </h2>
              <p className="text-xs text-[#787774] max-w-xs mb-4">
                Select a page from the sidebar, press <kbd className="font-mono bg-[#F1F0EC] px-1 py-0.5 rounded text-[10px]">⌘K</kbd> to search, or create a new page.
              </p>
              <button
                type="button"
                onClick={handleCreateNewPage}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#191919] text-white text-xs font-medium rounded hover:bg-black transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create a page</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Global Modals & Palettes */}
      <CommandPalette />
      <TrashModal />
    </div>
  );
};

export default App;
