import React, { useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Search,
  Plus,
  Trash2,
  Download,
  Upload,
  ChevronsLeft,
  BookMarked,
} from 'lucide-react';
import { db, createNote } from '../db';
import { useUIStore } from '../store';
import { SidebarItem } from './SidebarItem';
import { downloadJSONBackup, restoreJSONBackup } from '../utils/backup';

export const Sidebar: React.FC = () => {
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const setCommandPaletteOpen = useUIStore((state) => state.setCommandPaletteOpen);
  const setTrashOpen = useUIStore((state) => state.setTrashOpen);
  const setActiveNoteId = useUIStore((state) => state.setActiveNoteId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live query for root notes
  const rootNotes = useLiveQuery(
    () =>
      db.notes
        .filter((n) => !n.isArchived && (n.parentId === null || n.parentId === undefined || n.parentId === ''))
        .sortBy('createdAt'),
    []
  );

  // Live query for trash count
  const trashCount = useLiveQuery(
    () => db.notes.filter((n) => n.isArchived).count(),
    []
  );

  const handleCreateRootNote = async () => {
    const newNote = await createNote(null, 'Untitled');
    setActiveNoteId(newNote.id);
  };

  const handleExport = async () => {
    try {
      await downloadJSONBackup();
    } catch (err) {
      console.error(err);
      alert('Failed to export database.');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const count = await restoreJSONBackup(file);
      alert(`Successfully imported ${count} pages!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to import backup: ${msg}`);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isSidebarOpen) {
    return null;
  }

  return (
    <aside className="w-64 min-w-[256px] max-w-[256px] h-full bg-[#F7F6F3] border-r border-[#E9E9E7] flex flex-col justify-between select-none shrink-0 text-[#191919]">
      {/* Top Workspace Header */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between px-3 py-2.5 h-12 border-b border-[#ECEBE8]/50">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded bg-[#191919] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              T
            </div>
            <span className="font-semibold text-xs tracking-tight text-[#191919]">
              tuliis
            </span>
          </div>

          <button
            type="button"
            onClick={toggleSidebar}
            title="Collapse sidebar (Cmd+\)"
            className="p-1 rounded text-[#787774] hover:text-[#191919] hover:bg-[#EAEAEA] transition-colors"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Global Quick Action Items */}
        <div className="px-2 py-2 space-y-0.5">
          {/* Search Trigger */}
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-[#5A5852] hover:bg-[#EFEFED] rounded transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Search className="w-3.5 h-3.5 text-[#787774]" />
              <span>Search</span>
            </div>
            <kbd className="text-[10px] bg-[#ECEBE8] text-[#787774] px-1.5 py-0.5 rounded font-mono">
              ⌘K
            </kbd>
          </button>

          {/* New Page Trigger */}
          <button
            type="button"
            onClick={handleCreateRootNote}
            className="w-full flex items-center space-x-2 px-2 py-1.5 text-xs text-[#5A5852] hover:bg-[#EFEFED] rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#787774]" />
            <span>New Page</span>
          </button>
        </div>

        {/* Notes Navigation Header */}
        <div className="px-3 pt-3 pb-1 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[#787774] tracking-wider uppercase">
            Pages
          </span>
          <button
            type="button"
            onClick={handleCreateRootNote}
            title="Add a page"
            className="p-0.5 rounded text-[#787774] hover:text-[#191919] hover:bg-[#EAEAEA] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Pages Tree Section */}
      <div className="flex-1 overflow-y-auto px-1 py-1 space-y-0.5 custom-scrollbar">
        {rootNotes && rootNotes.length > 0 ? (
          rootNotes.map((note) => (
            <SidebarItem key={note.id} note={note} level={0} />
          ))
        ) : (
          <div className="px-3 py-6 text-center text-xs text-[#999999] flex flex-col items-center space-y-2">
            <BookMarked className="w-5 h-5 text-[#B0AEA9]" />
            <p>No pages yet</p>
            <button
              type="button"
              onClick={handleCreateRootNote}
              className="text-xs text-[#191919] underline font-medium hover:text-black"
            >
              Create your first page
            </button>
          </div>
        )}
      </div>

      {/* Footer Controls: Export, Import, Trash */}
      <div className="p-2 border-t border-[#E9E9E7] flex flex-col space-y-0.5 bg-[#FAF9F6]">
        {/* Hidden File Input for Import */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json,application/json"
          className="hidden"
        />

        <button
          type="button"
          onClick={handleExport}
          className="w-full flex items-center space-x-2 px-2 py-1.5 text-xs text-[#5A5852] hover:bg-[#EFEFED] rounded transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-[#787774]" />
          <span>Export Backup (.json)</span>
        </button>

        <button
          type="button"
          onClick={handleImportClick}
          className="w-full flex items-center space-x-2 px-2 py-1.5 text-xs text-[#5A5852] hover:bg-[#EFEFED] rounded transition-colors"
        >
          <Upload className="w-3.5 h-3.5 text-[#787774]" />
          <span>Import Backup</span>
        </button>

        <button
          type="button"
          onClick={() => setTrashOpen(true)}
          className="w-full flex items-center justify-between px-2 py-1.5 text-xs text-[#5A5852] hover:bg-[#EFEFED] rounded transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Trash2 className="w-3.5 h-3.5 text-[#787774]" />
            <span>Trash</span>
          </div>
          {typeof trashCount === 'number' && trashCount > 0 && (
            <span className="text-[10px] bg-[#EAEAEA] text-[#787774] px-1.5 py-0.2 rounded font-medium">
              {trashCount}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};
