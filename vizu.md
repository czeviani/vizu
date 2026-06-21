# VIZU

## 1. DIRETRIZES

**Padrão de escrita:** direto, técnico, sem redundância. Listas > prosa.

**Convenções de código:**
- Editor: componente → hook → lib. Nunca lógica de negócio em componentes de UI.
- Canvas: cada tipo de elemento tem seu próprio componente em `components/editor/elements/`.
- Tipos TypeScript centralizados em `src/types/slide.ts`. Não duplicar em outros arquivos.
- Persistência: `storage.ts` é a única camada que toca localStorage. Nunca `localStorage.*` direto em componentes.
- API routes: apenas orquestração → biblioteca. Lógica de transformação vai em `lib/templates.ts` ou `lib/pptxExport.ts`.

**Nomenclatura:**
- Tipos de elemento: camelCase (`TextElement`, `ShapeElement`, `IconElement`…)
- Hooks: `use` prefix (`usePresentation`, `useHistory`)
- Componentes de elemento: sufixo `El` (`TextEl`, `ShapeEl`, `IconEl`)
- Componentes de editor: sem sufixo (`SlideCanvas`, `Toolbar`, `PropertiesPanel`)
- Layouts de slide: snake_case como literal (`'cover'`, `'section'`, `'content'`…)
- Temas: id em kebab-case (`'slate'`, `'midnight'`, `'forest'`…)

**Boas práticas obrigatórias:**
- Toda modificação de estado que deve aparecer no undo/redo usa `usePresentation.update()` — nunca `setState` direto no componente pai.
- Ao adicionar novo tipo de elemento: (1) definir interface em `types/slide.ts`, (2) criar componente em `elements/`, (3) registrar no `CanvasElement.tsx`, (4) adicionar export em `pptxExport.ts`.
- Ao adicionar novo layout: registrar em `templates.ts` (buildSlideFromSpec + createSlideFromLayout) e em `SlidePanel.tsx` (LAYOUTS array).
- Ao adicionar novo tema: registrar em `lib/themes.ts` (DEFAULT_THEMES array).
- Coordenadas de elemento são em pixels do slide (0-960 x, 0-540 y). Não usar porcentagem.
- Scale do canvas é apenas para renderização — as coordenadas armazenadas são sempre em pixels nativos do slide.

**Regras para não quebrar o sistema:**
- NUNCA mudar `SLIDE_WIDTH` (960) ou `SLIDE_HEIGHT` (540) sem atualizar pptxExport.ts (constante PX_TO_IN).
- NUNCA remover campos de `BaseElement` — componentes dependem de todos (locked, visible, zIndex, opacity, rotation).
- NUNCA usar `localStorage` direto — sempre via `storage.ts`.
- NUNCA modificar `useHistory` sem testar undo/redo com elementos de todos os tipos.
- Ao alterar a assinatura de `buildSlideFromSpec` ou `createSlideFromLayout`, atualizar também `api/ai/create/route.ts` e `api/ai/modify/route.ts`.

**Organização de arquivos:**
```
src/
  types/
    slide.ts           ← todos os tipos TypeScript (Presentation, Slide, SlideElement, Theme, AI types)
  lib/
    themes.ts          ← 6 temas predefinidos + getThemeById
    templates.ts       ← buildSlideFromSpec + createSlideFromLayout (7 layouts)
    templateLibrary.ts ← VisuTemplate, 12 templates built-in, CRUD localStorage
    pptxExport.ts      ← exportToPptx (PptxGenJS)
    exportUtils.ts     ← exportAsPptx, exportAsPdf, exportAsPng, ExportRecord history
    settingsStorage.ts ← VisuSettings, getSettings, saveSettings, updateSetting
    storage.ts         ← localStorage CRUD presentations (list, get, set, delete)
    supabase.ts        ← cliente Supabase (opcional, futuro)
    i18n.ts            ← strings PT-BR
    iconPaths.ts       ← SVG paths dos 48 ícones Lucide
  hooks/
    useHistory.ts      ← undo/redo (100 estados)
    usePresentation.ts ← operações de apresentação (add/remove/update slides e elementos)
  components/
    editor/
      elements/        ← TextEl, ShapeEl, ImageEl, IconEl, TableEl
      CanvasElement.tsx   ← wrapper com drag/resize/seleção
      SlideCanvas.tsx     ← canvas principal (box-select, teclado)
      SlidePanel.tsx      ← painel lateral de slides (miniaturas, drag-and-drop)
      SlideMiniature.tsx  ← miniatura CSS-rendered de um slide
      Toolbar.tsx         ← barra superior (ferramentas, zoom, "Exportar" abre ExportModal)
      PropertiesPanel.tsx ← painel direito (tabs: Element/Slide/Theme)
      PreviewModal.tsx    ← fullscreen preview com navegação
      ContextToolbar.tsx  ← barra contextual (42px, controles por tipo de elemento)
      ContextMenu.tsx     ← menu de contexto (click direito no canvas)
      ExportModal.tsx     ← modal multi-formato (PPTX/PDF/PNG + histórico)
  app/
    page.tsx           ← home (galeria de apresentações + sidebar com nav)
    templates/page.tsx ← galeria de templates (12 built-in + user-created)
    configuracoes/page.tsx ← configurações do usuário (aparência, editor, conta)
    editor/[id]/page.tsx ← editor principal
    api/
      presentations/route.ts  ← CRUD REST
      ai/create/route.ts      ← criar apresentação via spec JSON
      ai/modify/route.ts      ← modificar via operations array
      export/route.ts         ← gerar .pptx binário
    layout.tsx         ← root layout (Inter, anti-flash script, metadata)
    globals.css        ← design tokens CSS (claro/escuro/auto)
```

