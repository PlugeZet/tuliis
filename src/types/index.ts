export interface Note {
  id: string; // UUID v4
  title: string;
  icon: string | null;
  coverImage: string | null;
  parentId: string | null; // null for root, parent UUID for nested notes
  content: string; // serialized JSON string from BlockNote blocks
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
}

export type NoteUpdateInput = Partial<Omit<Note, 'id' | 'createdAt'>>;

export interface ExportData {
  version: number;
  appName: string;
  exportedAt: number;
  notes: Note[];
}

export interface BreadcrumbItem {
  id: string;
  title: string;
  icon: string | null;
}
