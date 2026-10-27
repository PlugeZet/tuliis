import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Menu,
  ChevronRight,
  Check,
  Loader2,
  Trash2,
  Plus,
  FileText,
} from 'lucide-react';
import { useUIStore } from '../store';
import { getNoteBreadcrumbs, archiveNote, createNote } from '../db';

interface HeaderProps {
  noteId: string | null;
}

export const Header: React.FC<HeaderProps> = ({ noteId }) => {
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const saveStatus = useUIStore((state) => state.saveStatus);
  const setActiveNoteId = useUIStore((state) => state.setActiveNoteId);

  // Reactive breadcrumbs using useLiveQuery
  const breadcrumbs = useLiveQuery(
    () => (noteId ? getNoteBreadcrumbs(noteId) : Promise.resolve([])),
    [noteId],
    []
  );

  const handleArchive = async () => {
    if (!noteId) return;
    await archiveNote(noteId);
    setActiveNoteId(null);
  };

  const handleAddChild = async () => {
    if (!noteId) return;
    const child = await createNote(noteId, 'Untitled');
    setActiveNoteId(child.id);
  };

  return (
    <header className="h-11 border-b border-[#E9E9E7] flex items-center justify-between px-3 text-xs select-none bg-white/80 backdrop-blur-[2px] shrink-0 sticky top-0 z-20">
      {/* Left: Sidebar toggle + Breadcrumbs */}
      <div className="flex items-center space-x-1 min-w-0 flex-1">
        {!isSidebarOpen && (
          <button
            type="button"
            onClick={toggleSidebar}
            title="Open sidebar (Cmd+\)"
            className="p-1 rounded text-[#787774] hover:text-[#191919] hover:bg-[#F1F0EC] transition-colors mr-1 shrink-0"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Breadcrumb items */}
        <div className="flex items-center space-x-1 overflow-hidden truncate">
          {(breadcrumbs || []).map((crumb, idx) => {
            const isLast = idx === (breadcrumbs?.length ?? 1) - 1;
            return (
              <React.Fragment key={crumb.id}>
                {idx > 0 && (
                  <ChevronRight className="w-3 h-3 text-[#B0AEA9] shrink-0" />
                )}
                <button
                  type="button"
                  onClick={() => setActiveNoteId(crumb.id)}
                  className={`flex items-center space-x-1 truncate px-1 py-0.5 rounded transition-colors ${
                    isLast
                      ? 'text-[#191919] font-medium'
                      : 'text-[#787774] hover:text-[#191919] hover:bg-[#F1F0EC]'
                  }`}
                >
                  <span className="text-xs shrink-0">
                    {crumb.icon || <FileText className="w-3 h-3 text-[#787774]" />}
                  </span>
                  <span className="truncate max-w-[120px] md:max-w-[200px]">
                    {crumb.title.trim() ? crumb.title : 'Untitled'}
                  </span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Right: Auto-Save Status & Actions */}
      <div className="flex items-center space-x-3 shrink-0 ml-2">
        {/* Subtle Save Status Indicator */}
        <div className="flex items-center space-x-1 text-[11px] text-[#787774]">
          {saveStatus === 'saving' ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-[#787774]" />
              <span className="hidden sm:inline">Saving...</span>
            </>
          ) : (
            <>
              <Check className="w-3 h-3 text-[#787774]" />
              <span className="hidden sm:inline text-[#999999]">Saved</span>
            </>
          )}
        </div>

        {noteId && (
          <div className="flex items-center space-x-1 pl-2 border-l border-[#E9E9E7]">
            <button
              type="button"
              onClick={handleAddChild}
              title="Add sub-page"
              className="flex items-center space-x-1 px-1.5 py-1 text-xs rounded text-[#787774] hover:text-[#191919] hover:bg-[#F1F0EC] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sub-page</span>
            </button>

            <button
              type="button"
              onClick={handleArchive}
              title="Archive note"
              className="p-1 rounded text-[#787774] hover:text-[#D44C47] hover:bg-[#F1F0EC] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
