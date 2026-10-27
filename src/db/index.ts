import Dexie, { type Table } from 'dexie';
import type { Note, NoteUpdateInput, ExportData, BreadcrumbItem } from '../types';
import { generateUUID } from '../utils/uuid';

export class TuliisDB extends Dexie {
  notes!: Table<Note, string>;

  constructor() {
    super('tuliis_db');
    this.version(1).stores({
      notes: 'id, parentId, isArchived, updatedAt',
    });
  }
}

export const db = new TuliisDB();

export async function createNote(
  parentId: string | null = null,
  title = '',
  icon: string | null = '📄'
): Promise<Note> {
  const now = Date.now();
  const newNote: Note = {
    id: generateUUID(),
    title,
    icon,
    coverImage: null,
    parentId,
    content: '',
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  };

  await db.notes.add(newNote);
  return newNote;
}

export async function getNoteById(id: string): Promise<Note | undefined> {
  return db.notes.get(id);
}

export async function updateNote(id: string, updates: NoteUpdateInput): Promise<number> {
  return db.notes.update(id, {
    ...updates,
    updatedAt: Date.now(),
  });
}

export async function getDescendantIds(noteId: string): Promise<string[]> {
  const children = await db.notes.where('parentId').equals(noteId).toArray();
  let ids: string[] = [];
  for (const child of children) {
    ids.push(child.id);
    const subIds = await getDescendantIds(child.id);
    ids = ids.concat(subIds);
  }
  return ids;
}

export async function archiveNote(id: string): Promise<void> {
  const descendantIds = await getDescendantIds(id);
  const allIds = [id, ...descendantIds];
  const now = Date.now();

  await db.transaction('rw', db.notes, async () => {
    for (const noteId of allIds) {
      await db.notes.update(noteId, { isArchived: true, updatedAt: now });
    }
  });
}

export async function restoreNote(id: string): Promise<void> {
  const note = await db.notes.get(id);
  if (!note) return;
  const now = Date.now();

  let newParentId = note.parentId;
  if (newParentId) {
    const parent = await db.notes.get(newParentId);
    if (!parent || parent.isArchived) {
      newParentId = null;
    }
  }

  await db.notes.update(id, {
    isArchived: false,
    parentId: newParentId,
    updatedAt: now,
  });
}

export async function deleteNotePermanently(id: string): Promise<void> {
  const descendantIds = await getDescendantIds(id);
  const allIds = [id, ...descendantIds];
  await db.notes.bulkDelete(allIds);
}

export async function getNoteBreadcrumbs(id: string): Promise<BreadcrumbItem[]> {
  const breadcrumbs: BreadcrumbItem[] = [];
  let currentId: string | null = id;
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const note: Note | undefined = await db.notes.get(currentId);
    if (!note) break;
    breadcrumbs.unshift({ id: note.id, title: note.title || 'Untitled', icon: note.icon });
    currentId = note.parentId;
  }
  return breadcrumbs;
}

export async function exportDatabase(): Promise<ExportData> {
  const allNotes = await db.notes.toArray();
  return {
    version: 1,
    appName: 'tuliis',
    exportedAt: Date.now(),
    notes: allNotes,
  };
}

export async function importDatabase(data: ExportData): Promise<{ count: number }> {
  if (!data || !Array.isArray(data.notes)) {
    throw new Error('Invalid backup file format.');
  }

  await db.transaction('rw', db.notes, async () => {
    for (const note of data.notes) {
      if (note && note.id) {
        await db.notes.put({
          id: note.id,
          title: typeof note.title === 'string' ? note.title : 'Untitled',
          icon: note.icon ?? null,
          coverImage: note.coverImage ?? null,
          parentId: note.parentId ?? null,
          content: typeof note.content === 'string' ? note.content : '',
          isArchived: Boolean(note.isArchived),
          createdAt: typeof note.createdAt === 'number' ? note.createdAt : Date.now(),
          updatedAt: typeof note.updatedAt === 'number' ? note.updatedAt : Date.now(),
        });
      }
    }
  });

  return { count: data.notes.length };
}

