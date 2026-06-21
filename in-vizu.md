# in-vizu — Manual de Operação por IA

> **Leia este arquivo integralmente antes de criar qualquer apresentação no VIZU.**
> Ele é o contrato entre a IA e o editor. Seguir este manual garante apresentações profissionais geradas sem mouse, sem tentativa e erro.

---

## Seção 1 — Propósito e Fluxo de Trabalho

### O que é o VIZU

O VIZU é um editor de apresentações canvas-based. Ele opera em dois modos:
- **Modo humano:** interface gráfica (mouse, drag-drop, teclado)
- **Modo IA:** API REST programática — a IA constrói toda a apresentação via chamadas HTTP

Este manual cobre exclusivamente o **modo IA**.

### O que a IA pode fazer

- Criar apresentações completas com múltiplos slides e todos os elementos posicionados
- Aplicar temas visuais pré-definidos ou customizados
- Usar 7 layouts de slide com elementos pré-posicionados pelo sistema
- Adicionar elementos customizados (texto, forma, ícone, imagem, linha) em qualquer posição
- Editar, remover e reordenar slides e elementos
- Gerar arquivo .pptx exportável

### Fluxo Obrigatório

**NUNCA crie uma apresentação sem antes consultar os endpoints de referência.** Os catálogos podem ter mudado.

```
1. GET /api/vizu-ai/temas     → quais temas existem, quais cores têm
2. GET /api/vizu-ai/layouts   → quais layouts existem, quais elementos geram
3. GET /api/vizu-ai/icones    → quais ícones existem (se for usar ícones)
4. Montar o array de comandos ou o JSON da apresentação
5. POST /api/vizu-ai/execute  → executar tudo de uma vez
6. Verificar resposta: campo "erros" deve ser [] ou lista vazia
7. Carregar no browser (ver §1.4)
```

### Autenticação

O VIZU não tem autenticação no modo atual (single-user, deploy próprio). Todas as chamadas são sem token.

```bash
curl -s -X POST https://vizu-czeviani.vercel.app/api/vizu-ai/execute \
  -H "Content-Type: application/json" \
  -d '{ "comandos": [...] }'
```

### Como Carregar no Browser

Após criar a apresentação via API, carregue o JSON resultante no localStorage:

```javascript
// No console do browser (abra vizu-czeviani.vercel.app primeiro)
const p = /* cole o JSON da apresentação aqui */;
const all = JSON.parse(localStorage.getItem('vizu_presentations') || '{}');
all[p.id] = p;
localStorage.setItem('vizu_presentations', JSON.stringify(all));
window.location.href = '/editor/' + p.id;
```

---

## Seção 2 — Sistema de Coordenadas e Posicionamento

### 2.1 Canvas

```
Largura:  960px (pixels nativos)
Altura:   540px (pixels nativos)
Proporção: 16:9
Origem:   canto superior esquerdo (0, 0)
Unidade:  pixels — NUNCA porcentagem, NUNCA rem
```

O zoom do browser (25%–200%) é apenas visual. As coordenadas salvas são sempre em pixels nativos.

### 2.2 Eixos

```
(0,0) ────────────────────────── (960,0)
  │                                   │
  │    X aumenta →                    │
  │    Y aumenta ↓                    │
  │                                   │
(0,540) ─────────────────────── (960,540)
```

O campo `x` e `y` de um elemento é o seu canto superior esquerdo.

### 2.3 Área Segura

Para evitar cortes em projeções, mantenha elementos dentro da área segura:

```
Margem horizontal: 80px de cada lado
Margem vertical:   40px de cada lado
Área segura: { x: 80, y: 40, width: 800, height: 460 }
```

Exceção: elementos decorativos de fundo (shapes que cobrem o slide inteiro) podem ir de 0 a 960/540.

### 2.4 Posições Semânticas

O endpoint `/execute` aceita `posicao` em vez de coordenadas manuais. O sistema converte automaticamente:

| posicao             | x   | y   | width | height | Uso típico                       |
|---------------------|-----|-----|-------|--------|----------------------------------|
| centro              | 280 | 170 | 400   | 200    | Elemento central único           |
| topo                | 80  | 40  | 800   | 80     | Título de slide                  |
| rodape              | 80  | 460 | 800   | 60     | Rodapé, fonte, nota              |
| col_esquerda        | 40  | 120 | 420   | 360    | Coluna esquerda de duas colunas  |
| col_direita         | 500 | 120 | 420   | 360    | Coluna direita de duas colunas   |
| topo_esquerda       | 40  | 40  | 400   | 200    | Elemento no canto sup. esq.      |
| topo_direita        | 520 | 40  | 400   | 200    | Elemento no canto sup. dir.      |
| canto_inferior_esq  | 40  | 380 | 300   | 120    | Badge ou número no canto inf. esq |
| canto_inferior_dir  | 620 | 380 | 300   | 120    | Badge ou número no canto inf. dir |
| largura_total       | 0   | 120 | 960   | 300    | Banner full-width                |
| area_conteudo       | 80  | 120 | 800   | 360    | Área principal de conteúdo       |

