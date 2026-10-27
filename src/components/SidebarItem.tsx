import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  FileText,
} from 'lucide-react';
import { db, createNote, archiveNote } from '../db';
import { useUIStore } from '../store';
import type { Note } from '../types';

interface SidebarItemProps {
  note: Note;
  level: number;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({ note, level }) => {
  const activeNoteId = useUIStore((state) => state.activeNoteId);
  const setActiveNoteId = useUIStore((state) => state.setActiveNoteId);

  // Reactive query for children
  const children = useLiveQuery(
    () =>
      db.notes
        .where('parentId')
        .equals(note.id)
        .and((n) => !n.isArchived)
        .sortBy('createdAt'),
    [note.id]
  );

  const isActive = activeNoteId === note.id;
  const hasChildren = Boolean(children && children.length > 0);
  const isChildActive = Boolean(activeNoteId && children?.some((c) => c.id === activeNoteId));

  // Compute expansion state without cascading effects
  const [isManuallyExpanded, setIsManuallyExpanded] = useState<boolean | null>(null);
  const isExpanded = isManuallyExpanded !== null ? isManuallyExpanded : isChildActive;

  const handleSelect = () => {
    setActiveNoteId(note.id);
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsManuallyExpanded(!isExpanded);
  };

  const handleAddSubPage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsManuallyExpanded(true);
    const newSubNote = await createNote(note.id, 'Untitled');
    setActiveNoteId(newSubNote.id);
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await archiveNote(note.id);
    if (activeNoteId === note.id) {
      setActiveNoteId(null);
    }
  };

  const paddingLeft = `${level * 12 + 10}px`;

  return (
    <div className="w-full flex flex-col">
      <div
        role="button"
        tabIndex={0}
        onClick={handleSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleSelect();
          }
        }}
        style={{ paddingLeft }}
        className={`group relative flex items-center h-7 pr-2 text-xs rounded-sm cursor-pointer select-none transition-colors duration-100 ${
          isActive
            ? 'bg-[#EAEAEA] text-[#191919] font-medium'
            : 'text-[#37352F] hover:bg-[#EFEFED]'
        }`}
      >
        {/* Expand / Collapse Chevron */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleToggleExpand}
          className="w-4 h-4 mr-1 flex items-center justify-center rounded hover:bg-[#E3E2DE] text-[#787774] hover:text-[#191919] transition-colors"
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )
          ) : (
            <span className="w-3.5 h-3.5 inline-block opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="w-3.5 h-3.5 text-[#999999]" />
            </span>
          )}
        </div>

        {/* Note Icon */}
        <span className="mr-1.5 text-xs flex items-center justify-center w-4 h-4 shrink-0">
          {note.icon ? (
            <span className="text-xs leading-none">{note.icon}</span>
          ) : (
            <FileText className="w-3.5 h-3.5 text-[#787774]" />
          )}
        </span>

        {/* Note Title */}
        <span className="truncate flex-1 text-left">
          {note.title.trim() ? note.title : 'Untitled'}
        </span>

        {/* Hover Action Buttons */}
        <div className="hidden group-hover:flex items-center space-x-0.5 ml-1 shrink-0">
          <button
            type="button"
            title="Add sub-page"
            onClick={handleAddSubPage}
            className="w-4 h-4 flex items-center justify-center rounded hover:bg-[#DEDCD7] text-[#787774] hover:text-[#191919] transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            type="button"
            title="Archive page"
            onClick={handleArchive}
            className="w-4 h-4 flex items-center justify-center rounded hover:bg-[#DEDCD7] text-[#787774] hover:text-[#D44C47] transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Recursive Children */}
      {isExpanded && children && (
        <div className="w-full flex flex-col">
          {children.length > 0 ? (
            children.map((child) => (
              <SidebarItem key={child.id} note={child} level={level + 1} />
            ))
          ) : (
            <div
              style={{ paddingLeft: `${(level + 1) * 12 + 20}px` }}
              className="py-1 text-[11px] text-[#999999] italic select-none"
            >
              No pages inside
            </div>
          )}
        </div>
      )}
    </div>
  );
};