---

## 2. VISÃO DO PRODUTO

**Objetivo:** Editor de apresentações canvas-based auto-hospedado, controlável tanto via interface web quanto por IA (Claude Code) via API REST. Saída final é `.pptx` editável no PowerPoint.

**Problema que resolve:** Ferramentas existentes (Canva, PowerPoint) não têm API programável que permite a IA criar apresentações estruturadas com qualidade visual consistente. O Vizu é o editor onde o usuário finaliza o que a IA começa.

**Escopo atual (V1):**
- Single-user, sem auth (acesso direto pela URL do editor)
- Canvas de slides 960×540px (16:9)
- 7 tipos de layout + 5 tipos de elemento
- Persistência local (localStorage) — Supabase preparado mas opcional
- Dois modos de operação: web (drag/drop manual) + API (programático via IA)
- Deploy: Vercel (auto-deploy no push main)

**URLs:**
- Produção: `https://vizu-czeviani.vercel.app`
- Local: `http://localhost:3003` (porta 3003 para não conflitar com outros serviços)

---

## 3. ARQUITETURA

**Stack:**
| Camada | Tecnologia | Detalhe |
|--------|-----------|---------|
| Framework | Next.js 16 + TypeScript | App Router, Turbopack |
| Estilo | CSS custom properties | Sem Tailwind no editor (inline styles) |
| Canvas | HTML/CSS absolute positioning | Div com `position:relative`, elementos com `position:absolute` |
| Estado | React useState + useReducer custom | `useHistory` (undo/redo) + `usePresentation` (operações) |
| Persistência | localStorage (storage.ts) | JSON serializado, chave `vizu_presentations` |
| Export | PptxGenJS | `.pptx` gerado no browser via blob |
| Ícones | Lucide React | 48 ícones integrados na toolbar |
| Deploy | Vercel | Auto-deploy no push para main |

**Fluxo de dados — editor web:**
```
usePresentation (hook)
  ├── useHistory → save state → localStorage.set()
  ├── addElement / updateElement / removeElement
  ├── addSlide / duplicateSlide / removeSlide / moveSlide
  └── setTheme / setTitle

Editor Page
  ├── Toolbar → onAddElement, onUndo, onRedo, export .pptx
  ├── SlidePanel → onSelectSlide, onAddSlide, drag-reorder
  ├── SlideCanvas → render elements, selection box
  │     └── CanvasElement → drag, resize, TextEl editing
  └── PropertiesPanel → tabs: Element / Slide / Theme
```

**Fluxo de dados — API (Claude Code):**
```
Claude Code
  → POST /api/ai/create (spec JSON)
      → buildSlideFromSpec() × N
      → retorna Presentation JSON
  → Claude Code salva no localStorage do browser (ou via /api/presentations)
  → usuário abre /editor/{id} para visualizar e refinar
  → usuário clica "Export .pptx" → browser gera e baixa o arquivo
```

**Persistência:**
- `vizu_presentations` no localStorage: `Record<id, Presentation>`
- `/api/presentations` (em memória, server-side): para uso via API sem browser
- Supabase: schema preparado em `lib/supabase.ts`, não ativado por padrão

---

## 4. FUNCIONALIDADES

### 4.1 Canvas Editor

**Descrição:** Área principal de edição — slides 960×540px com elementos de posicionamento livre.

**Interações:**
- Click em elemento: seleciona (outline azul, 8 handles de resize)
- Shift+click: seleção múltipla
- Click+drag no fundo: box-select (seleciona elementos dentro do retângulo)
- Drag em elemento: move (coordenadas atualizadas em tempo real)
- Drag em handle: resize (8 direções, mínimo 8×8px)
- Double-click em texto: edição inline (contenteditable)
- Delete/Backspace: remove elementos selecionados (quando foco está no canvas, e NÃO em modo de edição de texto)
- Drag-and-drop de imagem: arrastar arquivo direto no canvas cria ImageElement na posição do drop
- Ctrl+V: cola imagem da área de transferência como ImageElement
- Ctrl+Z / Ctrl+Shift+Z: undo / redo
- Ctrl+`+` / Ctrl+`-` / Ctrl+0: zoom in / out / fit

