# VIZU Diagnostic Report — 2026-06-21

## Estado Atual do Projeto

### Arquitetura
- Next.js 16 + TypeScript, App Router
- Persistência: localStorage exclusivamente
- Supabase: client preparado em `lib/supabase.ts` mas NÃO ATIVADO (sem env vars)
- Deploy: Vercel (serverless)
- Export: apenas PPTX via browser (PptxGenJS)

---

## Mapa de Menus e Estado

### Home — Sidebar NavItems

| Menu | Estado | Causa da Falha | O que Precisa |
|------|--------|---------------|---------------|
| Apresentações | ✅ Funciona | — | — |
| Templates | ❌ Dead link | Sem onClick no navItem | Criar `/templates` + handler |
| Exportações | ❌ Dead link | Sem onClick no navItem | Criar modal ou página de histórico |
| Configurações | ❌ Dead link | Sem onClick no navItem | Criar `/configuracoes` + handler |

**Arquivo:** `src/app/page.tsx:437-441`

```tsx
// navItems NÃO TÊM onClick - são só estéticos
{ icon: <IcoLayout />, label: 'Templates', active: false, badge: null },
{ icon: <IcoDownload />, label: 'Exportações', active: false, badge: null },
{ icon: <IcoSettings />, label: 'Configurações', active: false, badge: null },
```

### Editor — Toolbar

| Botão | Estado | Causa | O que Precisa |
|-------|--------|-------|---------------|
| Exportar .pptx | ✅ Funciona | — | Transformar em modal multi-formato |
| Preview | ✅ Funciona | — | — |
| Undo/Redo | ✅ Funciona | — | — |
| Inserir elementos | ✅ Funciona | — | — |
| Grade | ✅ Funciona | — | — |
| Zoom | ✅ Funciona | — | — |

---

## Estado do Back-end por Módulo

| Módulo | API Routes Existentes | O que Está Simulado | O que Precisa |
|--------|----------------------|--------------------|--------------------|
| Presentations | `GET/POST/PUT/DELETE /api/presentations` | CRUD in-memory | — |
| Export | `POST /api/export` | Gera .pptx | PDF, PNG server-side |
| AI | `POST /api/ai/create`, `POST /api/ai/modify` | Funcional | — |
| Templates | ❌ Inexistente | Tudo | Criar lib + API routes |
| Settings | ❌ Inexistente | Tudo | Criar lib + storage |

---

## Estado do Banco de Dados

Supabase NÃO ESTÁ ATIVO. Storage é localStorage.

| Chave localStorage | Status | Conteúdo |
|-------------------|--------|---------|
| `vizu_presentations` | ✅ Em uso | Record<id, Presentation> |
| `vizu-theme` | ✅ Em uso | 'light' \| 'dark' \| 'auto' |
| `vizu_templates` | ❌ Não existe | A criar |
| `vizu_settings` | ❌ Não existe | A criar |
| `vizu_export_history` | ❌ Não existe | A criar |

---

## Dependências entre Módulos

```
Templates ──────────────────────────────────────────┐
  ├── precisa: Slide type (types/slide.ts) ✅        │
  ├── precisa: createSlideFromLayout (templates.ts)  │
  ├── precisa: DEFAULT_THEMES (themes.ts) ✅         │
  └── produce: Presentation com slides aplicados     │
                                                     ▼
Exportação ──────────────────────────────────────────┐
  ├── precisa: exportToPptx (pptxExport.ts) ✅       │
  ├── precisa: html-to-image (já instalado) ✅        │
  ├── precisa: jspdf (NÃO INSTALADO — instalar)      │
  └── precisa: SlideMiniature para render ✅          │
                                                     ▼
Configurações ───────────────────────────────────────┐
  ├── precisa: theme system (globals.css) ✅          │
  ├── produce: vizu_settings no localStorage         │
  └── afeta: autosave interval, grid, snap, tema     │
```

---

## Contrato de Dados (definido antes da implementação)

### VisuTemplate
```typescript
interface VisuTemplate {
  id: string;
  name: string;
  category: 'Negócios' | 'Educação' | 'Criativo' | 'Minimalista';
  slides: Slide[];
  slideCount: number;
  themeId: string;
  isBuiltIn: boolean;
  createdAt: string;
}
```

### VisuSettings
```typescript
interface VisuSettings {
  theme: 'light' | 'dark' | 'auto';
  defaultFontFamily: string;
  autosaveInterval: number; // 5, 15, 30, 60, 0=desativado
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  smartGuides: boolean;
  unit: 'px' | 'cm';
  defaultSlideSize: '16:9' | '4:3' | 'A4' | 'custom';
  defaultThemeId: string;
  displayName: string;
}
```

### ExportRecord
```typescript
interface ExportRecord {
  id: string;
  presentationId: string;
  presentationTitle: string;
  format: 'pptx' | 'pdf' | 'png';
  status: 'completed' | 'error';
  createdAt: string;
  slidesCount: number;
}
```

---

## Ordem de Implementação

1. **Templates** (independente, sem deps externas não instaladas)
2. **Exportação** (precisa instalar jspdf)
3. **Configurações** (independente)
4. **Integração** (wire up nav items, update Toolbar)