Você pode combinar `posicao` com `width` e `height` para sobrescrever apenas o tamanho:

```json
{
  "posicao": "topo_direita",
  "width": 60,
  "height": 60
}
```

### 2.5 Cálculos Manuais de Posicionamento

```
Centralizar horizontalmente: x = (960 - width) / 2
Centralizar verticalmente:   y = (540 - height) / 2
Alinhar à direita (com margem 80): x = 960 - 80 - width = 800 - width

Layout de duas colunas:
  Col. esq: { x: 40,  y: 120, width: 420 }
  Col. dir: { x: 500, y: 120, width: 420 }
  Gap: 40px (x=460 a x=500)

Posicionar ícone no topo de um slide de conteúdo (40px do topo):
  { x: 880, y: 40, width: 40, height: 40 }  → canto superior direito
```

### 2.6 Evitar Sobreposição

Ao adicionar múltiplos elementos a um slide:
1. Layouts pré-posicionam seus elementos automaticamente — não sobrescreva sem necessidade
2. Para elementos extras, respeite as zonas: topo (y < 110), conteúdo (y 120–450), rodapé (y > 460)
3. Ícones decorativos vão no topo-direito (x=860–920, y=40–80) para não conflitar com texto

---

## Seção 3 — Tipos de Elemento

### 3.1 Texto (`type: "text"`)

**Propriedades obrigatórias:** `conteudo`

**Propriedades de posição:** `x`, `y`, `width`, `height` OU `posicao`

**Propriedades de estilo completas:**

```json
{
  "estilo": {
    "fontFamily": "Inter",
    "fontSize": 24,
    "fontWeight": 400,
    "fontStyle": "normal",
    "textDecoration": "none",
    "color": "#0f172a",
    "textAlign": "left",
    "lineHeight": 1.5,
    "letterSpacing": 0,
    "textTransform": "none"
  },
  "fundo": "transparent",
  "borda": { "width": 0, "color": "transparent", "style": "none", "radius": 0 },
  "padding": 8,
  "alinhamento_vertical": "middle"
}
```

**Valores válidos:**
- `fontWeight`: 100, 200, 300, 400, 500, 600, 700, 800, 900
- `fontStyle`: "normal" | "italic"
- `textDecoration`: "none" | "underline" | "line-through"
- `textAlign`: "left" | "center" | "right" | "justify"
- `textTransform`: "none" | "uppercase" | "lowercase" | "capitalize"
- `alinhamento_vertical`: "top" | "middle" | "bottom"
- `borda.style`: "solid" | "dashed" | "dotted" | "none"

**Padrões:** fontFamily=Inter, fontSize=16, fontWeight=400, color=#0f172a, textAlign=left, lineHeight=1.5, padding=8

**Exemplo — título de slide:**
```json
{
  "cmd": "adicionar_elemento",
  "slide_indice": 1,
  "tipo": "text",
  "props": {
    "conteudo": "Resultados Q3 2026",
    "x": 80, "y": 52, "width": 784, "height": 52,
    "estilo": { "fontSize": 30, "fontWeight": 700, "color": "#0f172a", "letterSpacing": -0.2 }
  }
}
```

**Exemplo — dado numérico grande:**
```json
{
  "cmd": "adicionar_elemento",
  "slide_indice": 2,
  "tipo": "text",
  "props": {
    "conteudo": "+40%",
    "posicao": "centro",
    "estilo": { "fontSize": 96, "fontWeight": 800, "color": "#10b981", "textAlign": "center" }
  }
}
```