**Zoom:**
- Range: 25% a 200%
- Botão "Fit": retorna a 70%
- Coordenadas armazenadas sempre em pixels nativos (960×540), scale apenas para renderização

**Regras de negócio:**
- Elementos `locked: true` não respondem a drag/resize
- Elementos `visible: false` ficam ocultos no canvas (presentes no JSON)
- `zIndex` determina ordem de renderização (sorting antes de render)
- Undo/redo captura a cada operação de `usePresentation.update()`

### 4.2 Painel de Propriedades

**Descrição:** Painel direito com 3 tabs — Element, Slide, Theme.

**Tab Element:**
- Position & Size: x, y, width, height (números), rotation (°), opacity (slider 0-100%), locked (checkbox), visible (checkbox), zIndex
- Para texto: tipografia completa (fontFamily, fontSize, fontWeight, fontStyle, textDecoration, color, textAlign, lineHeight, letterSpacing), background da caixa, padding, verticalAlign
- Para shapes: fill color, border (width/color/style/radius), shadow (enabled, x, y, blur, color)
- Sem seleção: estado vazio com ícone instrutivo

**Tab Slide:**
- Background: tipo (color/gradient/image), cor, gradiente (from/to/direction °), URL de imagem

**Tab Theme:**
- Preset Themes: 6 botões visuais com swatches de cor
- Custom Colors: 8 tokens (primary, secondary, accent, background, surface, text, textSecondary, border)
- Typography: fontFamily para heading e body

### 4.3 Painel de Slides

**Descrição:** Lista lateral esquerda com miniaturas dos slides.

**Interações:**
- Click: seleciona slide ativo
- Drag-and-drop: reordena slides (handle de arrastar)
- Botão direito: menu contextual (Duplicate, Delete)
- Botão "+ Add Slide": abre picker de layout (7 opções)

**Miniaturas:**
- Renderizadas via CSS (SlideMiniature.tsx), escala 0.289× (120×68px)
- Shapes e textos renderizados; imagens mostradas como placeholder cinza
- Borda azul no slide ativo

### 4.4 Toolbar

**Ferramentas de inserção:**
- Text: cria TextElement com tamanho 24px, cor do tema
- Shape: dropdown com 8 formas (rectangle, rounded, circle, triangle, diamond, star, arrow-right, arrow-left)
- Icon: picker com 48 ícones Lucide, busca por nome

**Ações:**
- Undo / Redo (com indicador de disponibilidade)
- Zoom: −, display %, +, Fit
- Preview: abre PreviewModal (ou F5)
- Export .pptx: gera e baixa arquivo via PptxGenJS

**Título da apresentação:** clicável — converte em input inline para renomeação

### 4.5 Preview Fullscreen

**Descrição:** Overlay de apresentação com slides em escala para o viewport.

**Interações:**
- Arrow Right/Down/Space: próximo slide
- Arrow Left/Up: slide anterior
- Escape / botão Close: fechar
- Click no fundo: fechar

**Renderização:** subset do canvas (shapes, textos, imagens básicas) — não usa CanvasElement, renderiza direto para performance.

### 4.6 Temas

**Temas predefinidos (6):**
| ID | Nome | Estilo |
|----|------|--------|
| `slate` | Slate | Azul sobre branco (padrão) |
| `midnight` | Midnight | Roxo/rosa sobre escuro |
| `forest` | Forest | Verde-esmeralda sobre branco |
| `rose` | Rose | Vermelho/roxo sobre branco |
| `ocean` | Ocean | Azul-céu sobre branco |
| `mono` | Mono | Preto sobre off-white |

**Toggle claro/escuro/automático:**
- 3 estados: light → dark → auto (segue sistema)
- Persistido em `localStorage['vizu-theme']`
- Script anti-flash no `<head>` (executado antes do React hidratar)

### 4.7 Layouts de Slide (Templates)

**7 layouts predefinidos:**
| Layout | Estrutura | Campos data |
|--------|-----------|-------------|
| `blank` | Canvas vazio | — |
| `cover` | Título grande + subtítulo + meta + shape decorativo | title, subtitle, author, date |
| `section` | Fundo cheio (primary), título centralizado | title, subtitle |
| `content` | Barra lateral, título + divisor + bullets | title, bullets[], content |
| `comparison` | Dois painéis com header colorido | title, leftTitle, leftContent, rightTitle, rightContent |
| `quote` | Barra esquerda, citação itálica + atribuição | quote, attribution |
| `closing` | Fundo escuro (text color), título grande centralizado | title, subtitle |

Cada layout gera elementos com posições fixas em pixels (960×540), cores extraídas do tema ativo.

### 4.8 Exportação .pptx

**Gerada no browser** via PptxGenJS (sem servidor).

