import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  RotateCcw,
  Trash2,
  X,
  Search,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { db, restoreNote, deleteNotePermanently } from '../db';
import { useUIStore } from '../store';
import type { Note } from '../types';

export const TrashModal: React.FC = () => {
  const isTrashOpen = useUIStore((state) => state.isTrashOpen);
  const setTrashOpen = useUIStore((state) => state.setTrashOpen);
  const setActiveNoteId = useUIStore((state) => state.setActiveNoteId);
  const [searchQuery, setSearchQuery] = useState('');

  const archivedNotes = useLiveQuery(
    () =>
      db.notes
        .filter((n) => n.isArchived)
        .reverse()
        .sortBy('updatedAt'),
    []
  );

  if (!isTrashOpen) return null;

  const filtered = (archivedNotes || []).filter((note: Note) =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRestore = async (id: string) => {
    await restoreNote(id);
    setActiveNoteId(id);
  };

  const handleDeletePermanent = async (id: string) => {
    if (window.confirm('Delete this page and its sub-pages permanently? This cannot be undone.')) {
      await deleteNotePermanently(id);
    }
  };

  const handleEmptyTrash = async () => {
    if (!archivedNotes || archivedNotes.length === 0) return;
    if (
      window.confirm(
        `Permanently delete all ${archivedNotes.length} pages in trash? This cannot be undone.`
      )
    ) {
      await db.transaction('rw', db.notes, async () => {
        for (const note of archivedNotes) {
          await db.notes.delete(note.id);
        }
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[1px] p-4"
      onClick={() => setTrashOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-white rounded-lg shadow-xl border border-[#DFDFDE] flex flex-col max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E9E9E7]">
          <div className="flex items-center space-x-2">
            <Trash2 className="w-4 h-4 text-[#787774]" />
            <span className="text-sm font-semibold text-[#191919]">Trash</span>
            <span className="text-xs text-[#787774] bg-[#F1F0EC] px-1.5 py-0.5 rounded">
              {archivedNotes?.length || 0}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {archivedNotes && archivedNotes.length > 0 && (
              <button
                type="button"
                onClick={handleEmptyTrash}
                className="text-xs text-[#787774] hover:text-[#D44C47] px-2 py-1 rounded hover:bg-[#F7F6F3] transition-colors"
              >
                Empty Trash
              </button>
            )}
            <button
              type="button"
              onClick={() => setTrashOpen(false)}
              className="p-1 rounded text-[#787774] hover:text-[#191919] hover:bg-[#F1F0EC] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-[#E9E9E7] flex items-center space-x-2 bg-[#FAF9F6]">
          <Search className="w-3.5 h-3.5 text-[#787774]" />
          <input
            type="text"
            placeholder="Filter archived pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-transparent outline-none text-[#191919] placeholder:text-[#999999]"
            autoFocus
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-[#F1F0EC]">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#787774] flex flex-col items-center justify-center space-y-1">
              <AlertCircle className="w-5 h-5 text-[#999999] mb-1" />
              <p>No archived pages found</p>
            </div>
          ) : (
            filtered.map((note) => (
              <div
                key={note.id}
                className="flex items-center justify-between py-2 px-2 hover:bg-[#F7F6F3] rounded transition-colors group"
              >
                <div className="flex items-center space-x-2 min-w-0 flex-1 mr-2">
                  <span className="text-sm shrink-0">
                    {note.icon || <FileText className="w-3.5 h-3.5 text-[#787774]" />}
                  </span>
                  <span className="text-xs text-[#191919] truncate">
                    {note.title.trim() ? note.title : 'Untitled'}
                  </span>
                </div>
                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleRestore(note.id)}
                    title="Restore page"
                    className="flex items-center space-x-1 px-2 py-1 text-[11px] rounded bg-[#F1F0EC] hover:bg-[#E3E2DE] text-[#37352F] transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restore</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePermanent(note.id)}
                    title="Delete permanently"
                    className="p-1 text-[#787774] hover:text-[#D44C47] hover:bg-[#F1F0EC] rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
