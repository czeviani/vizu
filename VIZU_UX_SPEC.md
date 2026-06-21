# VIZU UX Spec — Nova Arquitetura de Interação

> Versão: 1.0 — 2026-06-21
> Baseada em: `vizu.md`, `VIZU_RESEARCH.md`, código atual dos componentes.
> Autor: Agente Arquiteto de UX

---

## 1. Decisão de Modelo de Toolbar

**Modelo adotado: Híbrido Fixo + Contextual Secundária** — toolbar fixa no topo com ações globais e de inserção, + barra contextual secundária que persiste com altura fixa (42 px) e muda de conteúdo por estado de seleção.

**Justificativa baseada na pesquisa:**
- Figma testou painéis flutuantes por 2 anos e reverteu: floating panels comprimem canvas em telas menores, sobrepõem o design e destroem memória muscular (VIZU_RESEARCH §5).
- Excalidraw e Google Slides mantêm toolbar fixa no topo — padrão mais familiar para usuários de ferramentas de apresentação (vs. Figma UI3 que fica na base, mais adequado a ferramentas de design de produto).
- Canva "Glow Up" validou o padrão híbrido: toolbar fixa para ações globais + quick actions contextual por tipo de elemento (VIZU_RESEARCH §2).
- A ContextToolbar atual desaparece completamente quando sem seleção, causando "canvas jump" (deslocamento vertical) — isso viola o princípio de estabilidade/memória muscular identificado na pesquisa (VIZU_RESEARCH §4, ponto 4).

**Decisão sobre ContextToolbar vazia:** manter reservado o espaço de 42 px sempre, exibindo estado neutro quando sem seleção. Animar via `opacity` (0 → 1, 150 ms ease) ao invés de montar/desmontar o componente DOM.

---

## 2. Layout Geral da Interface

### 2.1 Estrutura de Zonas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TOOLBAR PRINCIPAL (60px) — surface + border-bottom                        │
│  [←] [V] [Título editável]   [T][Img][□][★]|[Grade][|][⟳][↪][|][−][%][+][⊡] [▶ Visualizar] [↓ Exportar .pptx] [tema ☀/⚙/☾] │
├──────────────────────────────────────────────────────────────────────────────┤
│  CONTEXT TOOLBAR (42px) — surface-2 + border-bottom (sempre visível)       │
│  [conteúdo muda por tipo de seleção | estado vazio quando nada selecionado]│
├──────────┬──────────────────────────────────────────────────┬───────────────┤
│          │                                                  │               │
│  SLIDE   │              CANVAS AREA                         │  PROPERTIES   │
│  PANEL   │         (background: --canvas-bg)               │  PANEL        │
│  (192px) │         slide 960×540 escalado                  │  (256px)      │
│          │                                                  │               │
│  [mini-  │  ┌──────────────────────────────────────────┐   │  [Elemento /  │
│  aturas] │  │           SLIDE CANVAS                    │   │   Slide /     │
│          │  │  elementos com position:absolute          │   │   Tema]       │
│          │  │  snap guides, grid overlay                │   │               │
│          │  └──────────────────────────────────────────┘   │               │
│          │                                                  │               │
│ [+ Add   │                                                  │               │
│  slide]  │                                                  │               │
└──────────┴──────────────────────────────────────────────────┴───────────────┘
```

**Dimensões:**
- Toolbar principal: `height: 60px`, `background: var(--surface)`, `border-bottom: 1px solid var(--border)`
- ContextToolbar: `height: 42px`, `background: var(--surface-2)`, `border-bottom: 1px solid var(--border)` — **sempre renderizada no DOM**
- SlidePanel: `width: 192px` (colapsável para 0 com botão de toggle)
- PropertiesPanel: `width: 256px` (colapsável para 0 com botão de toggle)
- Canvas area: flex grow, `background: var(--canvas-bg)`

**Colapso dos painéis laterais:**
- Botão de toggle no rodapé do SlidePanel: ícone `PanelLeftClose` / `PanelLeftOpen` (Lucide), tooltip "Recolher painel de slides"
- Botão de toggle no cabeçalho do PropertiesPanel: ícone `PanelRightClose` / `PanelRightOpen` (Lucide), tooltip "Recolher propriedades"
- Transição: `width 0.22s cubic-bezier(0.4,0,0.2,1)`, `overflow: hidden`
- Estado persistido em `localStorage['vizu-slide-panel']` e `localStorage['vizu-props-panel']`

### 2.2 Toolbar Contextual

A ContextToolbar ocupa 42 px abaixo da toolbar principal. Ela **sempre existe no DOM** com `min-height: 42px`. Quando sem seleção, exibe estado neutro (hint textual). Quando há seleção, exibe controles contextuais via `opacity: 0 → 1, transition: opacity 150ms ease`.

---

## 3. Toolbar Principal — Especificação Detalhada

### 3.1 Layout e Zonas

A toolbar tem `height: 60px`, `display: flex`, `align-items: center`, `padding: 0 12px`, `gap: 2px`.

Estrutura em três zonas:

```
ZONA ESQUERDA          |  ZONA CENTRAL                |  ZONA DIREITA
[← voltar][V logo]     |  [Texto][Imagem][Forma][Ícone]|  [⟳][↪] | [−][%][+][⊡] | [▶][↓ .pptx][☀⚙☾]
[Título editável]      |  [Grade] | [Undo][Redo]       |
[● Salvo]              |                               |
```

**Separadores visuais:** `div` de `width: 1px`, `height: 20px`, `background: var(--border)`, `margin: 0 6px`.

### 3.2 Ferramentas de Inserção

Ficam na **zona central** da toolbar. Cada botão usa a classe `.tool-btn` (32×32 px) com ícone + label de texto curto.

| Ferramenta | Ícone Lucide | Atalho | Comportamento ao clicar |
|-----------|-------------|--------|------------------------|
| Texto | `Type` (path SVG: `M4 7V4h16v3M9 20h6M12 4v16`) | `T` | Cria `TextElement` no centro do slide ativo (x:320, y:230, w:320, h:80); entra em modo edição inline imediatamente |
| Imagem | `Image` (path SVG: `rect+circle+path diagonal`) | `M` | Abre dropdown com opções: "Selecionar arquivo" e "Inserir por URL" |
| Forma | `Square` com `ChevronDown` | `R` | Abre dropdown com grid de 8 formas (2×4) |
| Ícone | `Star` ou `Smile` | `I` | Abre modal/popover de picker de ícones com busca |

**Comportamento dos atalhos de teclado:**
- Ativo apenas quando o foco não está em um `input`, `textarea` ou elemento `contenteditable`
- `T`: cria TextElement, foca no elemento, entra em edição inline (simula double-click)
- `R`: cria ShapeElement retângulo no centro do slide, seleciona-o
- `M`: abre o menu de inserção de imagem (sem criar elemento ainda)
- `I`: abre o icon picker (sem criar elemento ainda)
- Após inserir via atalho, o novo elemento fica selecionado e o foco vai para o canvas

**Tooltip de cada botão:** `"Texto [T]"`, `"Imagem [M]"`, `"Forma [R]"`, `"Ícone [I]"` — o atalho entre colchetes indica para o usuário.

**Estado desabilitado:** quando `activeSlideId` é `null`, todos os botões de inserção ficam `opacity: 0.4`, `cursor: not-allowed` (não somem — regra de memória muscular).

### 3.3 Ferramentas de Navegação e Grade

| Ferramenta | Ícone Lucide | Atalho | Estado |
|-----------|-------------|--------|--------|
| Grade | `Grid3X3` | `Ctrl+G` | Toggle — active state com `background: var(--accent-soft)`, `color: var(--accent)` |

A ferramenta Grade fica na zona central, após o separador dos botões de inserção.

**Não há ferramenta "Mão/Pan" explícita** — pan do canvas é feito via Espaço+Drag (padrão Adobe/Figma). O cursor muda para `grab` quando Espaço está pressionado e `grabbing` durante o drag.

### 3.4 Indicador de Ferramenta Ativa

A ferramenta de inserção ativa é indicada pelo estado `.tool-btn.active`: `background: var(--accent-soft)`, `color: var(--accent)`, `border: 1.5px solid var(--accent)`. Após inserir o elemento, a "ferramenta" volta ao estado neutro (o VIZU não tem modo "ferramenta persistente" — cada inserção é one-shot, como no Google Slides).

### 3.5 Ferramentas Globais

**Zona esquerda:**
| Elemento | Posição | Comportamento |
|---------|--------|---------------|
| Botão voltar (`ArrowLeft` Lucide) | Extrema esquerda | `router.push('/')` |
| Logo monograma "V" | Ao lado do botão voltar | `width: 28px`, `height: 28px`, `borderRadius: 8px`, `background: var(--accent)`, `color: #fff` |
| Título editável inline | Ao lado do logo | Click converte em `<input>`, blur/Enter salva, Escape cancela; `max-width: 220px`, `fontSize: 14px`, `fontWeight: 600` |
| Indicador de salvamento | Ao lado do título | Texto "Salvo" com ícone `Check` (Lucide), `color: var(--ok)`, visível por 2 s após salvar via `fadeIn 0.2s ease`; ocupa `width: 72px` fixo para não deslocar o layout |

