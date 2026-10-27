import React, { useState, useEffect, useRef } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import {
  Smile,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { useAutoSave } from '../hooks/useAutoSave';
import type { Note } from '../types';

interface EditorProps {
  note: Note;
}

const DEFAULT_EMOJIS = [
  '📝', '📄', '💡', '📌', '🚀', '🎯', '📂', '📖',
  '⚡', '✨', '🧠', '💼', '💻', '🎨', '🏷️', '☕',
  '🛠️', '📊', '🌐', '🔖', '🔥', '🌱', '⭐', '📦',
];

const PRESET_COVERS = [
  'linear-gradient(to right, #242424, #121212)',
  'linear-gradient(to right, #434343, #262626)',
  'linear-gradient(to right, #e0e0e0, #f5f5f5)',
  'linear-gradient(135deg, #2b2b2b 0%, #1f1f1f 100%)',
  'linear-gradient(to right, #d3d3d3, #8a8a8a)',
];

function parseNoteContent(content: string) {
  if (!content || !content.trim()) return undefined;
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse note content JSON:', e);
  }
  return undefined;
}

const NoteCanvas: React.FC<{ note: Note }> = ({ note }) => {
  const [title, setTitle] = useState(note.title);
  const [icon, setIcon] = useState<string | null>(note.icon);
  const [coverImage, setCoverImage] = useState<string | null>(note.coverImage);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);

  const { triggerSave } = useAutoSave(note.id, 400);

  // Initialize BlockNote editor with initial content
  const editor = useCreateBlockNote({
    initialContent: parseNoteContent(note.content),
  });

  // Adjust title textarea height automatically
  useEffect(() => {
    if (titleTextareaRef.current) {
      titleTextareaRef.current.style.height = 'auto';
      titleTextareaRef.current.style.height = `${titleTextareaRef.current.scrollHeight}px`;
    }
  }, [title]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    triggerSave({ title: newTitle });
  };

  const handleIconSelect = (selectedIcon: string) => {
    setIcon(selectedIcon);
    setIsEmojiPickerOpen(false);
    triggerSave({ icon: selectedIcon });
  };

  const handleRemoveIcon = () => {
    setIcon(null);
    setIsEmojiPickerOpen(false);
    triggerSave({ icon: null });
  };

  const handleAddCover = () => {
    const randomCover = PRESET_COVERS[0];
    setCoverImage(randomCover);
    triggerSave({ coverImage: randomCover });
  };

  const handleRemoveCover = () => {
    setCoverImage(null);
    triggerSave({ coverImage: null });
  };

  const handleCycleCover = () => {
    const currentIndex = PRESET_COVERS.indexOf(coverImage || '');
    const nextCover = PRESET_COVERS[(currentIndex + 1) % PRESET_COVERS.length];
    setCoverImage(nextCover);
    triggerSave({ coverImage: nextCover });
  };

  return (
    <div className="w-full min-h-full flex flex-col pb-32">
      {/* Cover Image Banner */}
      {coverImage && (
        <div className="relative group w-full h-40 md:h-48 overflow-hidden select-none shrink-0" style={{ background: coverImage }}>
          <div className="absolute bottom-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 bg-white/90 backdrop-blur-[2px] rounded px-2 py-1 shadow-xs border border-[#DFDFDE]">
            <button
              type="button"
              onClick={handleCycleCover}
              className="text-[11px] font-medium text-[#191919] hover:text-black px-1"
            >
              Change cover
            </button>
            <span className="text-[#DFDFDE]">|</span>
            <button
              type="button"
              onClick={handleRemoveCover}
              className="text-[11px] font-medium text-[#787774] hover:text-[#D44C47] px-1"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Editor Center Container */}
      <div className="w-full max-w-4xl mx-auto px-8 md:px-14 lg:px-20 pt-8 flex-1 flex flex-col">
        {/* Document Top Bar: Icon, Add Icon / Add Cover Buttons */}
        <div className="group relative mb-4 select-none">
          {/* Page Icon */}
          {icon ? (
            <div className="relative inline-block mb-2">
              <button
                type="button"
                onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
                title="Change icon"
                className="text-5xl hover:opacity-80 transition-opacity leading-none cursor-pointer p-1 rounded-md hover:bg-[#F1F0EC]"
              >
                {icon}
              </button>

              {/* Emoji Picker Dropdown */}
              {isEmojiPickerOpen && (
                <div className="absolute top-full left-0 z-30 mt-1 p-2 bg-white rounded-lg shadow-xl border border-[#DFDFDE] w-64">
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#E9E9E7] text-xs font-semibold text-[#787774]">
                    <span>Select Icon</span>
                    <button
                      type="button"
                      onClick={handleRemoveIcon}
                      className="text-[11px] font-normal text-[#D44C47] hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-6 gap-1 text-xl">
                    {DEFAULT_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleIconSelect(emoji)}
                        className="p-1 rounded hover:bg-[#F1F0EC] transition-colors text-center"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Hover buttons when no icon or cover */
            <div className="flex items-center space-x-2 text-xs text-[#787774] opacity-0 group-hover:opacity-100 transition-opacity mb-2">
              <button
                type="button"
                onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
                className="flex items-center space-x-1 px-1.5 py-0.5 rounded hover:bg-[#F1F0EC] hover:text-[#191919] transition-colors"
              >
                <Smile className="w-3.5 h-3.5" />
                <span>Add icon</span>
              </button>

              {!coverImage && (
                <button
                  type="button"
                  onClick={handleAddCover}
                  className="flex items-center space-x-1 px-1.5 py-0.5 rounded hover:bg-[#F1F0EC] hover:text-[#191919] transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Add cover</span>
                </button>
              )}

              {/* Emoji Picker Dropdown */}
              {isEmojiPickerOpen && (
                <div className="absolute top-6 left-0 z-30 p-2 bg-white rounded-lg shadow-xl border border-[#DFDFDE] w-64">
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#E9E9E7] text-xs font-semibold text-[#787774]">
                    <span>Select Icon</span>
                    <button
                      type="button"
                      onClick={() => setIsEmojiPickerOpen(false)}
                      className="text-[#787774] hover:text-[#191919]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-6 gap-1 text-xl">
                    {DEFAULT_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleIconSelect(emoji)}
                        className="p-1 rounded hover:bg-[#F1F0EC] transition-colors text-center"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Document Title Input */}
          <textarea
            ref={titleTextareaRef}
            rows={1}
            placeholder="Untitled"
            value={title}
            onChange={handleTitleChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                editor.focus();
              }
            }}
            className="w-full resize-none overflow-hidden font-bold text-3xl md:text-4xl text-[#191919] placeholder:text-[#BBBBBA] outline-none border-none bg-transparent leading-tight tracking-tight mt-1"
          />
        </div>

        {/* BlockNote Canvas */}
        <div className="flex-1 -ml-13 md:-ml-13 blocknote-wrapper">
          <BlockNoteView
            editor={editor}
            onChange={() => {
              const serialized = JSON.stringify(editor.document);
              triggerSave({ content: serialized });
            }}
            theme="light"
          />
        </div>
      </div>
    </div>
  );
};

export const Editor: React.FC<EditorProps> = ({ note }) => {
  // Keying with note.id guarantees fresh editor mounting and state isolation
  return <NoteCanvas key={note.id} note={note} />;
};