**Armadilhas:**
- Nunca use `fontSize` acima de 120 — excede a altura do slide
- `lineHeight` em bullets: use 1.8 para respiro visual
- Em slides escuros (midnight, closing): sempre use cor de texto clara (#f1f5f9 ou branco)

---

### 3.2 Forma (`type: "shape"`)

**Propriedades obrigatórias:** `forma`, `preenchimento`

**Formas disponíveis:** rectangle, rounded-rectangle, circle, triangle, diamond, pentagon, hexagon, star, arrow-right, arrow-left

**Exemplo — barra decorativa:**
```json
{
  "cmd": "adicionar_elemento",
  "tipo": "shape",
  "props": {
    "forma": "rectangle",
    "preenchimento": "#3b82f6",
    "x": 80, "y": 96, "width": 4, "height": 44
  }
}
```

**Exemplo — card com borda arredondada:**
```json
{
  "cmd": "adicionar_elemento",
  "tipo": "shape",
  "props": {
    "forma": "rounded-rectangle",
    "preenchimento": "#f8fafc",
    "borda": { "width": 1, "color": "#e2e8f0", "style": "solid", "radius": 12 },
    "sombra": { "enabled": true, "x": 0, "y": 4, "blur": 12, "color": "rgba(0,0,0,0.08)" },
    "x": 40, "y": 120, "width": 420, "height": 360
  }
}
```

**Armadilhas:**
- `preenchimento` com `opacity` no elemento para transparência — opacity vai em BaseElement, não dentro de `preenchimento`
- Para linhas divisórias, use `type: "line"` (mais preciso) ou shape com height=1

---

### 3.3 Ícone (`type: "icon"`)

**Propriedades obrigatórias:** `nome_icone`, `cor`

O ícone é renderizado via SVG Lucide. No PPTX, é convertido para PNG (200×200px) via canvas offscreen.

**Exemplo:**
```json
{
  "cmd": "adicionar_elemento",
  "tipo": "icon",
  "props": {
    "nome_icone": "TrendingUp",
    "cor": "#10b981",
    "posicao": "topo_direita",
    "width": 64,
    "height": 64
  }
}
```

**Tamanhos recomendados:**
- Ícone decorativo grande: 80–120px
- Ícone em lista de bullets: 24–32px
- Ícone de destaque em slide de métrica: 60–80px

**Armadilhas:**
- O campo é `nome_icone` (não `icon`, não `iconId`, não `name`)
- O valor é case-sensitive: "TrendingUp" funciona, "trendingup" falha
- Consulte GET /api/vizu-ai/icones para a lista exata de nomes válidos

---

### 3.4 Imagem (`type: "image"`)

**Propriedades obrigatórias:** `src`

**Exemplo — imagem de URL pública:**
```json
{
  "cmd": "adicionar_elemento",
  "tipo": "image",
  "props": {
    "src": "https://exemplo.com/imagem.jpg",
    "alt": "Descrição da imagem",
    "ajuste": "cover",
    "posicao": "col_direita"
  }
}
```

**Valores de `ajuste`:** "cover" (corta para preencher), "contain" (mantém proporção), "fill" (estica)

**Armadilhas:**
- Imagens externas dependem de CORS — em produção, prefira data URLs base64 ou URLs de CDN sem restrição
- O campo é `ajuste` (PT) ou `objectFit` (EN) — ambos funcionam

---

### 3.5 Linha (`type: "line"`)

**Propriedades:** `cor`, `espessura`, `estilo_linha`, `seta_inicio`, `seta_fim`

A linha usa `x`, `y`, `width`, `height` onde width é o comprimento e height é sempre 2 (ou igual à espessura).

**Exemplo — linha divisória horizontal:**
```json
{
  "cmd": "adicionar_elemento",
  "tipo": "line",
  "props": {
    "cor": "#e2e8f0",
    "espessura": 1,
    "estilo_linha": "solid",
    "x": 80, "y": 114, "width": 800, "height": 1
  }
}
```

---

## Seção 4 — Sistema de Temas

### 4.1 Estrutura de um Tema

Um tema define 8 tokens de cor e 2 fontes:

```
primary      → botões, barras de acento, destaques principais
secondary    → elementos secundários, ícones de suporte
accent       → destaque alternativo (diferente do primary)
background   → fundo padrão dos slides
surface      → fundo de cards e painéis dentro do slide
text         → texto principal
textSecondary → texto de suporte, labels
border       → bordas de elementos
```

### 4.2 Temas Disponíveis

| ID       | Tom Geral                          | Recomendado Para                           |
|----------|------------------------------------|--------------------------------------------|
| slate    | Azul corporativo sobre branco      | Relatórios, pitchs, apresentações formais  |
| midnight | Roxo/índigo sobre fundo escuro     | Tech, startups, produtos digitais          |
| forest   | Verde-esmeralda sobre branco       | Sustentabilidade, saúde, educação          |
| rose     | Vermelho/rosa sobre branco         | Lançamentos, marketing, criatividade       |
| ocean    | Azul-céu sobre branco              | SaaS, finanças, viagem, bem-estar          |
| mono     | Preto sobre off-white              | Editorial, portfólio, design               |

### 4.3 Cores por Tema

| Token           | slate   | midnight | forest  | rose    | ocean   | mono    |
|-----------------|---------|----------|---------|---------|---------|---------|
| primary         | #3b82f6 | #818cf8  | #10b981 | #f43f5e | #0ea5e9 | #171717 |
| secondary       | #64748b | #94a3b8  | #6b7280 | #6b7280 | #64748b | #525252 |
| accent          | #f59e0b | #f472b6  | #f59e0b | #8b5cf6 | #06b6d4 | #737373 |
| background      | #ffffff | #0f172a  | #ffffff | #ffffff | #ffffff | #fafafa |
| surface         | #f8fafc | #1e293b  | #f0fdf4 | #fff1f2 | #f0f9ff | #f5f5f5 |
| text            | #0f172a | #f1f5f9  | #064e3b | #0f172a | #0c4a6e | #171717 |
| textSecondary   | #475569 | #94a3b8  | #374151 | #4b5563 | #334155 | #525252 |
| border          | #e2e8f0 | #334155  | #d1fae5 | #fecdd3 | #bae6fd | #e5e5e5 |

### 4.4 Referenciar Cores do Tema

Os layouts pré-definidos extraem cores diretamente do tema. Ao adicionar elementos manuais, use as cores do tema ao invés de hardcodar hex:

```json
// Ao invés de:
{ "preenchimento": "#3b82f6" }  // hardcoded para slate

// Prefira (consultando GET /api/vizu-ai/temas primeiro):
{ "preenchimento": "#818cf8" }  // se o tema é midnight

// Ou use o campo cores do tema retornado pela API
```

### 4.5 Customizar Tema

No comando `definir_tema`, sobrescreva tokens específicos:

```json
{
  "cmd": "definir_tema",
  "tema": "slate",
  "cores": {
    "primary": "#6366f1",
    "accent": "#f59e0b"
  }
}
```

---

## Seção 5 — Catálogo de Layouts

### 5.1 blank — Em Branco

Canvas vazio. Use para slides totalmente customizados.

```json
{ "cmd": "adicionar_slide", "layout": "blank" }
```

### 5.2 cover — Capa

**Elementos gerados automaticamente:**

| Papel              | Tipo  | Posição                          | Notas                              |
|--------------------|-------|----------------------------------|------------------------------------|
| forma_acento       | shape | x=0, y=532, w=960, h=8          | Barra na base, cor primary         |
| titulo             | text  | x=80, y=160, w=800, h=120       | fontSize=52, bold                  |
| subtitulo          | text  | x=80, y=295, w=660, h=60        | fontSize=22, textSecondary (se fornecido) |
| meta               | text  | x=80, y=420, w=400, h=40        | "Autor · Data", uppercase, fontSize=14 (se fornecido) |
| forma_decorativa   | shape | x=680, y=80, w=240, h=360       | Retângulo arredondado, primary 8%  |

**Dados:**
```json
{
  "cmd": "adicionar_slide",
  "layout": "cover",
  "dados": {
    "titulo": "Estratégia Q3 2026",
    "subtitulo": "Revisão de Resultados e Próximos Passos",
    "autor": "Caique Zeviani",
    "data": "Junho 2026"
  }
}
```

### 5.3 section — Seção

**Elementos:** fundo full-slide (primary), título centralizado (branco), subtítulo opcional.

```json
{
  "cmd": "adicionar_slide",
  "layout": "section",
  "dados": { "titulo": "Resultados Financeiros", "subtitulo": "Jan–Jun 2026" }
}
```

### 5.4 content — Conteúdo

**Elementos:** barra vertical 4px (primary), título, linha divisória, bullets ou conteúdo livre.

```json
{
  "cmd": "adicionar_slide",
  "layout": "content",
  "dados": {
    "titulo": "Principais Métricas",
    "bullets": ["Receita: R$ 2.4M (+40% YoY)", "NPS: 84 pontos", "Churn: 1.2%"]
  }
}
```

**Nota:** bullets é um array de strings. Cada item vira `• item` automaticamente.

### 5.5 comparison — Comparação

**Elementos:** dois painéis lado a lado com headers coloridos (primary/accent).

```json
{
  "cmd": "adicionar_slide",
  "layout": "comparison",
  "dados": {
    "titulo": "Abordagem Atual vs. Proposta",
    "titulo_esq": "Situação Atual",
    "conteudo_esq": "Processo manual\nRetrabalho frequente\nCusto alto",
    "titulo_dir": "Nova Proposta",
    "conteudo_dir": "Automação via API\nZero retrabalho\nROI em 3 meses"
  }
}
```

**Nota:** use `\n` para quebras de linha no conteúdo dos painéis.

### 5.6 quote — Citação

**Elementos:** fundo surface, barra lateral primary, citação itálica centralizada, atribuição.

```json
{
  "cmd": "adicionar_slide",
  "layout": "quote",
  "dados": {
    "citacao": "A excelência não é um destino, é uma jornada contínua.",
    "atribuicao": "Aristóteles"
  }
}
```

**Nota:** não adicione aspas — o layout adiciona automaticamente.

### 5.7 closing — Encerramento

**Elementos:** fundo escuro (text color), linha de acento no topo, título grande centralizado.

```json
{
  "cmd": "adicionar_slide",
  "layout": "closing",
  "dados": {
    "titulo": "Obrigado",
    "subtitulo": "caique@empresa.com · linkedin.com/in/caique"
  }
}
```

---

## Seção 6 — Referência de Comandos

### 6.1 `criar_apresentacao`

Inicializa apresentação. Deve ser o primeiro comando quando não há `apresentacao` inicial no body.

```json
{
  "cmd": "criar_apresentacao",
  "nome": "Revisão Q3 2026",
  "tema": "midnight",
  "autor": "Caique Zeviani",
  "descricao": "Resultados e estratégia Q3",
  "tags": ["resultados", "estrategia"]
}
```

**Efeito:** cria `Presentation` com ID novo, slides[], tema selecionado.

---

### 6.2 `definir_titulo`

```json
{ "cmd": "definir_titulo", "titulo": "Novo Título" }
```

---

### 6.3 `definir_tema`

```json
{ "cmd": "definir_tema", "tema": "forest" }
{ "cmd": "definir_tema", "tema": "slate", "cores": { "primary": "#6366f1" } }
{ "cmd": "definir_tema", "tema": "midnight", "fontes": { "heading": "Georgia", "body": "Inter" } }
```

**Atenção:** `definir_tema` **não propaga** para elementos já criados. Use-o antes de adicionar slides.

---

### 6.4 `adicionar_slide`

```json
{
  "cmd": "adicionar_slide",
  "layout": "content",
  "dados": { "titulo": "Slide Título", "bullets": ["Ponto 1", "Ponto 2"] },
  "posicao": 2
}
```

**`posicao`:** 0 = primeiro. Omitir = final da lista (padrão).

**`background` opcional:** sobrescreve o fundo padrão do layout:
```json
{
  "cmd": "adicionar_slide",
  "layout": "blank",
  "background": { "type": "gradient", "gradient": { "from": "#3b82f6", "to": "#1e293b", "direction": 135 } }
}
```

---

### 6.5 `remover_slide`

```json
{ "cmd": "remover_slide", "slide_indice": 2 }
{ "cmd": "remover_slide", "slide_id": "uuid-do-slide" }
```

Omitir ambos = remove o último slide.

---

### 6.6 `duplicar_slide`

```json
{ "cmd": "duplicar_slide", "slide_indice": 0 }
```

O clone é inserido imediatamente após o original. Novos UUIDs são gerados para slide e elementos.

---

### 6.7 `mover_slide`

```json
{ "cmd": "mover_slide", "slide_indice": 3, "para_posicao": 1 }
```

---

### 6.8 `reordenar_slides`

```json
{ "cmd": "reordenar_slides", "ordem": ["id-slide-3", "id-slide-1", "id-slide-2"] }
```

**Atenção:** slides não incluídos no array são descartados. Use todos os IDs.

---

### 6.9 `editar_slide`

```json
{ "cmd": "editar_slide", "slide_indice": 1, "background": { "type": "color", "color": "#1e293b" } }
{ "cmd": "editar_slide", "slide_indice": 2, "notas": "Mencionar dados do relatório aqui." }
```

---

### 6.10 `adicionar_elemento`

```json
{
  "cmd": "adicionar_elemento",
  "slide_indice": 1,
  "tipo": "icon",
  "props": {
    "nome_icone": "TrendingUp",
    "cor": "#10b981",
    "posicao": "topo_direita",
    "width": 64,
    "height": 64
  }
}
```

**`slide_indice` padrão:** último slide (se omitido).

---

### 6.11 `editar_elemento`

Faz **deep merge** — só os campos fornecidos são alterados:

```json
{ "cmd": "editar_elemento", "slide_indice": 0, "elemento_indice": 1, "props": { "content": "Novo Título" } }
{ "cmd": "editar_elemento", "slide_indice": 1, "elemento_id": "uuid", "props": { "style": { "fontSize": 60 } } }
```

---

### 6.12 `remover_elemento`

```json
{ "cmd": "remover_elemento", "slide_indice": 2, "elemento_indice": 0 }
```

---

## Seção 7 — Catálogo de Ícones

### 7.1 Lista Completa (48 ícones)

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

### 7.2 50 Ícones Mais Úteis para Apresentações

| ID            | Uso Principal                           |
|---------------|-----------------------------------------|
| TrendingUp    | Crescimento, melhoria, tendência alta   |
| TrendingDown  | Queda, redução, oportunidade            |
| BarChart      | Métricas, comparação, relatório         |
| PieChart      | Distribuição, quota de mercado          |
| Activity      | Performance, monitoramento, pulso       |
| DollarSign    | Receita, custo, financeiro              |
| Target        | Meta, OKR, objetivo                     |
| Rocket        | Lançamento, growth, início              |
| Users         | Equipe, comunidade, base de clientes    |
| Building      | Empresa, corporativo, escritório        |
| Globe         | Global, alcance, expansão internacional |
| Shield        | Segurança, confiança, proteção          |
| Check         | Confirmação, meta atingida              |
| AlertCircle   | Risco, atenção, alerta                  |
| Zap           | Velocidade, energia, performance        |
| Calendar      | Prazo, cronograma, data                 |
| Award         | Reconhecimento, prêmio, conquista       |
| Lightbulb     | Inovação, ideia, insight                |
| Star          | Destaque, avaliação, favorito           |
| Briefcase     | Trabalho, negócio, serviço              |
| Percent       | Taxa, crescimento, desconto             |
| Key           | Acesso, solução, autenticação           |
| ArrowRight    | Próximo passo, fluxo, avanço            |
| Layers        | Stack, arquitetura, camadas             |
| Flag          | Marco, conquista, milestone             |

### 7.3 Propriedades Configuráveis

- `cor`: cor do ícone em hex (qualquer cor)
- `width`/`height`: tamanho em pixels (quadrado recomendado)
- `opacity`: transparência (0–1)
- `background`: fundo atrás do ícone (hex ou "transparent")
- `borda`: bordas em torno do ícone

---

## Seção 8 — Tipografia

### 8.1 Fontes Disponíveis

| ID        | Categoria  | Pesos       | Usar Quando                         |
|-----------|------------|-------------|-------------------------------------|
| Inter     | sans-serif | 300–800     | Padrão — legível em qualquer tamanho |
| Georgia   | serif      | 400, 700    | Títulos editoriais, citações        |
| monospace | monospace  | 400, 700    | Dados técnicos, código              |

### 8.2 Escala Tipográfica Recomendada

| Contexto               | fontFamily | fontWeight | fontSize | letterSpacing | lineHeight |
|------------------------|------------|------------|----------|---------------|------------|
| Título de capa         | Inter      | 700        | 52       | -0.5          | 1.1        |
| Título de seção        | Inter      | 700        | 44       | -0.3          | 1.1        |
| Título de slide        | Inter      | 700        | 30       | -0.2          | 1.2        |
| Subtítulo              | Inter      | 400        | 22       | 0             | 1.4        |
| Corpo / bullets        | Inter      | 400        | 20       | 0             | 1.8        |
| Dado numérico grande   | Inter      | 800        | 64       | -1            | 1.0        |
| Legenda / meta         | Inter      | 400        | 14       | 0.5           | 1.4        |
| Citação                | Inter      | 300        | 28       | 0             | 1.6        |

### 8.3 Combinações de Fontes

| heading  | body   | Tom                                          |
|----------|--------|----------------------------------------------|
| Inter    | Inter  | Padrão — consistência máxima, moderno         |
| Georgia  | Inter  | Editorial — título com personalidade, corpo limpo |

---

## Seção 9 — Exemplo Canônico Completo

### Briefing

"Relatório de Resultados Q3 2026" — apresentação com 8 slides para equipe executiva. Tema escuro (midnight). Conteúdo: capa, agenda, 3 slides de métricas, comparação, citação de cliente, encerramento.

### Chamadas de API

**Passo 1: Consultar temas (antes de criar)**
```bash
curl -s https://vizu-czeviani.vercel.app/api/vizu-ai/temas | jq '.temas[] | {id, preview_textual}'
```

**Passo 2: Criar a apresentação em uma chamada**
```bash
RESULT=$(curl -s -X POST https://vizu-czeviani.vercel.app/api/vizu-ai/execute \
  -H "Content-Type: application/json" \
  -d '{
  "comandos": [

    // Slide 1: Capa
    {
      "cmd": "criar_apresentacao",
      "nome": "Relatório de Resultados Q3 2026",
      "tema": "midnight",
      "autor": "Caique Zeviani"
    },
    {
      "cmd": "adicionar_slide",
      "layout": "cover",
      "dados": {
        "titulo": "Resultados Q3 2026",
        "subtitulo": "Revisão de Performance e Estratégia",
        "autor": "Caique Zeviani",
        "data": "Setembro 2026"
      }
    },

    // Slide 2: Agenda
    {
      "cmd": "adicionar_slide",
      "layout": "content",
      "dados": {
        "titulo": "Agenda",
        "bullets": [
          "01 — Visão Geral dos Resultados",
          "02 — Métricas de Receita",
          "03 — NPS e Satisfação",
          "04 — Comparativo vs. Q2",
          "05 — Próximos Passos"
        ]
      }
    },

    // Slide 3: Seção — Resultados
    {
      "cmd": "adicionar_slide",
      "layout": "section",
      "dados": { "titulo": "Visão Geral", "subtitulo": "Julho – Setembro 2026" }
    },

    // Slide 4: Métrica de Receita (layout content + ícone customizado)
    {
      "cmd": "adicionar_slide",
      "layout": "content",
      "dados": {
        "titulo": "Receita Trimestral",
        "bullets": [
          "Receita Total: R$ 2.4M",
          "Crescimento vs. Q2: +40%",
          "Meta atingida: 118% do target",
          "MRR: R$ 800K"
        ]
      }
    },
    {
      "cmd": "adicionar_elemento",
      "slide_indice": 3,
      "tipo": "icon",
      "props": {
        "nome_icone": "TrendingUp",
        "cor": "#818cf8",
        "posicao": "topo_direita",
        "width": 56,
        "height": 56
      }
    },
    {
      "cmd": "adicionar_elemento",
      "slide_indice": 3,
      "tipo": "text",
      "props": {
        "conteudo": "+40%",
        "x": 700, "y": 200, "width": 220, "height": 120,
        "estilo": {
          "fontSize": 80,
          "fontWeight": 800,
          "color": "#818cf8",
          "textAlign": "center"
        }
      }
    },

    // Slide 5: NPS
    {
      "cmd": "adicionar_slide",
      "layout": "content",
      "dados": {
        "titulo": "NPS e Satisfação do Cliente",
        "bullets": [
          "NPS: 84 pontos (+12 vs. Q2)",
          "CSAT: 4.7/5.0",
          "Churn: 1.2% (melhor histórico)",
          "Tickets abertos: -18%"
        ]
      }
    },
    {
      "cmd": "adicionar_elemento",
      "slide_indice": 4,
      "tipo": "icon",
      "props": { "nome_icone": "Heart", "cor": "#f472b6", "posicao": "topo_direita", "width": 56, "height": 56 }
    },

    // Slide 6: Comparação Q2 vs Q3
    {
      "cmd": "adicionar_slide",
      "layout": "comparison",
      "dados": {
        "titulo": "Q2 vs. Q3 — Comparativo",
        "titulo_esq": "Q2 2026",
        "conteudo_esq": "Receita: R$ 1.7M\nNPS: 72\nChurn: 2.1%\nMeta: 95%",
        "titulo_dir": "Q3 2026",
        "conteudo_dir": "Receita: R$ 2.4M\nNPS: 84\nChurn: 1.2%\nMeta: 118%"
      }
    },

    // Slide 7: Citação de cliente
    {
      "cmd": "adicionar_slide",
      "layout": "quote",
      "dados": {
        "citacao": "O produto transformou a forma como gerenciamos nossos dados. Resultados visíveis em 30 dias.",
        "atribuicao": "— Fernanda Lima, CTO da Acme Corp"
      }
    },

    // Slide 8: Encerramento
    {
      "cmd": "adicionar_slide",
      "layout": "closing",
      "dados": {
        "titulo": "Obrigado",
        "subtitulo": "caique@empresa.com · Próxima revisão: Dezembro 2026"
      }
    }

  ]
}')

# Salvar resultado
echo $RESULT | python3 -m json.tool > /tmp/q3-report.json

# Verificar erros
echo $RESULT | python3 -c "import sys,json; r=json.load(sys.stdin); print('ERROS:', r.get('erros', []))"
```

**Passo 3: Verificar resposta**

Resposta esperada:
```json
{
  "apresentacao": { "id": "uuid-...", "title": "Relatório de Resultados Q3 2026", ... },
  "log": ["[0] criar_apresentacao: ...", "[1] adicionar_slide: ...", ...],
  "erros": [],
  "total_slides": 8
}
```

**Passo 4: Carregar no browser**
```javascript
// No console do browser (em vizu-czeviani.vercel.app)
const p = /* cole o valor de result.apresentacao */;
const all = JSON.parse(localStorage.getItem('vizu_presentations') || '{}');
all[p.id] = p;
localStorage.setItem('vizu_presentations', JSON.stringify(all));
window.location.href = '/editor/' + p.id;
```

### Por que cada decisão

- **Tema midnight:** pedido explícito no briefing; fundo escuro comunica seriedade e modernidade para executivos
- **Slide de seção antes das métricas:** quebra de ritmo visual, sinaliza nova seção
- **Ícone TrendingUp no slide de receita:** reforça visualmente o crescimento antes do usuário ler o texto
- **Número +40% grande:** dado mais importante do slide merece destaque visual máximo (fontSize 80)
- **Comparação Q2 vs Q3:** layout nativo poupa trabalho; os dois painéis já têm cores distintas (primary/accent)
- **Citação antes do fechamento:** quebra de ritmo emocional; depoimento de cliente gera credibilidade
- **Closing simples:** slide de encerramento precisa de apenas título + contato — qualquer elemento a mais distrai

---

## Seção 10 — Padrões de Qualidade

### 10.1 Hierarquia Visual

- Máximo **3 tamanhos de fonte** por slide
- Máximo **2 pesos de fonte** por slide (regular + bold)
- Hierarquia: título > subtítulo > corpo > legenda
- Nunca use `fontSize` menor que 14 em slides — ilegível em projeção

### 10.2 Limite de Conteúdo

| Elemento        | Máximo por Slide             |
|-----------------|------------------------------|
| Bullets         | 5 itens                      |
| Caracteres/linha| ~60 caracteres               |
| Texto de corpo  | 3 parágrafos curtos          |
| Ícones          | 1 ícone decorativo ou 4 em grid |
| Tipos de cor    | 3 cores do tema              |

### 10.3 Espaço Negativo

- Em slides de destaque (seção, closing), **menos é mais** — um elemento grande > muitos pequenos
- Margem interna dos cards: mínimo 16px de padding
- Elementos não devem encostar na borda do slide: mínimo 40px de margem

### 10.4 Paleta por Slide

- Máximo **3 cores do tema** por slide
- Fundo: background ou surface
- Elemento principal: primary
- Destaque secundário: accent
- Texto: text e textSecondary

### 10.5 Consistência

- Mesma família de fonte em toda a apresentação
- Mesmo padding em elementos similares entre slides
- Alinhamento igual para elementos similares (ex.: todos os títulos à esquerda)
- Slides de seção consistentes: todos usam o mesmo layout (section)

### 10.6 Checklist Pré-finalização

Antes de enviar os comandos:

- [ ] `criar_apresentacao` é o primeiro comando?
- [ ] O tema foi definido antes de adicionar slides?
- [ ] Cada slide tem no máximo 5 bullets?
- [ ] Todos os ícones usam IDs válidos (case-sensitive)?
- [ ] Coordenadas manuais estão dentro de (0–960, 0–540)?
- [ ] Texto de slides escuros usa cor clara (#f1f5f9 ou #ffffff)?
- [ ] O array `erros` na resposta está vazio?
- [ ] Total de slides confere com o esperado?

---

## Seção 11 — Troubleshooting

### 11.1 Erros Comuns da API

| Erro                                          | Causa                               | Solução                                   |
|-----------------------------------------------|-------------------------------------|-------------------------------------------|
| `"O campo 'comandos' é obrigatório"`          | Body sem campo `comandos`           | Adicionar `"comandos": [...]` no body     |
| `"Tipo de elemento inválido: 'X'"`            | Tipo de elemento errado             | Usar: text, shape, icon, image, line      |
| `"slide não encontrado"`                      | slide_id inválido ou slide_indice > total | Verificar IDs ou usar slide_indice menor |
| `"elemento não encontrado"`                   | elemento_id errado ou índice alto   | Consultar apresentação retornada          |
| HTTP 422                                      | Erros críticos + 0 slides           | Verificar campo `erros` na resposta       |
| HTTP 207                                      | Execução parcial (alguns erros)     | Verificar campo `erros` e `log`           |

### 11.2 Verificar Apresentação Antes de Encerrar

```bash
# Verificar estrutura básica
echo $RESULT | python3 -c "
import sys, json
r = json.load(sys.stdin)
p = r['apresentacao']
print(f'ID: {p[\"id\"]}')
print(f'Título: {p[\"title\"]}')
print(f'Slides: {len(p[\"slides\"])}')
print(f'Tema: {p[\"theme\"][\"id\"]}')
print(f'Erros: {r[\"erros\"]}')
for i, s in enumerate(p['slides']):
    print(f'  Slide {i}: layout={s[\"layout\"]}, elementos={len(s[\"elements\"])}')
"
```

### 11.3 Corrigir Elemento Sem Recriar

Use `editar_elemento` com o índice do elemento no slide:

```bash
# Corrigir apenas o texto do primeiro elemento do slide 2
curl -s -X POST https://vizu-czeviani.vercel.app/api/vizu-ai/execute \
  -H "Content-Type: application/json" \
  -d "{
    \"apresentacao\": $(cat /tmp/deck.json | python3 -c \"import sys,json; print(json.dumps(json.load(sys.stdin)['apresentacao']))\"),
    \"comandos\": [
      { \"cmd\": \"editar_elemento\", \"slide_indice\": 2, \"elemento_indice\": 1, \"props\": { \"content\": \"Texto Corrigido\" } }
    ]
  }"
```

### 11.4 Ícone Não Aparece no PPTX

Ícones são convertidos SVG→PNG via canvas offscreen. Em ambiente server-side (Vercel), o canvas está disponível. Se o ícone aparecer em branco:
- Verifique se `iconName` é exato (case-sensitive)
- Confirme na lista: GET /api/vizu-ai/icones

### 11.5 Gradiente de Background no PPTX

Limitação conhecida: gradientes exportam como cor sólida (cor `from`). Para slides importantes, prefira cor sólida no background se o PPTX é o entregável final.

### 11.6 Tabela Não Exporta para PPTX

Limitação atual: TableElement não tem mapeamento no PptxGenJS. Use texto com formatação manual para dados tabulares em apresentações que serão exportadas.

---

## Apêndice — Alternativa: POST /api/vizu-ai/create

Para apresentações simples sem elementos customizados, use a criação em uma chamada:

```json
{
  "title": "Minha Apresentação",
  "theme": { "id": "slate" },
  "slides": [
    { "layout": "cover", "data": { "title": "Título", "subtitle": "Subtítulo", "author": "Autor" } },
    { "layout": "content", "data": { "title": "Conteúdo", "bullets": ["Ponto 1", "Ponto 2"] } },
    { "layout": "closing", "data": { "title": "Obrigado" } }
  ]
}
```

**Diferença vs. /execute:**
- `/create`: uma chamada, sem elementos customizados, campos em inglês
- `/execute`: múltiplos comandos, suporte a `adicionar_elemento` após cada slide, campos em português

Use `/create` para protótipos rápidos. Use `/execute` para apresentações finais com qualidade visual.