**Zona central (após inserção):**
| Ferramenta | Ícone Lucide | Atalho | Detalhe |
|-----------|-------------|--------|---------|
| Undo | `Undo2` | `Ctrl+Z` | Desabilitado (opacity 0.4) quando `!canUndo` — não some |
| Redo | `Redo2` | `Ctrl+Shift+Z` | Desabilitado (opacity 0.4) quando `!canRedo` — não some |

**Zona direita:**
| Ferramenta | Ícone Lucide | Atalho | Detalhe |
|-----------|-------------|--------|---------|
| Zoom − | `ZoomOut` | `Ctrl+–` | Decrementa 0.1, mínimo 0.25 |
| Display % | — | — | Texto `{Math.round(zoom * 100)}%`, `min-width: 38px`, `font-variant-numeric: tabular-nums` |
| Zoom + | `ZoomIn` | `Ctrl+=` | Incrementa 0.1, máximo 2.0 |
| Fit | `Maximize2` | `Ctrl+0` | Retorna para 70% |
| Visualizar | `Presentation` ou `MonitorPlay` | `F5` | Abre `PreviewModal` |
| Exportar .pptx | — | `Ctrl+Shift+E` | Botão `.btn.btn-primary` com texto "Exportar .pptx"; durante export: texto "Exportando…", `disabled` |
| Theme toggle | `.theme-toggle` (3 botões) | — | Compacto, `scale: 0.9` |

---

## 4. Painel de Propriedades — Especificação por Estado

O `PropertiesPanel` tem `width: 256px`, `background: var(--surface)`, `border-left: 1px solid var(--border)`. Colapsável conforme §2.1.

### 4.1 Estado: nada selecionado

**Remover** o estado "vazio" atual (mensagem + ícone instrutivo na tab Elemento).

**Novo comportamento:** quando nenhum elemento está selecionado, o painel exibe diretamente as **propriedades do slide atual** seguidas pelo acesso ao **tema** — sem tabs, sem estado vazio.

```
┌─────────────────────────────────────┐
│  SLIDE ATUAL                        │ ← cabeçalho fixo, 11px uppercase
├─────────────────────────────────────┤
│  ▾ Fundo do Slide           [aberto]│
│    Tipo: [Cor sólida ▾]             │
│    Cor:  [swatch][#ffffff    ]      │
├─────────────────────────────────────┤
│  ▸ Tema                    [fechado]│
└─────────────────────────────────────┘
```

