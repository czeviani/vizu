import type { Presentation } from '@/types/slide';
import { supabase } from './supabase';

const KEY = 'vizu_presentations';

// ── localStorage (sync, cache) ────────────────────────────────

function localLoad(): Record<string, Presentation> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}'); }
  catch { return {}; }
}

function localSave(data: Record<string, Presentation>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(data));
}

// ── Supabase (async, source of truth) ─────────────────────────

async function remoteList(): Promise<Presentation[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('vizu_presentations')
    .select('data')
    .order('updated_at', { ascending: false });
  if (error || !data) return [];
  return data.map((r) => r.data as Presentation);
}

function remoteUpsert(p: Presentation): void {
  if (!supabase) return;
  supabase.from('vizu_presentations').upsert({
    id: p.id,
    title: p.title,
    data: p as unknown as Record<string, unknown>,
    updated_at: new Date().toISOString(),
  }).then(() => {});
}

function remoteDelete(id: string): void {
  if (!supabase) return;
  supabase.from('vizu_presentations').delete().eq('id', id).then(() => {});
}

// ── Public API ─────────────────────────────────────────────────

export const storage = {
  // Sync reads — call init() first on app boot to hydrate localStorage from Supabase
  list(): Presentation[] {
    return Object.values(localLoad()).sort(
      (a, b) => new Date(b.metadata.updatedAt).getTime() - new Date(a.metadata.updatedAt).getTime()
    );
  },

  get(id: string): Presentation | null {
    return localLoad()[id] ?? null;
  },

  // Sync write + async remote sync
  set(presentation: Presentation): void {
    const updated = {
      ...presentation,
      metadata: { ...presentation.metadata, updatedAt: new Date().toISOString() },
    };
    const all = localLoad();
    all[updated.id] = updated;
    localSave(all);
    remoteUpsert(updated);
  },

  delete(id: string): void {
    const all = localLoad();
    delete all[id];
    localSave(all);
    remoteDelete(id);
  },

  // Call once on app boot: fetches from Supabase and hydrates localStorage.
  // Returns true if remote data was found (caller can trigger re-render).
  async init(): Promise<boolean> {
    const remote = await remoteList();
    if (remote.length === 0) {
      // Push existing localStorage data to Supabase (first-time migration)
      const local = Object.values(localLoad());
      for (const p of local) remoteUpsert(p);
      return false;
    }
    const map: Record<string, Presentation> = {};
    remote.forEach((p) => (map[p.id] = p));
    localSave(map);
    return true;
  },
};
