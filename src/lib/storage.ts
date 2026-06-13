import type { Presentation } from '@/types/slide';

const KEY = 'vizu_presentations';

function load(): Record<string, Presentation> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
}

function save(data: Record<string, Presentation>) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export const storage = {
  list(): Presentation[] {
    return Object.values(load()).sort(
      (a, b) => new Date(b.metadata.updatedAt).getTime() - new Date(a.metadata.updatedAt).getTime()
    );
  },

  get(id: string): Presentation | null {
    return load()[id] ?? null;
  },

  set(presentation: Presentation): void {
    const all = load();
    all[presentation.id] = {
      ...presentation,
      metadata: { ...presentation.metadata, updatedAt: new Date().toISOString() },
    };
    save(all);
  },

  delete(id: string): void {
    const all = load();
    delete all[id];
    save(all);
  },
};