export async function seedInitialData(): Promise<Note | null> {
  const count = await db.notes.count();
  if (count > 0) return null;

  const now = Date.now();
  const welcomeId = generateUUID();
  const tipsId = generateUUID();

  const welcomeContent = JSON.stringify([
    {
      id: generateUUID(),
      type: 'heading',
      props: { level: 1, textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
      content: [{ type: 'text', text: 'Welcome to Tuliis', styles: {} }],
      children: [],
    },
    {
      id: generateUUID(),
      type: 'paragraph',
      props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
      content: [
        {
          type: 'text',
          text: 'Tuliis adalah aplikasi catatan yang mudah digunakan.',
          styles: {},
        },
      ],
      children: [],
    },
    {
      id: generateUUID(),
      type: 'heading',
      props: { level: 2, textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
      content: [{ type: 'text', text: 'Key Capabilities', styles: {} }],
      children: [],
    },
    {
      id: generateUUID(),
      type: 'bulletListItem',
      props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
      content: [
        { type: 'text', text: 'Debounced Auto-Save: ', styles: { bold: true } },
        { type: 'text', text: 'Edits are debounced at 400ms straight to Dexie. Keystrokes never lag.', styles: {} },
      ],
      children: [],
    },
    {
      id: generateUUID(),
      type: 'bulletListItem',
      props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
      content: [
        { type: 'text', text: 'Recursive Infinite Nesting: ', styles: { bold: true } },
        { type: 'text', text: 'Create nested pages with live reactivity via dexie-react-hooks.', styles: {} },
      ],
      children: [],
    },
    {
      id: generateUUID(),
      type: 'bulletListItem',
      props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
      content: [
        { type: 'text', text: 'Command Palette: ', styles: { bold: true } },
        { type: 'text', text: 'Press Ctrl+K or Cmd+K anytime to quickly jump between notes.', styles: {} },
      ],
      children: [],
    },
    {
      id: generateUUID(),
      type: 'bulletListItem',
      props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
      content: [
        { type: 'text', text: 'Data Portability: ', styles: { bold: true } },
        { type: 'text', text: 'Full JSON backup export and import to keep your data yours.', styles: {} },
      ],
      children: [],
    },
    {
      id: generateUUID(),
      type: 'paragraph',
      props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
      content: [
        {
          type: 'text',
          text: 'Type "/" on a new line to open the slash menu and insert tables, headings, checklists, and callouts.',
          styles: { italic: true },
        },
      ],
      children: [],
    },
  ]);

  const tipsContent = JSON.stringify([
    {
      id: generateUUID(),
      type: 'heading',
      props: { level: 1, textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
      content: [{ type: 'text', text: 'Quick Shortcuts', styles: {} }],
      children: [],
    },
    {
      id: generateUUID(),
      type: 'checkListItem',
      props: { checked: true, textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
      content: [{ type: 'text', text: 'Cmd+K / Ctrl+K - Open search and command palette', styles: {} }],
      children: [],
    },
    {
      id: generateUUID(),
      type: 'checkListItem',
      props: { checked: true, textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
      content: [{ type: 'text', text: 'Cmd+\\ / Ctrl+\\ - Toggle sidebar', styles: {} }],
      children: [],
    },
    {
      id: generateUUID(),
      type: 'checkListItem',
      props: { checked: false, textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
      content: [{ type: 'text', text: 'Click "+" on any sidebar item to add a child sub-page', styles: {} }],
      children: [],
    },
  ]);

  const welcomeNote: Note = {
    id: welcomeId,
    title: 'Welcome to Tuliis',
    icon: '📝',
    coverImage: null,
    parentId: null,
    content: welcomeContent,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  };

  const tipsNote: Note = {
    id: tipsId,
    title: 'Quick Shortcuts',
    icon: '💡',
    coverImage: null,
    parentId: welcomeId,
    content: tipsContent,
    isArchived: false,
    createdAt: now + 1,
    updatedAt: now + 1,
  };

  await db.notes.bulkAdd([welcomeNote, tipsNote]);
  return welcomeNote;
}
