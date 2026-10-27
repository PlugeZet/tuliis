import { create } from 'zustand';

export type SaveStatus = 'saved' | 'saving';

interface UIState {
  activeNoteId: string | null;
  isSidebarOpen: boolean;
  isCommandPaletteOpen: boolean;
  isTrashOpen: boolean;
  saveStatus: SaveStatus;
  setActiveNoteId: (id: string | null) => void;
  setSidebarOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (isOpen: boolean) => void;
  toggleCommandPalette: () => void;
  setTrashOpen: (isOpen: boolean) => void;
  toggleTrash: () => void;
  setSaveStatus: (status: SaveStatus) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeNoteId: null,
  isSidebarOpen: true,
  isCommandPaletteOpen: false,
  isTrashOpen: false,
  saveStatus: 'saved',

  setActiveNoteId: (id) => set({ activeNoteId: id }),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setCommandPaletteOpen: (isOpen) => set({ isCommandPaletteOpen: isOpen }),
  toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
  setTrashOpen: (isOpen) => set({ isTrashOpen: isOpen }),
  toggleTrash: () => set((state) => ({ isTrashOpen: !state.isTrashOpen })),
  setSaveStatus: (status) => set({ saveStatus: status }),
}));
