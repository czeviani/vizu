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

async function remoteUpsert(p: Presentation): Promise<string | null> {
  if (!supabase) return null;
  const { error } = await supabase.from('vizu_presentations').upsert({
    id: p.id,
    title: p.title,
    data: p as unknown as Record<string, unknown>,
    updated_at: new Date().toISOString(),
  });
  if (error) console.error('[storage] falha ao salvar na nuvem:', error.message);
  return error?.message ?? null;
}

async function remoteDelete(id: string): Promise<string | null> {
  if (!supabase) return null;
  const { error } = await supabase.from('vizu_presentations').delete().eq('id', id);
  if (error) console.error('[storage] falha ao excluir na nuvem:', error.message);
  return error?.message ?? null;
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

  // Removes locally first (instant UI feedback), then confirms remotely.
  // If the remote delete fails (e.g. RLS blocking it), the item is restored
  // locally so it doesn't silently reappear on the next init() sync.
  async delete(id: string): Promise<{ ok: boolean; error?: string }> {
    const all = localLoad();
    const backup = all[id];
    delete all[id];
    localSave(all);

    const error = await remoteDelete(id);
    if (error) {
      if (backup) {
        const current = localLoad();
        current[id] = backup;
        localSave(current);
      }
      return { ok: false, error };
    }
    return { ok: true };
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