**Implementação:** quando `selectedElements.length === 0`, renderizar `<SlideProperties>` + `<ThemeProperties>` diretamente (sem wrapper de tab). A section "Tema" começa colapsada (`defaultOpen={false}`). As tabs desaparecem — são substituídas por um cabeçalho de contexto (`"Slide Atual"` em `font-size: 11px`, `text-transform: uppercase`, `color: var(--text-3)`, `padding: 10px 14px 8px`).

### 4.2 Estado: TextElement selecionado

As tabs voltam a aparecer com três opções: **Elemento** | **Slide** | **Tema**.

Tab ativa default: **Elemento**.

```
┌─────────────────────────────────────┐
│ [Elemento★] [Slide] [Tema]          │ ← tabs com border-bottom 2px accent
├─────────────────────────────────────┤
│  [bg: surface-2]                    │
│  [Frente] [Fundo] [Copiar] [Excluir]│ ← ActionBtns
├─────────────────────────────────────┤
│  tag "Texto" | tag "Bloqueado"?     │
├─────────────────────────────────────┤
│  ▾ Posição e Tamanho       [aberto] │
│    X[___]px  Y[___]px               │
│    W[___]px  H[___]px               │
│    Rot[___]°  Cam[___]              │
│    Opacidade — 100%                 │
│    [slider 0-100]                   │
│    [×] Bloqueado  [✓] Visível       │
├─────────────────────────────────────┤
│  ▾ Tipografia              [aberto] │
│    Fonte: [Inter            ▾]      │
│    Tam[___]px   Peso[___   ▾]       │
│    Cor: [swatch][#1a1a1a   ]        │
│    [≡L][≡C][≡R][≡J]                │
│    [I][U]                           │
│    Alt. linha[___]  Espaç[___]px   │
├─────────────────────────────────────┤
│  ▸ Caixa de Texto         [fechado] │
└─────────────────────────────────────┘
```

**Ordem das seções (definitiva, sempre nesta ordem):**
1. Quick actions (Frente / Fundo / Copiar / Excluir) — fundo `var(--surface-2)`, sem titulo de seção
2. Type indicator badge
3. Posição e Tamanho (aberta por padrão)
4. Tipografia (aberta por padrão)
5. Caixa de Texto (fechada por padrão)

### 4.3 Estado: ShapeElement selecionado

Tab ativa default: **Elemento**.

Seções (ordem):
1. Quick actions
2. Type indicator badge ("Forma")
3. Posição e Tamanho (aberta)
4. Preenchimento (aberta) — ColorSwatch para `fill`
5. Borda (fechada) — `width`, `radius`, `style`, `color`
6. Sombra (fechada) — toggle + `x`, `y`, `blur`, `color`

### 4.4 Estado: ImageElement selecionado

Tab ativa default: **Elemento**.

Seções (ordem):
1. Quick actions
2. Type indicator badge ("Imagem")
3. Posição e Tamanho (aberta)
4. Imagem (aberta) — campo URL/src, select Ajuste (cover/contain/fill), campo alt
5. Borda (fechada) — `width`, `radius`, `color`

**Adição:** botão "Substituir imagem" na section Imagem — abre file picker (via `<input type="file" accept="image/*">`).

### 4.5 Estado: IconElement selecionado

Tab ativa default: **Elemento**.

Seções (ordem):
1. Quick actions
2. Type indicator badge ("Ícone")
3. Posição e Tamanho (aberta)
4. Ícone (aberta) — ColorSwatch para `color`; texto readonly com nome do ícone; botão "Trocar ícone" que abre o mesmo icon picker da Toolbar

### 4.6 Estado: múltiplos elementos selecionados

Quando `selectedElements.length > 1`:
- **Sem tabs** — painel exibe somente controles de grupo
- Cabeçalho: `"{N} elementos selecionados"` em `font-size: 12px`, `color: var(--text-2)`, `padding: 12px 14px`
- Seção "Alinhamento" (aberta):
  - Linha 1: [Aln.Esq.] [Aln.Centro] [Aln.Dir.] — align horizontal pelo bounding box da seleção
  - Linha 2: [Aln.Topo] [Aln.Meio] [Aln.Base] — align vertical
  - Linha 3: [Dist.H] [Dist.V] — distribuir espaçamento igual
  - Cada botão: 32×28px, ícone Lucide + tooltip descritivo
- Seção "Opacidade" (aberta): slider único que aplica a todos
- Botão "Excluir seleção" — `.btn-danger` centralizado, `margin: 12px 14px`

**Ícones Lucide para alinhamento:**
- `AlignLeft`, `AlignCenterHorizontal`, `AlignRight`
- `AlignTop` (ou `AlignStartVertical`), `AlignCenterVertical`, `AlignBottom` (ou `AlignEndVertical`)
- `AlignHorizontalDistributeCenter`, `AlignVerticalDistributeCenter`

### 4.7 Comportamento de Transição

Quando o estado muda (nenhum → selecionado, ou tipo A → tipo B):
- O conteúdo do painel troca instantaneamente (sem animação de conteúdo, pois o painel já existe no DOM)
- As tabs aparecem/desaparecem com `opacity: 0 → 1, transition: opacity 0.15s ease`
- A tab ativa **reseta para "Elemento"** sempre que uma nova seleção começa (exceto se já estava em "Slide" ou "Tema" e a mudança foi de nenhum→selecionado — nesse caso mantém a tab corrente)

---

## 5. Toolbar Contextual — Por Tipo de Elemento

A ContextToolbar tem `height: 42px`, `background: var(--surface-2)`, `border-bottom: 1px solid var(--border)`. **Sempre presente no DOM.**

### 5.1 Estado: nenhum elemento selecionado (neutro)

