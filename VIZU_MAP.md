# VIZU_MAP — Fonte de Verdade Interna

Documento gerado pelo processo de mapeamento do plano VIZU AI. Consolida estrutura de dados, API, operações e sistema de coordenadas.

---

## 1. Modelo de Dados

### 1.1 Dimensões do Canvas

```
SLIDE_WIDTH  = 960  (pixels)
SLIDE_HEIGHT = 540  (pixels)
Proporção: 16:9
Origem: canto superior esquerdo (0, 0)
Unidade: pixels nativos do slide (NÃO porcentagem, NÃO rem)
Scale de renderização no browser: varia (70% padrão, 25%–200% via zoom)
Coordenadas armazenadas: sempre em pixels nativos, independente do zoom
```

### 1.2 Hierarquia de Objetos

```
Presentation
  ├── id: string (UUID v4)
  ├── title: string
  ├── theme: Theme
  ├── slides: Slide[]
  └── metadata: PresentationMetadata

Slide
  ├── id: string (UUID v4)
  ├── layout: LayoutType
  ├── background: SlideBackground
  ├── elements: SlideElement[]
  └── notes?: string

SlideElement (union)
  = TextElement | ImageElement | ShapeElement | IconElement | TableElement | LineElement
```

### 1.3 BaseElement (todos os elementos herdam)

| Campo     | Tipo    | Padrão  | Notas                          |
|-----------|---------|---------|--------------------------------|
| id        | string  | UUID v4 | gerado automaticamente         |
| type      | string  | —       | text\|image\|shape\|icon\|table\|line |
| x         | number  | —       | pixels, 0–960                  |
| y         | number  | —       | pixels, 0–540                  |
| width     | number  | —       | pixels, mín 8                  |
| height    | number  | —       | pixels, mín 8                  |
| rotation  | number  | 0       | graus                          |
| opacity   | number  | 1       | 0–1                            |
| zIndex    | number  | 1       | ordem de renderização          |
| locked    | boolean | false   | impede drag/resize             |
| visible   | boolean | true    | false = oculto mas presente    |
| name      | string? | —       | rótulo opcional                |

### 1.4 TextElement

```typescript
{
  ...BaseElement,
  type: 'text',
  content: string,
  style: {
    fontFamily: string,        // 'Inter' | 'Georgia' | 'monospace'
    fontSize: number,          // pixels
    fontWeight: number,        // 100–900
    fontStyle: 'normal' | 'italic',
    textDecoration: 'none' | 'underline' | 'line-through',
    color: string,             // hex
    textAlign: 'left' | 'center' | 'right' | 'justify',
    lineHeight: number,        // multiplicador (1.5 = 150%)
    letterSpacing: number,     // px (pode ser negativo)
    textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize',
  },
  background: string,          // hex ou 'transparent'
  border: BorderStyle,
  padding: number,             // px
  verticalAlign: 'top' | 'middle' | 'bottom',
}
```

### 1.5 ShapeElement

```typescript
{
  ...BaseElement,
  type: 'shape',
  shape: 'rectangle' | 'rounded-rectangle' | 'circle' | 'triangle' |
         'diamond' | 'pentagon' | 'hexagon' | 'star' | 'arrow-right' | 'arrow-left',
  fill: string,                // hex
  border: BorderStyle,
  shadow: ShadowStyle,
}
```

### 1.6 IconElement

```typescript
{
  ...BaseElement,
  type: 'icon',
  iconName: string,            // nome do ícone Lucide (ver lista em §4)
  color: string,               // hex
  background: string,          // hex ou 'transparent'
  border: BorderStyle,
}
```

### 1.7 ImageElement

```typescript
{
  ...BaseElement,
  type: 'image',
  src: string,                 // URL ou data URL base64
  alt: string,
  objectFit: 'cover' | 'contain' | 'fill',
  border: BorderStyle,
  shadow: ShadowStyle,
}
```

### 1.8 LineElement

```typescript
{
  ...BaseElement,
  type: 'line',
  color: string,               // hex
  thickness: number,           // px (padrão 2)
  style: 'solid' | 'dashed' | 'dotted',
  arrowStart: boolean,
  arrowEnd: boolean,
}
```

### 1.9 TableElement (sem suporte de export PPTX)

```typescript
{
  ...BaseElement,
  type: 'table',
  rows: TableCell[][],
  headerRow: boolean,
  headerCol: boolean,
  borderColor: string,
  headerBackground: string,
  headerTextColor: string,
  alternateRowColor: boolean,
  alternateColor: string,
}
```

### 1.10 SlideBackground

```typescript
{
  type: 'color' | 'gradient' | 'image',
  color?: string,             // hex — quando type=color
  gradient?: {
    from: string,             // hex
    to: string,               // hex
    direction: number,        // graus (0=topo, 90=direita, 180=baixo, 270=esquerda)
  },
  image?: string,             // URL ou data URL — quando type=image
  imageOpacity?: number,      // 0–1 — quando type=image
}
```

### 1.11 Theme