**Mapeamento de elementos:**
| Elemento Vizu | PptxGenJS |
|---------------|-----------|
| TextElement | `slide.addText()` com props de tipografia |
| ShapeElement | `slide.addShape()` com fill + border |
| ImageElement | `slide.addImage()` com path |
| LineElement | `slide.addShape('line')` |
| IconElement, TableElement | não exportados (sem suporte nativo) |

**Conversão de coordenadas:** pixels → polegadas via `PX_TO_IN = 10 / 960` (slide é 10in largura no pptx WIDE layout).

**Limitações conhecidas:**
- Tabelas não exportam (não há mapeamento direto)
- Opacity de shapes não disponível na API PptxGenJS
- Gradientes de background exportam como cor sólida (from color)

**Ícones no PPTX:** exportados via SVG→PNG offscreen canvas (`iconToDataUrl()` em `iconPaths.ts`). Compatível com PowerPoint 2016+ e 365.

### 4.9 Persistência

**localStorage** (padrão):
- Chave: `vizu_presentations`
- Formato: `Record<id, Presentation>` serializado como JSON
- CRUD via `src/lib/storage.ts`
- Auto-save a cada operação via `usePresentation.update()`

**Supabase** (preparado, não ativado):
- Schema em `lib/supabase.ts`
- Tabela: `presentations(id, title, data TEXT, created_at, updated_at, user_id)`
- Ativar: adicionar `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` em `.env.local`

---

## 5. API PARA IA (CLAUDE CODE)

### POST /api/ai/create

Cria apresentação completa a partir de spec JSON.

**Request:**
```json
{
  "title": "Q3 Business Review",
  "theme": { "id": "midnight" },
  "slides": [
    { "layout": "cover", "data": { "title": "Q3 2026", "subtitle": "Performance & Strategy", "author": "Caique Zeviani" } },
    { "layout": "content", "data": { "title": "Resultados", "bullets": ["Revenue +18%", "NPS 72", "Churn 2.1%"] } },
    { "layout": "closing", "data": { "title": "Obrigado", "subtitle": "Dúvidas?" } }
  ]
}
```

**Response:** objeto `Presentation` completo (com todos os elementos gerados).

**Parâmetro `theme`:** aceita `{ id }` para preset ou objeto `Theme` parcial com cores customizadas.

### POST /api/ai/modify

Modifica apresentação existente via lista de operações.

**Request:**
```json
{
  "presentationData": { "...Presentation JSON completo..." },
  "operations": [
    { "op": "set-title", "title": "Novo Título" },
    { "op": "set-theme", "theme": { "id": "forest" } },
    { "op": "add-slide", "position": 2, "spec": { "layout": "content", "data": { "title": "Novo Slide", "bullets": ["Ponto 1", "Ponto 2"] } } },
    { "op": "remove-slide", "slideId": "abc-123" },
    { "op": "update-element", "slideId": "slide-id", "elementId": "el-id", "props": { "content": "Texto atualizado" } },
    { "op": "reorder-slides", "order": ["id-2", "id-1", "id-3"] }
  ]
}
```

**Operações disponíveis:**
| op | Campos obrigatórios | Efeito |
|----|---------------------|--------|
| `set-title` | `title` | Muda título da apresentação |
| `set-theme` | `theme` (parcial) | Aplica tema por ID ou cores customizadas |
| `add-slide` | `position`, `spec` | Insere slide na posição especificada |
| `remove-slide` | `slideId` | Remove slide |
| `update-slide` | `slideId`, `spec` | Reconstrói slide do zero a partir de novo spec |
| `update-element` | `slideId`, `elementId`, `props` | Atualiza propriedades de elemento existente |
| `reorder-slides` | `order` (string[]) | Reordena slides por array de IDs |

**Response:** `Presentation` modificado (campo `metadata.updatedAt` atualizado).

### POST /api/export

Gera `.pptx` binário a partir de um JSON de apresentação.

**Request:** `Presentation` JSON completo no body.
**Response:** binário `.pptx` com `Content-Disposition: attachment`.

### GET/POST/PUT/DELETE /api/presentations

CRUD em memória servidor-side (não persiste entre deploys). Para uso programático sem browser.

### Workflow típico Claude Code

```bash
# 1. Criar apresentação
RESULT=$(curl -s -X POST https://vizu-czeviani.vercel.app/api/ai/create \
  -H "Content-Type: application/json" \
  -d '{ "title": "Minha Deck", "slides": [...] }')

# 2. Salvar JSON
echo $RESULT > /tmp/deck.json

# 3. Para abrir no browser: carregar no localStorage
# No console do browser:
#   const p = JSON.parse('...JSON...');
#   const all = JSON.parse(localStorage.getItem('vizu_presentations') || '{}');
#   all[p.id] = p;
#   localStorage.setItem('vizu_presentations', JSON.stringify(all));
#   window.location.href = '/editor/' + p.id;

# 4. Modificar
curl -s -X POST https://vizu-czeviani.vercel.app/api/ai/modify \
  -H "Content-Type: application/json" \
  -d "{ \"presentationData\": $(cat /tmp/deck.json), \"operations\": [...] }"
```