```
│  Selecione um elemento para editar suas propriedades rapidamente           │
```

Implementação:
- `opacity: 0.5` no texto
- `font-size: 12px`, `color: var(--text-3)`, `padding: 0 16px`
- Sem ícone, sem botão — apenas hint textual
- `transition: opacity 0.15s ease` ao entrar/sair deste estado

### 5.2 Texto selecionado

```
│ [Inter ▾ 130px] [24 ▾ 60px] | [B][I][U] | [≡L][≡C][≡R] | [●cor T] | ─── | [↑Frente][↓Fundo] | [⧉Copiar][✕Del] │
```

Controles:
- Select fonte: `max-width: 130px`, lista das 7 fontes disponíveis
- Select tamanho: `width: 60px`, valores pré-definidos `[10,12,14,16,18,20,24,28,32,36,40,48,56,64,72,96]`; também aceita digitação direta
- Separador
- **B** (Bold): `CtxBtn`, ativa se `fontWeight >= 700`, toggle 400↔700
- **I** (Italic): `CtxBtn`, ativa se `fontStyle === 'italic'`; ícone `<em>I</em>`
- **U** (Underline): `CtxBtn`, ativa se `textDecoration === 'underline'`; ícone `<span style={{textDecoration:'underline'}}>U</span>`
- Separador
- Alinhamento: `AlignLeft`, `AlignCenter`, `AlignRight` — CtxBtns com ícone SVG
- Separador
- Cor do texto: swatch 22×22px com `<input type="color">` invisível sobreposto; label "T" abaixo
- Separador duplo (visual)
- Trazer à frente: `ChevronUp` Lucide, `title="Trazer à frente"`
- Enviar ao fundo: `ChevronDown` Lucide, `title="Enviar ao fundo"`
- Separador
- Duplicar: `Copy` Lucide, `title="Duplicar (Ctrl+D)"`
- Excluir: `Trash2` Lucide, `color: var(--bad)`, `title="Excluir (Del)"`

### 5.3 Forma selecionada

```
│ [Preenchimento ●cor] | [Opac: ──── 100%] | [Borda: ──0px] | ─── | [↑][↓] | [⧉][✕] │
```

Controles:
- Label "Preench." + swatch 22×22px (fill color)
- Separador
- Label "Opac." + `<input type="range" min=0 max=1 step=0.01 width:72px>` + valor `"{n}%"` em `min-width: 28px`
- Separador
- Label "Borda" + NumInput `width: 44px` para `border.width` (sufixo `px`)
- Separador duplo
- Trazer à frente, Enviar ao fundo, Duplicar, Excluir (mesmos ícones que §5.2)

### 5.4 Imagem selecionada

```
│ [Substituir…] | [Ajuste: cover▾] | [Opac: ──── 100%] | ─── | [↑][↓] | [⧉][✕] │
```

Controles:
- Botão "Substituir…" — abre file picker, `.btn.btn-ghost` compacto `padding: 4px 10px`, `font-size: 12px`
- Separador
- Select objectFit: "Cobrir / Conter / Preencher", `width: 90px`
- Separador
- Opacidade (range + valor) — idêntico ao §5.3
- Separador duplo
- Trazer à frente, Enviar ao fundo, Duplicar, Excluir

### 5.5 Ícone selecionado

```
│ [Cor: ●cor] | [Trocar ícone] | ─── | [↑][↓] | [⧉][✕] │
```

Controles:
- Label "Cor" + swatch 22×22px (icon color)
- Separador
- Botão "Trocar ícone" — abre icon picker (mesmo da Toolbar), `.btn.btn-ghost` compacto
- Separador duplo
- Trazer à frente, Enviar ao fundo, Duplicar, Excluir

### 5.6 Múltiplos elementos selecionados

```
│ [N elementos] | [≡L][≡C][≡R] | [≡T][≡M][≡B] | [↔ Dist.H][↕ Dist.V] | ─── | [✕ Excluir tudo] │
```

Controles:
- Texto `"{N} elementos"` em `font-size: 12px`, `color: var(--text-3)`, sem ação
- Separador
- Alinhamentos horizontais: `AlignLeft`, `AlignCenterHorizontal`, `AlignRight`
- Alinhamentos verticais: `AlignTop` (ou equivalente), `AlignCenterVertical`, `AlignBottom`
- Distribuição: `AlignHorizontalDistributeCenter`, `AlignVerticalDistributeCenter`
- Separador duplo
- Excluir tudo: `Trash2` Lucide + texto "Excluir", `color: var(--bad)`

**Lógica de alinhamento:** alinha pelo bounding box da seleção múltipla (menor X para esquerda, maior X+W para direita, etc.). Aplica `update()` em cada elemento individualmente para garantir undo/redo correto.

---

## 6. Painel de Slides — Especificação

### 6.1 Layout e Dimensões

- Largura: `192px` fixo (não redimensionável pelo usuário nesta versão)
- Posição: extrema esquerda, abaixo da Toolbar + ContextToolbar
- Colapsável: botão no rodapé do painel com ícone `PanelLeftClose` / `PanelLeftOpen`
- Transição de colapso: `width: 0px`, `overflow: hidden`, `transition: width 0.22s cubic-bezier(0.4,0,0.2,1)`
- Fundo: `var(--surface)`, `border-right: 1px solid var(--border)`

### 6.2 Miniatura de Slide

- Dimensões container: `width: 120px`, `height: 68px` (ratio 16:9 exato)
- Renderização: componente `<SlideMiniature>` com scale `0.125×` (120/960 = 0.125)
- Borda slide ativo: `2px solid var(--accent)` + `box-shadow: 0 0 0 3px var(--accent-soft)`
- Borda slide inativo: `1.5px solid var(--border)`
- Borda drag target: `2px dashed var(--accent-soft)`, `background: var(--accent-soft)` na row
- Número do slide: `font-size: 10.5px`, `font-weight: 600`, `font-variant-numeric: tabular-nums`, `color: var(--accent)` se ativo, `var(--text-3)` se inativo
- Row item: `padding: 5px 10px`, `display: flex`, `align-items: flex-start`, `gap: 8px`
- Row item ativa: `background: var(--accent-soft)`, `border-left: 2.5px solid var(--accent)`

