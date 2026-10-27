import { exportDatabase, importDatabase } from '../db';
import type { ExportData } from '../types';

export async function downloadJSONBackup(): Promise<void> {
  const data = await exportDatabase();
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().slice(0, 10);

  const a = document.createElement('a');
  a.href = url;
  a.download = `tuliis-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function restoreJSONBackup(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as ExportData;
        if (!parsed || !Array.isArray(parsed.notes)) {
          throw new Error('Invalid backup file. Must contain a notes array.');
        }
        const res = await importDatabase(parsed);
        resolve(res.count);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => {
      reject(new Error('Failed to read the selected backup file.'));
    };
    reader.readAsText(file);
  });
}