---

## 6. FUNÇÕES PRINCIPAIS

### useHistory\<T\>(initialState) — `hooks/useHistory.ts`
- Hook genérico de undo/redo com 100 estados em memória
- `set(next | (prev) => next)`: atualiza estado E salva no histórico
- `undo()` / `redo()`: navega no histórico; atualiza estado sem re-salvar
- `canUndo` / `canRedo`: booleanos reativos

### usePresentation(initial) — `hooks/usePresentation.ts`
- Encapsula `useHistory<Presentation>` com operações de domínio
- `update(updater)`: chama `useHistory.set()` + `storage.set()` (auto-save)
- `addSlide(layout, afterIndex?)`: cria slide do layout e insere na posição
- `duplicateSlide(slideId)`: clona slide com novos UUIDs
- `removeSlide(slideId)`: remove slide
- `moveSlide(slideId, toIndex)`: reordena
- `updateSlide(slideId, updater)`: mutação genérica de slide
- `addElement(slideId, element)`: append de elemento
- `updateElement(slideId, elementId, updater)`: mutação de elemento
- `removeElement(slideId, elementId)`: remove elemento
- `duplicateElement(slideId, elementId)`: clona elemento com offset +16px
- `setTheme(theme)`: atualiza tema da apresentação
- `setTitle(title)`: atualiza título

### buildSlideFromSpec(spec, theme) — `lib/templates.ts`
- Constrói `Slide` completo a partir de `AISlideSpec` + `Theme`
- Gera posições, cores e tamanhos de todos os elementos do layout
- Chamada por `/api/ai/create` e `createSlideFromLayout`
- Parâmetros: `spec.layout`, `spec.data` (campos por layout), `spec.background` (opcional)
- Retorno: `Slide` com ID novo, background, e `elements[]` gerados

### createSlideFromLayout(layout, theme) — `lib/templates.ts`
- Wrapper de `buildSlideFromSpec` com dados padrão por layout (para uso no editor web)
- Chamado pelo `SlidePanel` ao adicionar slide via picker

### exportToPptx(presentation) — `lib/pptxExport.ts`
- Cria instância `PptxGenJS`, configura LAYOUT_WIDE (13.33×7.5in)
- Itera slides → `processSlide()` → itera elementos por zIndex
- Função `px(v)`: converte pixels Vizu → polegadas pptx (`v × 10/960`)
- `colorToHex(color)`: converte cores (hex strip `#`, mapa de named colors)
- Retorno: `Promise<Blob>` do arquivo `.pptx`

### iconToDataUrl(iconName, color, sizePx?) — `lib/iconPaths.ts`
- Converte ícone Lucide (identificado por nome) para PNG data URL via canvas offscreen
- Retorna `Promise<string | null>` — null se ícone não encontrado ou ambiente server-side
- Usado por `pptxExport.ts` para exportar ícones no .pptx com qualidade nítida

### ICON_PATHS / ICON_NAMES — `lib/iconPaths.ts`
- Mapa completo de SVG paths dos 48 ícones disponíveis
- Compartilhado entre Toolbar (preview) e pptxExport (PNG conversion)

### t — `lib/i18n.ts`
- Objeto de constantes com todas as strings visíveis em PT-BR
- Importar via `import { t } from '@/lib/i18n'`

### storage — `lib/storage.ts`
- `list()`: retorna `Presentation[]` ordenada por `updatedAt` desc
- `get(id)`: retorna `Presentation | null`
- `set(presentation)`: upsert com `updatedAt: now`
- `delete(id)`: remove por ID

---

## 7. TIPOS TYPESCRIPT CENTRAIS

Todos em `src/types/slide.ts`. Principais:

```typescript
// Dimensões do canvas
const SLIDE_WIDTH = 960;
const SLIDE_HEIGHT = 540;

// Elemento base (todos os elementos herdam)
interface BaseElement {
  id: string; type: ElementType;
  x: number; y: number; width: number; height: number;
  rotation: number; opacity: number; zIndex: number;
  locked: boolean; visible: boolean; name?: string;
}

// União de todos os elementos
type SlideElement = TextElement | ImageElement | ShapeElement | IconElement | TableElement | LineElement;

// Slide
interface Slide {
  id: string; layout: LayoutType;
  background: SlideBackground;
  elements: SlideElement[];
  notes?: string; thumbnail?: string;
}

// Apresentação
interface Presentation {
  id: string; title: string; theme: Theme;
  slides: Slide[];
  metadata: { author?: string; createdAt: string; updatedAt: string; version: string; }
}

// Spec para criação via IA
interface AISlideSpec {
  layout: LayoutType;
  data: { title?, subtitle?, content?, bullets?, author?, date?,
          leftTitle?, leftContent?, rightTitle?, rightContent?,
          quote?, attribution?, columns? }
  background?: Partial<SlideBackground>;
}
```