### 6.3 Hover Actions

Ao passar o mouse sobre uma miniatura (não ativa), um overlay escuro `rgba(0,0,0,0.35)` aparece sobre a miniatura com dois botões centralizados:
- `Copy` Lucide — duplicar slide (fundo `rgba(255,255,255,0.9)`, border-radius 4px)
- `Trash2` Lucide — excluir slide (vermelho `#dc2626`); desabilitado se `slides.length <= 1`

### 6.4 Ações Disponíveis

| Ação | Como acionar |
|------|-------------|
| Selecionar slide | Click na miniatura |
| Reordenar | Drag-and-drop (via `draggable`, HTML5 DnD API) |
| Duplicar | Hover → botão copy / Click direito → menu |
| Excluir | Hover → botão trash / Click direito → menu |
| Adicionar slide | Botão "+" no header do painel / Botão dashed no footer |

**Adicionar slide — picker de layout:**
- O picker expande inline dentro do painel (não popup externo)
- Lista vertical com 7 layouts, ícone + label
- Cada opção: `padding: 7px 10px`, hover `background: var(--accent-soft)`, `color: var(--accent)`
- O novo slide é inserido **após o slide atualmente ativo** (`afterIndex: activeIndex`)

**Menu de contexto (click direito) no slide:**
- `position: fixed` no ponto do click
- Opções: "Duplicar" | "Excluir" (com separador visual e danger style)
- Fecha ao clicar fora (overlay transparente fullscreen com `z-index: 999`)

---

## 7. Menu de Contexto (Clique Direito)

Novo componente: `ContextMenu.tsx`. Renderizado no `portal` (via `ReactDOM.createPortal` no `document.body`). `position: fixed` no ponto do clique com ajuste de borda (se muito próximo da borda direita/inferior, abre para o lado oposto).

**Estilo:** `background: var(--surface)`, `border: 1px solid var(--border)`, `border-radius: var(--r-md)`, `padding: 4px 0`, `min-width: 180px`, `box-shadow: var(--shadow-lg)`, `z-index: 1000`.

**Item de menu:** `padding: 9px 14px`, `font-size: 13px`, `font-weight: 500`, hover `background: var(--surface-2)`.
**Item danger:** `color: var(--bad)`, hover `background: var(--bad-soft)`.
**Separador:** `div` com `height: 1px`, `background: var(--border)`, `margin: 4px 0`.
**Atalho hint:** texto `font-size: 11px`, `color: var(--text-3)` alinhado à direita na mesma linha.
**Item desabilitado:** `opacity: 0.4`, `cursor: default`, não aciona hover.

### 7.1 No Canvas vazio (click direito no fundo, sem seleção)

```
┌──────────────────────────────────┐
│ Inserir texto                [T] │
│ Inserir forma                [R] │
│ Inserir ícone                [I] │
├──────────────────────────────────┤
│ Colar                    [Ctrl+V]│
├──────────────────────────────────┤
│ Selecionar tudo          [Ctrl+A]│
├──────────────────────────────────┤
│ Adicionar slide depois           │
│ Duplicar slide atual             │
└──────────────────────────────────┘
```

"Colar" fica desabilitado se não há nada no clipboard interno do VIZU.
"Adicionar slide depois" chama `onAddSlide(layout='blank', activeIndex)` — abre o picker de layout inline no SlidePanel.

### 7.2 Em TextElement

```
┌──────────────────────────────────┐
│ Editar texto                     │ ← simula double-click (entra em edição)
├──────────────────────────────────┤
│ Copiar                   [Ctrl+C]│
│ Duplicar                 [Ctrl+D]│
├──────────────────────────────────┤
│ Trazer à frente                  │
│ Enviar ao fundo                  │
├──────────────────────────────────┤
│ Bloquear                         │ ← toggle lock
│ Ocultar                          │ ← toggle visible
├──────────────────────────────────┤
│ Excluir                    [Del] │ ← danger
└──────────────────────────────────┘
```

### 7.3 Em ShapeElement

```
┌──────────────────────────────────┐
│ Copiar                   [Ctrl+C]│
│ Duplicar                 [Ctrl+D]│
├──────────────────────────────────┤
│ Trazer à frente                  │
│ Enviar ao fundo                  │
├──────────────────────────────────┤
│ Bloquear                         │
│ Ocultar                          │
├──────────────────────────────────┤
│ Excluir                    [Del] │ ← danger
└──────────────────────────────────┘
```

### 7.4 Em ImageElement

```
┌──────────────────────────────────┐
│ Substituir imagem…               │
├──────────────────────────────────┤
│ Copiar                   [Ctrl+C]│
│ Duplicar                 [Ctrl+D]│
├──────────────────────────────────┤
│ Trazer à frente                  │
│ Enviar ao fundo                  │
├──────────────────────────────────┤
│ Bloquear                         │
│ Ocultar                          │
├──────────────────────────────────┤
│ Excluir                    [Del] │ ← danger
└──────────────────────────────────┘
```

### 7.5 Em múltipla seleção

```
┌──────────────────────────────────┐
│ {N} elementos selecionados       │ ← label desabilitado (cinza)
├──────────────────────────────────┤
│ Alinhar à esquerda               │
│ Centralizar horizontalmente      │
│ Alinhar à direita                │
│ Alinhar ao topo                  │
│ Centralizar verticalmente        │
│ Alinhar à base                   │
├──────────────────────────────────┤
│ Distribuir horizontalmente       │
│ Distribuir verticalmente         │
├──────────────────────────────────┤
│ Duplicar seleção         [Ctrl+D]│
├──────────────────────────────────┤
│ Excluir seleção            [Del] │ ← danger
└──────────────────────────────────┘
```