```typescript
{
  id: string,
  name: string,
  colors: {
    primary: string,          // cor principal (botões, barras, destaques)
    secondary: string,        // cor secundária
    accent: string,           // destaque alternativo
    background: string,       // fundo do slide
    surface: string,          // superfície de cards/painéis
    text: string,             // texto principal
    textSecondary: string,    // texto secundário
    border: string,           // bordas
  },
  fonts: {
    heading: string,          // fonte para títulos
    body: string,             // fonte para corpo
  },
}
```

---

## 2. Temas Disponíveis

| ID       | primary   | background | text    | Estilo                              |
|----------|-----------|------------|---------|-------------------------------------|
| slate    | #3b82f6   | #ffffff    | #0f172a | Azul corporativo sobre branco       |
| midnight | #818cf8   | #0f172a    | #f1f5f9 | Roxo/índigo sobre fundo escuro      |
| forest   | #10b981   | #ffffff    | #064e3b | Verde-esmeralda sobre branco        |
| rose     | #f43f5e   | #ffffff    | #0f172a | Vermelho/rosa sobre branco          |
| ocean    | #0ea5e9   | #ffffff    | #0c4a6e | Azul-céu sobre branco               |
| mono     | #171717   | #fafafa    | #171717 | Preto sobre off-white               |

---

## 3. Layouts Disponíveis

| ID         | Elementos Gerados                                              | Campos Dados (PT)                                      |
|------------|---------------------------------------------------------------|--------------------------------------------------------|
| blank      | nenhum                                                        | —                                                      |
| cover      | forma_acento, titulo, subtitulo*, meta*, forma_decorativa     | titulo, subtitulo, autor, data                         |
| section    | fundo, titulo, subtitulo*                                     | titulo, subtitulo                                      |
| content    | barra_titulo, titulo, divisor, bullets*                       | titulo, bullets[], conteudo                            |
| comparison | titulo*, 2×(painel, barra, titulo, conteudo)                  | titulo, titulo_esq, conteudo_esq, titulo_dir, conteudo_dir |
| quote      | fundo, barra_lateral, citacao, atribuicao*                    | citacao, atribuicao                                    |
| closing    | fundo, linha_topo, titulo, subtitulo*                         | titulo, subtitulo                                      |

`*` = condicional (só aparece se o campo for fornecido)

---

## 4. Ícones Disponíveis (48 total)

```
Status/Feedback:  Star, Heart, Check, X, AlertCircle, Info, Shield, Lock
Negócios:         TrendingUp, TrendingDown, BarChart, PieChart, Activity, DollarSign, Percent, Briefcase
Pessoas:          Users, User, Building, Globe, Award
Comunicação:      Mail, Phone, Link, Search, Filter
Tempo/Local:      Calendar, Clock, Map, Flag
Tecnologia:       Code, Layers, Grid, List, Package
Ações:            Download, Upload, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ChevronRight
Conceitos:        Zap, Target, Lightbulb, Rocket, Key
```

---

## 5. API — Todos os Endpoints

### 5.1 Endpoints Originais (pre-existentes)

| Método | Endpoint              | Função                                    |
|--------|-----------------------|-------------------------------------------|
| POST   | /api/ai/create        | Criar apresentação via spec JSON          |
| POST   | /api/ai/modify        | Modificar apresentação via operations[]   |
| POST   | /api/export           | Exportar .pptx binário                    |
| GET    | /api/presentations    | Listar apresentações (in-memory)          |
| POST   | /api/presentations    | Criar apresentação (in-memory)            |
| PUT    | /api/presentations    | Atualizar apresentação (in-memory)        |
| DELETE | /api/presentations    | Deletar apresentação (in-memory)          |

### 5.2 Endpoints VIZU-AI (novos)

| Método | Endpoint                  | Função                                          |
|--------|---------------------------|-------------------------------------------------|
| POST   | /api/vizu-ai/execute      | Executar array de comandos estruturados         |
| POST   | /api/vizu-ai/create       | Criar apresentação via JSON único               |
| GET    | /api/vizu-ai/schema       | Schema JSON completo para validação             |
| GET    | /api/vizu-ai/comandos     | Referência de todos os comandos /execute        |
| GET    | /api/vizu-ai/temas        | Todos os temas com tokens de cor                |
| GET    | /api/vizu-ai/layouts      | Todos os layouts com elementos e campos         |
| GET    | /api/vizu-ai/icones       | Catálogo de ícones por categoria                |
| GET    | /api/vizu-ai/fontes       | Fontes disponíveis + escala tipográfica         |

### 5.3 POST /api/vizu-ai/execute — Comandos

| Comando             | Parâmetros Obrigatórios        | Parâmetros Opcionais                          |
|---------------------|-------------------------------|-----------------------------------------------|
| criar_apresentacao  | nome                          | tema, autor, descricao, tags                  |
| definir_titulo      | titulo                        | —                                             |
| definir_tema        | tema                          | cores, fontes                                 |
| adicionar_slide     | layout                        | dados, background, posicao                    |
| remover_slide       | slide_id OU slide_indice      | —                                             |
| duplicar_slide      | —                             | slide_id, slide_indice                        |
| mover_slide         | para_posicao                  | slide_id, slide_indice                        |
| reordenar_slides    | ordem (string[])              | —                                             |
| editar_slide        | —                             | slide_id, slide_indice, background, notas     |
| adicionar_elemento  | tipo, props                   | slide_id, slide_indice                        |
| editar_elemento     | props                         | slide_id, slide_indice, elemento_id, elemento_indice |
| remover_elemento    | —                             | slide_id, slide_indice, elemento_id, elemento_indice |

