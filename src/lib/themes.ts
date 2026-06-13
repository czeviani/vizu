import type { Theme } from '@/types/slide';

export const DEFAULT_THEMES: Theme[] = [
  {
    id: 'slate',
    name: 'Slate',
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#f59e0b',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a',
      textSecondary: '#475569',
      border: '#e2e8f0',
    },
    fonts: { heading: 'Inter', body: 'Inter' },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    colors: {
      primary: '#818cf8',
      secondary: '#94a3b8',
      accent: '#f472b6',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#334155',
    },
    fonts: { heading: 'Inter', body: 'Inter' },
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: {
      primary: '#10b981',
      secondary: '#6b7280',
      accent: '#f59e0b',
      background: '#ffffff',
      surface: '#f0fdf4',
      text: '#064e3b',
      textSecondary: '#374151',
      border: '#d1fae5',
    },
    fonts: { heading: 'Inter', body: 'Inter' },
  },
  {
    id: 'rose',
    name: 'Rose',
    colors: {
      primary: '#f43f5e',
      secondary: '#6b7280',
      accent: '#8b5cf6',
      background: '#ffffff',
      surface: '#fff1f2',
      text: '#0f172a',
      textSecondary: '#4b5563',
      border: '#fecdd3',
    },
    fonts: { heading: 'Inter', body: 'Inter' },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    colors: {
      primary: '#0ea5e9',
      secondary: '#64748b',
      accent: '#06b6d4',
      background: '#ffffff',
      surface: '#f0f9ff',
      text: '#0c4a6e',
      textSecondary: '#334155',
      border: '#bae6fd',
    },
    fonts: { heading: 'Inter', body: 'Inter' },
  },
  {
    id: 'mono',
    name: 'Mono',
    colors: {
      primary: '#171717',
      secondary: '#525252',
      accent: '#737373',
      background: '#fafafa',
      surface: '#f5f5f5',
      text: '#171717',
      textSecondary: '#525252',
      border: '#e5e5e5',
    },
    fonts: { heading: 'Inter', body: 'Inter' },
  },
];

export const getThemeById = (id: string): Theme =>
  DEFAULT_THEMES.find((t) => t.id === id) ?? DEFAULT_THEMES[0];