---

## 8. Menu Superior do Editor

**Novo componente: `EditorMenuBar.tsx`**

Posicionado como uma **faixa adicional opcional** entre a Toolbar principal e a ContextToolbar. Altura: `32px`. Fundo: `var(--surface)`, `border-bottom: 1px solid var(--border)`.

**Decisão de arquitetura:** o menu superior é introduzido de forma progressiva — inicialmente omitido da UI por padrão (os atalhos já cobrem a maior parte das ações). Pode ser ativado via toggle. Esta spec o define para implementação futura sem bloqueio.

**Razão:** o VIZU é primariamente controlado por teclado e toolbar visual. Um menu bar completo adicionaria ruído para usuários já familiarizados. Futuramente, quando funcionalidades avançadas (animações, notas de apresentação, exportação customizada) forem adicionadas, o menu bar se justifica.

### 8.1 Estrutura de Menus

```
Arquivo | Editar | Inserir | Slide | Tema | Ajuda
```

| Menu | Itens |
|------|-------|
| **Arquivo** | Nova apresentação… (abre home) \| Duplicar apresentação \| ─── \| Salvar agora (Ctrl+S) \| Exportar .pptx (Ctrl+Shift+E) \| ─── \| Voltar à galeria |
| **Editar** | Desfazer (Ctrl+Z) \| Refazer (Ctrl+Shift+Z) \| ─── \| Selecionar tudo (Ctrl+A) \| Desselecionar (Esc) \| ─── \| Copiar (Ctrl+C) \| Duplicar (Ctrl+D) \| Excluir (Del) |
| **Inserir** | Texto [T] \| Imagem [M] \| Forma [R] \| Ícone [I] |
| **Slide** | Adicionar slide em branco \| Adicionar slide com layout… \| ─── \| Duplicar slide atual \| Excluir slide atual |
| **Tema** | Aplicar tema… (abre seção tema do painel) \| Modo claro \| Modo escuro \| Seguir sistema |
| **Ajuda** | Atalhos de teclado… (abre modal de atalhos) \| Sobre o Vizu |

**Estilo dos dropdowns:** idêntico ao menu de contexto (§7) — `var(--surface)`, `border: var(--border)`, `box-shadow: var(--shadow-lg)`.

---

## 9. Fluxo de Criação de Nova Apresentação

### 9.1 Da Home até o Primeiro Slide

1. **Home page** → usuário vê grid de `PresentationCard`s (ou empty state)
2. Usuário clica "Nova Apresentação" (botão `.btn-primary` na sidebar ou topbar)
3. **Modal "Nova Apresentação"** aparece (`modal-backdrop` + `modal-box`)
4. Usuário preenche:
   - Campo **Título** (autoFocus, `Enter` cria diretamente)
   - Seleciona **Tema inicial** (grid 3×2 de opções visuais com preview mini)
5. Usuário clica **"Criar"** → `handleCreate()` é chamado
6. Cria `Presentation` com 3 slides padrão: `cover` + `content` + `closing`
7. `storage.set(p)` persiste no localStorage
8. `router.push('/editor/${p.id}')` — navegação direta para o editor
9. **Editor** abre com o slide 1 (cover) ativo, PropertiesPanel mostrando fundo do slide

**Duração do fluxo:** 3–5 ações do usuário. Sem telas intermediárias.

**Toast de boas-vindas:** ao abrir o editor pela primeira vez (verificar se `metadata.createdAt === metadata.updatedAt` e diferença < 5s), exibir toast `info` por 4s: "Apresentação criada! Clique em qualquer texto para editar."

### 9.2 Wireframe do Modal de Nova Apresentação

```
┌─────────────────────────────────────────────────────┐
│  Nova Apresentação                              [×]  │
│                                                      │
│  Título                                              │
│  ┌──────────────────────────────────────────────┐   │
│  │  Minha Apresentação                          │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Tema inicial                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ ████████     │  │ ▓▓▓▓▓▓▓▓    │  │ ░░░░░░░░   │ │
│  │ ●●● Slate  ★ │  │ ●●● Midnight │  │ ●●● Forest │ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │              │  │              │  │            │ │
│  │ ●●● Rose     │  │ ●●● Ocean    │  │ ●●● Mono   │ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
│                                                      │
│                          [Cancelar]  [Criar →]       │
└─────────────────────────────────────────────────────┘
```

- Tema selecionado: `border: 2px solid var(--accent)`, `background: var(--accent-soft)` no card
- Tema não selecionado: `border: 2px solid var(--border)`, `background: var(--bg)`
- Hover em tema não selecionado: `border-color: var(--border)` → `var(--text-3)` (sutil)
- Botão "Criar" fica disabled se título vazio (não renderiza disabled visualmente — mantém aparência normal para não confundir, apenas não age)
- `Enter` no campo título ativa "Criar"

---

## 10. Mapa Completo de Atalhos de Teclado