---

## 6. Sistema de Coordenadas

### 6.1 Origem e Eixos

```
(0,0) ─────────────────────────── (960,0)
  │                                    │
  │         SLIDE 16:9                 │
  │         960 × 540 px               │
  │                                    │
(0,540) ─────────────────────── (960,540)
```

- X aumenta para a direita
- Y aumenta para baixo
- Coordenadas são do canto superior esquerdo do elemento

### 6.2 Área Segura

Margem mínima recomendada para não cortar em projeções:
```
Horizontal: 80px de cada lado
Vertical: 40px de cada lado
Área segura: { x: 80, y: 40, width: 800, height: 460 }
```

### 6.3 Posições Semânticas (aliases no /execute)

| Alias               | x   | y   | width | height |
|---------------------|-----|-----|-------|--------|
| centro              | 280 | 170 | 400   | 200    |
| topo                | 80  | 40  | 800   | 80     |
| rodape              | 80  | 460 | 800   | 60     |
| col_esquerda        | 40  | 120 | 420   | 360    |
| col_direita         | 500 | 120 | 420   | 360    |
| topo_esquerda       | 40  | 40  | 400   | 200    |
| topo_direita        | 520 | 40  | 400   | 200    |
| canto_inferior_esq  | 40  | 380 | 300   | 120    |
| canto_inferior_dir  | 620 | 380 | 300   | 120    |
| largura_total       | 0   | 120 | 960   | 300    |
| area_conteudo       | 80  | 120 | 800   | 360    |

### 6.4 Centralização Manual

```
Centro X: x = (960 - width) / 2
Centro Y: y = (540 - height) / 2
Título típico (width=800): x = (960 - 800) / 2 = 80
```

### 6.5 Layout de Duas Colunas

```
Col esquerda: x=40, y=120, width=420  → x2 = 460
Gap central:  x=460 a x=500 (40px de gap)
Col direita:  x=500, y=120, width=420 → x2 = 920
```

---

## 7. Persistência

### 7.1 localStorage (padrão)
- Chave: `vizu_presentations`
- Formato: `Record<id, Presentation>` serializado como JSON
- Auto-save: toda operação via `usePresentation.update()`

### 7.2 Como carregar no browser

```javascript
// No console do browser
const p = /* Presentation JSON */;
const all = JSON.parse(localStorage.getItem('vizu_presentations') || '{}');
all[p.id] = p;
localStorage.setItem('vizu_presentations', JSON.stringify(all));
window.location.href = '/editor/' + p.id;
```

### 7.3 Server-side (in-memory)
- `/api/presentations` mantém estado em memória
- Não persiste entre deploys/restarts
- Para uso programático sem browser

---

## 8. Exportação PPTX

### 8.1 Mapeamento Pixel → Polegadas

```
PX_TO_IN = 10 / 960
slide 960px = 10 polegadas (LAYOUT_WIDE)
slide 540px = 5.625 polegadas
```

### 8.2 Suporte por Tipo de Elemento

| Elemento    | PPTX    | Notas                          |
|-------------|---------|--------------------------------|
| text        | ✅      | tipografia completa            |
| shape       | ✅      | fill + border                  |
| image       | ✅      | path da URL                    |
| icon        | ✅      | SVG→PNG via canvas offscreen   |
| line        | ✅      | como shape 'line'              |
| table       | ❌      | sem suporte PptxGenJS          |

### 8.3 Limitações Conhecidas

- Opacity de shapes: não disponível via PptxGenJS
- Gradientes de background: exportam como cor sólida (from)
- Tabelas: não exportam

---

## 9. Fontes Disponíveis

| ID        | Categoria  | Pesos             | Melhor Para                  |
|-----------|------------|-------------------|------------------------------|
| Inter     | sans-serif | 300–800           | geral, corporativo, tech     |
| Georgia   | serif      | 400, 700          | editorial, citações          |
| monospace | monospace  | 400, 700          | código, dados técnicos       |

### 9.1 Escala Tipográfica

| Contexto                | Fonte  | Peso | Tamanho | Letter-spacing |
|-------------------------|--------|------|---------|----------------|
| Título de capa          | Inter  | 700  | 52px    | -0.5           |
| Título de seção         | Inter  | 700  | 44px    | -0.3           |
| Título de slide         | Inter  | 700  | 30px    | -0.2           |
| Subtítulo               | Inter  | 400  | 22px    | 0              |
| Corpo / bullets         | Inter  | 400  | 20px    | 0              |
| Dado numérico grande    | Inter  | 800  | 64px    | -1             |
| Legenda / meta          | Inter  | 400  | 14px    | +0.5           |
| Citação                 | Inter  | 300  | 28px    | 0              |
