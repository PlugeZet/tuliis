import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, FileText, Plus, X, CornerDownLeft } from 'lucide-react';
import { db, createNote } from '../db';
import { useUIStore } from '../store';
import type { Note } from '../types';

const CommandPaletteModal: React.FC = () => {
  const setCommandPaletteOpen = useUIStore((state) => state.setCommandPaletteOpen);
  const setActiveNoteId = useUIStore((state) => state.setActiveNoteId);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch all active notes for fast in-memory search
  const allNotes = useLiveQuery(
    () => db.notes.filter((n) => !n.isArchived).reverse().sortBy('updatedAt'),
    []
  );

  const filteredNotes = (allNotes || []).filter((note: Note) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const titleMatch = (note.title || '').toLowerCase().includes(q);
    const contentMatch = (note.content || '').toLowerCase().includes(q);
    return titleMatch || contentMatch;
  });

  // Calculate total items (filtered notes + "Create new note" option if query is not empty)
  const hasCreateOption = query.trim().length > 0;
  const totalOptions = filteredNotes.length + (hasCreateOption ? 1 : 0);

  const handleSelectNote = (noteId: string) => {
    setActiveNoteId(noteId);
    setCommandPaletteOpen(false);
  };

  const handleCreateNew = async () => {
    const title = query.trim() || 'Untitled';
    const newNote = await createNote(null, title);
    setActiveNoteId(newNote.id);
    setCommandPaletteOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalOptions));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + Math.max(1, totalOptions)) % Math.max(1, totalOptions));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex < filteredNotes.length) {
        handleSelectNote(filteredNotes[selectedIndex].id);
      } else if (hasCreateOption) {
        handleCreateNew();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setCommandPaletteOpen(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/25 backdrop-blur-[1px] p-4 animate-in fade-in duration-100"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-white rounded-lg shadow-2xl border border-[#DFDFDE] flex flex-col overflow-hidden text-[#191919]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-3.5 py-3 border-b border-[#E9E9E7] space-x-2.5">
          <Search className="w-4 h-4 text-[#787774] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search notes or type to create..."
            value={query}
            autoFocus
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full text-sm bg-transparent outline-none text-[#191919] placeholder:text-[#999999]"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
              }}
              className="text-[#787774] hover:text-[#191919] p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="text-[10px] bg-[#F1F0EC] text-[#787774] px-1.5 py-0.5 rounded font-mono shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
          {filteredNotes.map((note, index) => {
            const isSelected = index === selectedIndex;
            return (
              <div
                key={note.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectNote(note.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-xs transition-colors ${
                  isSelected ? 'bg-[#EFEFED] text-[#191919]' : 'text-[#37352F] hover:bg-[#F7F6F3]'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <span className="text-sm shrink-0">
                    {note.icon || <FileText className="w-3.5 h-3.5 text-[#787774]" />}
                  </span>
                  <span className="truncate font-medium">
                    {note.title.trim() ? note.title : 'Untitled'}
                  </span>
                </div>

                <div className="flex items-center space-x-2 shrink-0 text-[#999999] text-[11px]">
                  <span>
                    {new Date(note.updatedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  {isSelected && <CornerDownLeft className="w-3 h-3 text-[#191919]" />}
                </div>
              </div>
            );
          })}

          {/* Quick Create Option */}
          {hasCreateOption && (
            <div
              role="button"
              tabIndex={0}
              onClick={handleCreateNew}
              className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-xs transition-colors ${
                selectedIndex === filteredNotes.length
                  ? 'bg-[#EFEFED] text-[#191919]'
                  : 'text-[#37352F] hover:bg-[#F7F6F3]'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                <Plus className="w-3.5 h-3.5 text-[#191919] shrink-0" />
                <span className="truncate">
                  Create new page: <strong className="font-semibold text-[#191919]">"{query.trim()}"</strong>
                </span>
              </div>
              <CornerDownLeft className="w-3 h-3 text-[#787774]" />
            </div>
          )}

          {filteredNotes.length === 0 && !hasCreateOption && (
            <div className="py-8 text-center text-xs text-[#787774]">
              No pages found. Start typing to create a new page.
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-3 py-2 bg-[#FAF9F6] border-t border-[#E9E9E7] flex items-center justify-between text-[11px] text-[#787774]">
          <div className="flex items-center space-x-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>Full-text search</span>
        </div>
      </div>
    </div>
  );
};

export const CommandPalette: React.FC = () => {
  const isCommandPaletteOpen = useUIStore((state) => state.isCommandPaletteOpen);
  if (!isCommandPaletteOpen) return null;
  return <CommandPaletteModal />;
};