---

## 8. REGRAS DE ATUALIZAÇÃO (AUTO-MANUTENÇÃO)

Ao modificar o código, atualizar APENAS a seção relevante deste arquivo:

| Evento | Seção a atualizar |
|--------|------------------|
| Novo tipo de elemento | §4.7 (tabela elementos) + §6 (se nova função) + §7 (tipo) |
| Novo layout | §4.7 (tabela layouts) |
| Novo tema predefinido | §4.6 (tabela temas) |
| Nova operação API | §5 (tabela operações) |
| Nova função/hook | §6 (nova entrada) |
| Mudança de URL ou porta | §2 (URLs) + §5 (workflow) |
| Integração Supabase | §4.9 (persistência) + §3 (stack) |
| Nova limitação de export | §4.8 (limitações conhecidas) |
| Nova classe CSS ou token | §9 (design system) |

**Regras de manutenção:**
1. Atualizar apenas a seção relevante
2. Manter padrão de escrita (listas > prosa)
3. Não duplicar informação entre seções
4. Preservar estrutura do documento

---

## 9. DESIGN SYSTEM (V2 — implementado em 2026-06-20/21)

### Tokens CSS (`globals.css`)

**Modo claro (`:root`):**
```css
--bg: #f7f8fa          /* fundo de página */
--surface: #ffffff     /* cards, painéis */
--surface-2: #f1f3f6   /* fundo alternativo */
--border: #e4e7ec      /* bordas padrão */
--text: #16181d        /* texto primário */
--text-2: #5c6370      /* texto secundário */
--text-3: #8b919e      /* texto terciário, labels */
--accent: #6d5ae6      /* violeta-índigo (distinto do azul do NOUS) */
--accent-soft: rgba(109,90,230,0.10)
--ok: #16a34a / --ok-soft: rgba(22,163,74,0.12)
--bad: #dc2626 / --bad-soft: rgba(220,38,38,0.10)
--warn: #d97706 / --warn-soft: rgba(217,119,6,0.10)
--info: #2563eb / --info-soft: rgba(37,99,235,0.10)
--canvas-bg: #e5e7ed
--r-xs: 6px  --r-sm: 8px  --r-md: 12px  --r-lg: 16px  --r-full: 999px
--shadow-sm / --shadow-md / --shadow-lg
```

**Modo escuro (`[data-theme="dark"]`):** tokens redefinidos com valores escuros (`--bg: #0d0f13`, `--accent: #8b7cf8`, etc.)

**Sidebar sempre escura (independente do tema):**
```css
--sidebar-bg: #10121a
--sidebar-border: rgba(255,255,255,0.07)
--sidebar-text: rgba(255,255,255,0.50)
--sidebar-text-active: rgba(255,255,255,0.92)
--sidebar-accent: #8b7cf8
--sidebar-accent-soft: rgba(139,124,248,0.14)
```

### Tipografia

- Fonte: **Inter** via Google Fonts (`font-display: swap`), fallback `system-ui, sans-serif`
- Números tabulares: `font-variant-numeric: tabular-nums` em badges e contadores

### Tema 3-estados

- Estados: `light` / `dark` / `auto`
- Persistência: `localStorage['vizu-theme']`
- Anti-flash script inline no `<head>` (executa antes do CSS pintar)
- Toggle visível no topbar da home e na toolbar do editor
- `data-theme-pref` attribute no `<html>` para os 3 estados
- Dispara `CustomEvent('themechange')` ao trocar

### Classes CSS de componentes

| Classe | Uso |
|--------|-----|
| `.btn` | botão base (display flex, gap, radius, transition) |
| `.btn-primary` | accent bg + branco |
| `.btn-ghost` | fundo transparente + borda border |
| `.btn-danger` | texto bad, hover bad-soft |
| `.tool-btn` | botão de toolbar (32×32, icon only) |
| `.card` | surface + border + shadow-sm + radius-md |
| `.card.clickable:hover` | translateY(-3px) + shadow-md |
| `.tag` | pill pequeno 10px |
| `.tag-ok/warn/bad/info/accent` | cores semânticas para tags |
| `.nav-item` | item de sidebar (padding, hover accent-soft) |
| `.nav-item.active` | accent bg-soft + accent text |
| `.nav-badge` | contador redondo à direita do nav-item |
| `.skeleton` | shimmer animado para loading states |
| `.toast` | notificação flutuante (auto-dismiss 3.2s) |
| `.toast-ok/bad/info` | variantes com ícone e cor |
| `.toast-progress` | barra de progresso animada |
| `.modal-backdrop` | overlay com backdrop-filter blur(4px) |
| `.modal-box` | container modal centralizado |
| `.input` | input text estilizado |
| `.select` | select estilizado |
| `.theme-toggle` | container 3-estado light/auto/dark |

