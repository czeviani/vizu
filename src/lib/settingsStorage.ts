export interface VisuSettings {
  theme: 'light' | 'dark' | 'auto';
  defaultFontFamily: string;
  autosaveInterval: number; // 5, 15, 30, 60, 0=desativado
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  smartGuides: boolean;
  unit: 'px' | 'cm';
  defaultSlideSize: '16:9' | '4:3' | 'A4';
  defaultThemeId: string;
  displayName: string;
}

export const DEFAULT_SETTINGS: VisuSettings = {
  theme: 'auto',
  defaultFontFamily: 'Inter',
  autosaveInterval: 5,
  showGrid: false,
  gridSize: 20,
  snapToGrid: true,
  smartGuides: true,
  unit: 'px',
  defaultSlideSize: '16:9',
  defaultThemeId: 'slate',
  displayName: 'Usuário',
};

const KEY = 'vizu_settings';

export function getSettings(): VisuSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<VisuSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: VisuSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function updateSetting<K extends keyof VisuSettings>(key: K, value: VisuSettings[K]): void {
  const current = getSettings();
  saveSettings({ ...current, [key]: value });
}