| Atalho | Ação | Contexto |
|--------|------|---------|
| **Inserção de elementos** | | |
| `T` | Inserir texto | Canvas (foco não em input/textarea/contenteditable) |
| `R` | Inserir retângulo | Canvas |
| `M` | Abrir menu inserção de imagem | Canvas |
| `I` | Abrir icon picker | Canvas |
| **Edição** | | |
| `Double-click` em texto | Entrar em modo de edição inline | Canvas, sobre TextElement |
| `Ctrl+Z` | Desfazer | Global (editor) |
| `Ctrl+Shift+Z` | Refazer | Global (editor) |
| `Ctrl+D` | Duplicar elemento(s) selecionado(s) | Canvas com seleção |
| `Ctrl+C` | Copiar elemento(s) selecionado(s) | Canvas com seleção |
| `Ctrl+V` | Colar (elemento copiado ou imagem do clipboard) | Canvas |
| `Ctrl+A` | Selecionar todos os elementos do slide | Canvas |
| `Escape` | Sair do modo de edição de texto / Desselecionar | Canvas ou modo edição |
| `Delete` / `Backspace` | Excluir elemento(s) selecionado(s) | Canvas com seleção, fora de edição de texto |
| `↑` `↓` `←` `→` | Mover elemento(s) selecionado(s) em 1px | Canvas com seleção |
| `Shift+↑` `↓` `←` `→` | Mover elemento(s) selecionado(s) em 10px | Canvas com seleção |
| **Zoom** | | |
| `Ctrl+=` (ou `Ctrl++`) | Zoom in (+10%) | Global (editor) |
| `Ctrl+-` | Zoom out (−10%) | Global (editor) |
| `Ctrl+0` | Zoom fit (70%) | Global (editor) |
| **Navegação** | | |
| `Espaço` + drag | Pan do canvas | Canvas |
| `F5` | Abrir preview fullscreen | Global (editor) |
| `Escape` | Fechar preview | Preview modal |
| `→` / `Space` / `↓` | Próximo slide | Preview modal |
| `←` / `↑` | Slide anterior | Preview modal |
| **Global** | | |
| `Ctrl+S` | Salvar (aciona save indicator) | Global (editor) |
| `Ctrl+Shift+E` | Exportar .pptx | Global (editor) |
| `Ctrl+G` | Toggle grade visual | Global (editor) |
| `F1` | Modal de atalhos de teclado | Global (editor) |

**Conflitos e resoluções:**
- `T`, `R`, `M`, `I` só funcionam quando `document.activeElement` não é `INPUT`, `TEXTAREA`, `SELECT` e `el.contentEditable !== 'true'`. Implementar via guard: `if (['INPUT','TEXTAREA','SELECT'].includes((e.target as HTMLElement).tagName) || (e.target as HTMLElement).isContentEditable) return;`
- `Delete`/`Backspace` já tem guard para `isContentEditable` (implementado em 2026-06-20)
- `Ctrl+C` no editor não conflita com cópia de texto porque o guard só ativa quando canvas tem foco (não em edição de texto)
- `Escape` tem dupla função: sair de edição de texto (prioridade 1) e desselecionar (prioridade 2, se não estava editando)

---

## 11. Checklist de Implementação

### Componente: Toolbar.tsx

- [ ] Adicionar atalhos de teclado `T`, `R`, `M`, `I` via `useEffect` com `keydown` listener no `document` (guard: não em input/textarea/contenteditable)
- [ ] Atualizar tooltips dos botões de inserção para incluir o atalho: ex. `title="Texto [T]"`
- [ ] Mover ContextToolbar para **sempre renderizada** — remover o `{hasSelection && ...}` que monta/desmonta; substituir por renderização condicional do conteúdo interno (com `opacity` transitioning)
- [ ] Garantir que ContextToolbar ocupe `height: 42px` fixos mesmo no estado vazio (hint textual)
- [ ] Adicionar `Ctrl+G` para toggle de grade (atualmente falta o atalho de teclado)
- [ ] Adicionar `Ctrl+Shift+E` para acionar export (além do botão visual)
- [ ] Adicionar `F1` para abrir modal de atalhos (novo componente `KeyboardShortcutsModal`)
- [ ] Botões de inserção: garantir estado `disabled` com `opacity: 0.4` (não `display:none`) quando `!activeSlideId`

### Componente: CanvasElement.tsx + SlideCanvas.tsx

- [ ] Implementar `Ctrl+A` — selecionar todos os elementos do slide ativo
- [ ] Implementar movimentação por teclas de seta: `1px` padrão, `10px` com `Shift` pressionado
- [ ] Implementar pan do canvas via `Espaço+drag`: detectar `keydown Space` → cursor `grab`, durante drag cursor `grabbing`, `keyup Space` → cursor default
- [ ] Garantir `Escape` com dupla função (sair edição → depois desselecionar)
- [ ] Implementar clipboard interno: ao `Ctrl+C` com seleção, salvar deep copy dos elementos em `useRef<SlideElement[]>` no editor page; `Ctrl+V` cria cópias com offset +16px

### Componente: PropertiesPanel.tsx

- [ ] Implementar estado "sem seleção" novo: remover empty state atual (ícone+texto), exibir `SlideProperties` + `ThemeProperties` diretamente com cabeçalho "Slide Atual" (sem tabs)
- [ ] Quando há seleção: renderizar tabs normalmente (Elemento / Slide / Tema)
- [ ] Corrigir reset de tab ativa para "Elemento" ao mudar seleção (salvar tab em `useRef` e comparar `selectedElements[0]?.id`)
- [ ] Adicionar seção "Alinhamento" para multi-seleção (`selectedElements.length > 1`) no lugar das props individuais
- [ ] Implementar lógica de alinhamento: `AlignLeft`, `AlignCenterHorizontal`, `AlignRight`, `AlignTop`, `AlignCenterVertical`, `AlignBottom`, `DistributeH`, `DistributeV`; cada operação chama `onUpdateElement` individualmente para cada elemento selecionado (undo/redo correto)
- [ ] Adicionar botão "Substituir imagem" na seção ImageProperties (abre `<input type="file">` hidden)
- [ ] Adicionar botão "Trocar ícone" na seção IconProperties (reutilizar o mesmo icon picker da Toolbar)
- [ ] Implementar colapso do painel: botão `PanelRightClose`/`PanelRightOpen` no cabeçalho das tabs; persistir em `localStorage['vizu-props-panel']`

