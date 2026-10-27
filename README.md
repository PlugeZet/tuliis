# tuliis

A minimal, local-first Notion clone web app with zero backend, deployed statically.

## Highlights

- **Local-First Architecture**: Powered by IndexedDB via [Dexie.js](https://dexie.org/). All data remains private and stored in your browser.
- **Distraction-Free Editor**: Powered by [@blocknote](https://www.blocknotejs.org/) with slash commands (`/`), markdown syntax, checklists, tables, headings, and code blocks.
- **Zero-Latency Auto-Save**: Custom `useAutoSave` hook debounces updates at 400ms directly to IndexedDB without triggering global re-renders on keystrokes.
- **Infinite Nesting**: Recursive `SidebarItem` with reactive hierarchy subscriptions via `useLiveQuery` from `dexie-react-hooks`.
- **Command Palette (`⌘K` / `Ctrl+K`)**: Instant full-text search across all notes with keyboard navigation (`↑`/`↓`/`Enter`/`Esc`).
- **Data Portability**: Full JSON backup export and import to keep your notes permanently accessible.
- **Trash & Archive**: Safe archiving with multi-level descendant management, restore, and permanent deletion.
- **Monochrome Neutral Aesthetic**: Strict palette (`#FFFFFF`, `#191919`, `#F7F6F3`, `#202020`, `#E9E9E7`) avoiding unnecessary animations or visual clutter.

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Rich Text Editor**: `@blocknote/core`, `@blocknote/mantine`, `@blocknote/react`
- **Database**: `dexie`, `dexie-react-hooks`
- **UI State**: `zustand`
- **Icons**: `lucide-react`
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)

## Project Structure

```
src/
├── components/
│   ├── CommandPalette.tsx   # Instant search palette (Cmd+K)
│   ├── Editor.tsx           # Document canvas & BlockNote integration
│   ├── Header.tsx           # Dynamic breadcrumbs & auto-save indicator
│   ├── Sidebar.tsx          # Navigation sidebar & backup controls
│   ├── SidebarItem.tsx      # Recursive hierarchical tree item
│   └── TrashModal.tsx       # Archived document management
├── db/
│   └── index.ts             # Dexie schema, transactions & helper queries
├── hooks/
│   ├── useAutoSave.ts       # Debounced direct-to-IndexedDB save pipeline
│   └── useKeyboardShortcuts.ts # Global keyboard shortcuts
├── store/
│   └── index.ts             # Lightweight Zustand UI store
├── types/
│   └── index.ts             # Strict TypeScript models & interfaces
├── utils/
│   ├── backup.ts            # JSON export and import logic
│   └── uuid.ts              # Native UUID generator
├── App.tsx                  # Root application layout
├── index.css                # Tailwind imports & monochrome palette
└── main.tsx                 # App mount & BlockNote stylesheet imports
```

## Getting Started

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
```

The output in `dist/` is 100% static and ready for zero-config deployment on Vercel, Netlify, Cloudflare Pages, or GitHub Pages.