### Componentes de UI implementados

**Home page (`src/app/page.tsx`):**
- `ThemeToggle` — toggle 3-estados com dispatch de `themechange`
- `PresentationCard` — thumbnail 16:9 (paddingBottom trick), badge de slides, menu ···, swatches
- `CardSkeleton` — placeholder shimmer para loading
- `Modal` — backdrop blur, animação, botão fechar
- `ToastContainer` + lógica de toast (`showToast(msg, type)`, auto-dismiss 3.2s)
- `HomePage` — sidebar colapsável 240px→64px (ícones only, transition 0.22s cubic), topbar, grid de cards

**Editor (`src/components/editor/`):**
- `Toolbar` — 60px, logo monogram, título editável inline, save indicator, insert tools, zoom, preview, export, ThemeToggle
- `SlidePanel` — miniaturas 120×68, hover overlay com ações, layout picker dropdown, dashed add button
- `PropertiesPanel` — tabs Elemento/Slide/Tema, collapsible sections, ColorSwatch, NumInput, ThemeProperties com preview cards
- `ContextToolbar` — barra contextual 42px abaixo do toolbar quando elementos selecionados

### Decisões de design

- **Acento violeta-índigo** (#6d5ae6 light / #8b7cf8 dark) — distinto do azul do NOUS para identidade própria
- **Sidebar sempre escura** — usa tokens `--sidebar-*` separados, não afetados pelo tema global
- **Colapsável** — `sidebarCollapsed` state; ícones com `title` tooltip em estado colapsado
- **Sem Tailwind no editor** — inline styles com CSS vars para evitar conflito de especificidade com o canvas
- **16:9 thumbnail** — `height:0; paddingBottom:56.25%` no container outer + `position:absolute` inner

---

## 10. OTIMIZAÇÃO PARA LLM

- Tipos TypeScript: resumo em §7, implementação completa em `types/slide.ts`
- Funções: parâmetros + retorno + efeito — nunca implementação completa
- Coordenadas: sempre em pixels nativos (960×540), scale só para render
- Temas e layouts: tabelas em vez de prosa
- API: request/response exemplos concretos em §5
- Design system: tokens CSS em §9, classes de componentes em §9

**O que NÃO está aqui (buscar no código):**
- Implementação completa dos componentes React
- Detalhes de inline styles por componente
- Lógica de drag/resize em `CanvasElement.tsx`
- Mapeamento completo pptxGenJS em `pptxExport.ts`

---

## 11. HISTÓRICO

- [2026-06-13] Projeto iniciado — stack Next.js 16 + TS, canvas HTML/CSS, PptxGenJS
- [2026-06-13] Implementados: 7 layouts, 6 temas, 5 tipos de elemento, undo/redo, export .pptx
- [2026-06-13] API IA: /api/ai/create e /api/ai/modify
- [2026-06-13] Deploy: czeviani/vizu no GitHub + vizu-czeviani.vercel.app (auto-deploy no push main)
- [2026-06-13] vizu.md criado como fonte única de verdade técnica
- [2026-06-20] Fix crítico: editor crashava ao abrir qualquer apresentação (useHistory.reset() para sincronizar estado após carga assíncrona)
- [2026-06-20] Fix: undo/redo agora persiste no localStorage; PPTX exporta com LAYOUT_16x9 (escala correta)
- [2026-06-20] Toolbar: botão Image, indicador "✓ Saved"; PropertiesPanel: props de imagem, botões Front/Back/Duplicate/Delete
- [2026-06-20] Shortcuts: Ctrl+S (salvar), Ctrl+D (duplicar elemento)
- [2026-06-20] **Sessão de refatoração completa:**
  - **Bug 4 fix:** Delete/Backspace em modo de edição de texto não apaga mais o elemento — adicionado check `isContentEditable` no handler de teclado do SlideCanvas
  - **Bug 6 fix (crítico):** Letras desordenadas durante digitação resolvido — TextEl agora usa `useEffect` para inicializar o DOM ao entrar no modo de edição, sem fornecer content React controlled durante a sessão, eliminando conflito React/contentEditable
  - **Bug 1 (imagem drag-drop):** Canvas aceita drag-and-drop de arquivos de imagem com `onDragOver`/`onDrop`, cria ImageElement com coordenadas do drop point; Toolbar tem menu de inserção de imagem com upload de arquivo e URL; Ctrl+V no editor cola imagem da área de transferência
  - **Bug 5 (tema/cor):** `setTheme` em `usePresentation.ts` agora propaga cores do tema antigo→novo em todos os slides (background, text elements, shapes, icons) via mapeamento de cores
  - **Bug 2 (tradução):** Interface completa em Português Brasileiro via `src/lib/i18n.ts` — todos os labels, botões, tooltips, placeholders, mensagens de estado vazio, toasts
  - **Bug 3 (UX):** Toolbar contextual ao selecionar elemento (barra secundária abaixo do toolbar principal) com controles inline de fonte/cor/alinhamento para texto, fill/opacidade para shapes, fit/opacidade para imagens, cor para ícones; toggle de grade visual no canvas; snap lines de alinhamento ao arrastar elementos (threshold 8px, compara left/right/center de todos os elementos)
  - **Icon PPTX export:** Ícones Lucide agora exportam corretamente no .pptx — `iconToDataUrl()` em `iconPaths.ts` converte SVG path para PNG via canvas offscreen (200×200px); `pptxExport.ts` chama esta função async para cada `IconElement`
  - **Novos arquivos:** `src/lib/i18n.ts`, `src/lib/iconPaths.ts`, `src/components/editor/ContextToolbar.tsx`
  - **ImageEl:** Placeholder atualizado com instrução de upload; aceita imagens via data URL (localStorage-friendly)
- [2026-06-20/21] **Redesign visual completo (V2):**
  - `globals.css`: design token system completo (CSS custom properties claro/escuro/auto, tokens de sidebar sempre escura, classes `.btn`, `.card`, `.tag`, `.skeleton`, `.toast`, `.modal-*`, `.nav-item`, `.theme-toggle`, `.input`, `.select`, `.tool-btn`)
  - `layout.tsx`: anti-flash script 3-estados, `lang="pt-BR"`, `color-scheme` meta
  - `page.tsx` (home): sidebar 240px colapsável para 64px (ícones only, `transition: width 0.22s`), `ThemeToggle` 3-estados, `PresentationCard` com thumbnail 16:9, `CardSkeleton` shimmer, `Modal` backdrop-blur, `ToastContainer` (auto-dismiss 3.2s, tipos ok/bad/info), toasts em `handleDelete` e `handleDuplicate`
  - `Toolbar.tsx`: 60px, logo monogram, título editável inline, save indicator, `ThemeToggle` editor, `ShapeMenu` atualizado
  - `SlidePanel.tsx`: miniaturas 120×68 com hover overlay, layout picker dropdown, footer dashed "Adicionar slide"
  - `PropertiesPanel.tsx`: tabs Elemento/Slide/Tema, sections colapsáveis, `ColorSwatch`, `NumInput`, `ThemeProperties` com preview cards
  - `ContextToolbar.tsx`: variáveis CSS renomeadas (`--accent-soft` em vez de `--accent-subtle`, `--text-3` em vez de `--text-secondary`); aliases de compat em `globals.css`
  - Design decisions documentadas em §9
- [2026-06-21] **Módulos Templates, Exportação e Configurações (V3):**
  - **Templates** (`/templates`): galeria com 12 templates built-in (4 categorias × 3, 53 slides reais via `buildSlideFromSpec`); filtro por categoria como pills; busca com debounce 300ms; cards 16:9 com `SlideMiniature`; modal de preview com carousel e teclado ←/→; "Usar template" cria nova apresentação e abre no editor; `lib/templateLibrary.ts` com `VisuTemplate`, `BUILT_IN_TEMPLATES`, `getAllTemplates`, `createPresentationFromTemplate`; user-created templates em `localStorage['vizu_templates']`
  - **Exportação** (`ExportModal`): modal 3 abas PPTX/PDF/PNG acessível pelo botão "Exportar" do Toolbar; PPTX via `exportToPptx` existente; PDF via `html-to-image` → `jsPDF` (orientação paisagem 720×405pt); PNG por slide com pixelRatio configurável (1x/1.5x/2x); seleção de range de slides; progresso animado; histórico de exportações em `localStorage['vizu-export-history']`; atalho `Ctrl+Shift+E`; `lib/exportUtils.ts` + `components/editor/ExportModal.tsx`; `jspdf` adicionado como dependência
  - **Configurações** (`/configuracoes`): página dedicada com sidebar idêntica à home; 5 seções (Aparência, Editor, Nova Apresentação, Atalhos, Conta); tema muda imediatamente; autosave, grade, snap, guias, unidade, tamanho padrão, tema padrão; tabela de 16 atalhos de teclado; exportar todos os dados como JSON; limpar apresentações (2 cliques); `lib/settingsStorage.ts` com `VisuSettings`, `getSettings`, `saveSettings`, `updateSetting`
  - **Integração home**: navItems de Templates e Configurações agora têm `onClick` com `router.push` para `/templates` e `/configuracoes`
  - **Novos arquivos**: `src/lib/templateLibrary.ts`, `src/lib/exportUtils.ts`, `src/lib/settingsStorage.ts`, `src/components/editor/ExportModal.tsx`, `src/app/templates/page.tsx`, `src/app/configuracoes/page.tsx`