### Componente: ContextToolbar.tsx

- [ ] Adicionar suporte a multi-seleção: quando `elements.length > 1`, exibir controles de alinhamento (§5.6)
- [ ] Mover os botões "Trazer à frente", "Enviar ao fundo", "Duplicar", "Excluir" para a ContextToolbar (receber `onBringToFront`, `onSendToBack`, `onDuplicateElement`, `onRemoveElement` via props)
- [ ] Adicionar botão "Substituir imagem" no estado ImageElement (mesma lógica da Toolbar: `fileInputRef + handleFileSelect`)
- [ ] Adicionar botão "Trocar ícone" no estado IconElement
- [ ] Estado neutro (nenhum elemento): renderizar hint textual com `opacity: 0.5`
- [ ] Animar transição de estado via `opacity: 0 → 1` (150ms ease), não por mount/unmount
- [ ] Remover prop `onUpdateElement` como único ponto de mutação — receber também `onBringToFront`, `onSendToBack`, `onDuplicateElement`, `onRemoveElement` para completar os controles inline

### Componente: SlidePanel.tsx

- [ ] Adicionar botão de colapso no rodapé do painel (ícone `PanelLeftClose`/`PanelLeftOpen`); persistir em `localStorage['vizu-slide-panel']`
- [ ] Propagar estado de colapso para o componente pai (editor page) para ajustar o layout flex
- [ ] Menu de contexto (click direito) já implementado — sem mudança necessária
- [ ] Mover o layout picker para abrir inline no painel (já está assim) — confirmar que o layout picker fecha ao clicar fora do painel também

### Componente: page.tsx (home)

- [ ] Adicionar toast de "Apresentação criada!" ao abrir o editor pela primeira vez: detectar `?new=true` na URL e exibir toast no editor page; home passa `?new=true` no `router.push`
- [ ] Sem outras mudanças — a home já está alinhada com as melhores práticas

### Novo componente: ContextMenu.tsx

- [ ] Criar `src/components/editor/ContextMenu.tsx`
- [ ] Interface Props: `{ x: number, y: number, items: ContextMenuItem[], onClose: () => void }`
- [ ] Interface `ContextMenuItem`: `{ label: string, shortcut?: string, icon?: React.ReactNode, action: () => void, danger?: boolean, disabled?: boolean, separator?: boolean }`
- [ ] Usar `ReactDOM.createPortal` no `document.body`
- [ ] Ajuste de posição de borda: se `x + 180 > window.innerWidth`, `left = x - 180`; se `y + estimatedHeight > window.innerHeight`, `top = y - estimatedHeight`
- [ ] Fechar ao clicar fora: overlay transparente `position: fixed; inset: 0; z-index: 999`
- [ ] Fechar ao pressionar `Escape`
- [ ] Integrar no `SlideCanvas.tsx`: adicionar `onContextMenu` no container do canvas que distingue click em elemento vs. fundo e monta o menu correto (§7.1 a §7.5)

### Novo componente: KeyboardShortcutsModal.tsx

- [ ] Criar `src/components/editor/KeyboardShortcutsModal.tsx`
- [ ] Aberto via `F1` ou item "Ajuda" → "Atalhos de teclado"
- [ ] `modal-backdrop` + `modal-box` (classes do design system)
- [ ] Tabela de atalhos agrupada por categoria (usar a tabela do §10)
- [ ] Fecha via `Escape` ou botão X

---

## 12. Restrições e Não-Mudanças

As seguintes partes do sistema **NÃO devem ser alteradas** durante a implementação desta spec:

| Item | Motivo |
|------|--------|
| `SLIDE_WIDTH = 960`, `SLIDE_HEIGHT = 540` | Constante ligada ao `PX_TO_IN` do `pptxExport.ts` — mudar quebra export |
| Todos os campos de `BaseElement` (`locked`, `visible`, `zIndex`, `opacity`, `rotation`) | Componentes de elemento dependem de todos esses campos |
| `useHistory.ts` — API pública (`set`, `undo`, `redo`, `canUndo`, `canRedo`) | `usePresentation.ts` depende dessa API |
| `usePresentation.ts` — API pública (todas as funções listadas em vizu.md §6) | Editor page consome todas essas funções |
| `storage.ts` — único ponto de acesso ao localStorage | Regra de negócio: nunca `localStorage` direto |
| `types/slide.ts` — interfaces de tipos | Centralizadas; mudanças aqui quebram toda a codebase |
| `pptxExport.ts` — mapeamento de elementos para PptxGenJS | Export é funcionalidade crítica; não refatorar sem testar |
| Coordenadas em pixels nativos (não porcentagem) | Sistema todo depende de px; mudar quebraria drag/resize/export |
| API routes `/api/ai/create`, `/api/ai/modify`, `/api/export` | Interface para Claude Code — não quebrar contratos de input/output |
| Temas predefinidos (`lib/themes.ts`) | IDs de tema são usados na API; renomear quebra apresentações salvas |
| Atalhos de teclado existentes (`Ctrl+Z`, `Ctrl+D`, `Ctrl+S`, `F5`, `Delete`, `Backspace`, `Double-click`) | Padrões universais já implementados e testados — documentados em vizu.md §4.1 |
| `SlideMiniature.tsx` — renderização CSS de miniaturas | Shared entre SlidePanel e home page; não depende de CanvasElement |
| `PreviewModal.tsx` — overlay de apresentação | Funciona independentemente; não quebrar as interações de navegação |
| Persistência de tema 3-estados (`localStorage['vizu-theme']`) | Script anti-flash no `<head>` depende dessa chave específica |
| Inter via Google Fonts + fallback `system-ui` | Definido em `layout.tsx`; não substituir |
| CSS custom properties (`globals.css`) | Tokens usados em todos os componentes via inline styles; não renomear |
