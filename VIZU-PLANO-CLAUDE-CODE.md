# VIZU — Diagnóstico Completo + Plano de Reestruturação (para Claude Code)

> **Como usar:** cole este documento inteiro no Claude Code, na raiz do repositório da Vizu.
> Ele contém: (1) diagnóstico real feito com testes no navegador em produção
> (https://vizu-czeviani.vercel.app), (2) plano faseado de correção e evolução,
> (3) especificação de integração Vizu ↔ PowerPoint, (4) tema padrão Gerdau,
> (5) arquitetura de agents sugerida e (6) checklist final de aceite.

---

## 0. Contexto do produto (não alterar estes princípios)

A Vizu é um editor de apresentações web cujo fluxo principal é:

1. O usuário fornece **dados iniciais** (texto, tópicos, números).
2. A Vizu **gera os slides** com estrutura, categorização e visual prontos.
3. O usuário **exporta para .pptx** e repassa aos colaboradores.
4. Os colaboradores **editam livremente no PowerPoint**: mover elementos, trocar textos, adicionar visuais.

**Princípio inegociável:** fidelidade quase 1:1 entre o canvas da Vizu e o PPTX exportado.
Todo elemento deve virar um objeto NATIVO e EDITÁVEL do PowerPoint (caixa de texto, shape,
imagem) — nunca um screenshot/imagem achatada do slide.

### Arquitetura atual (verificada em produção)
- Next.js (App Router, Turbopack) hospedado na Vercel, 100% client-side.
- Persistência: `localStorage` (`vizu_presentations`, `vizu-theme`, `vizu-export-history`). Sem backend, sem auth.
- Export: `pptxgenjs` (PPTX) + `jspdf` + `html2canvas` (PDF/PNG), tudo no cliente.
- Canvas lógico do slide: **960 × 540 px** (16:9).
- Modelo de dados (localStorage) por apresentação: `{id, theme, title, slides[], metadata}`;
  slide: `{id, layout, elements[], background}`; elemento com `x, y, width, height, rotation,
  opacity, zIndex, locked, visible, border, shadow` e específicos por tipo
  (`text`: content + style{fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, textAlign,
  color, textTransform, textDecoration}, padding, background; `shape`: shape + fill; `image`; `icon`).

---

## 1. Diagnóstico — bugs confirmados em produção (prioridade de correção)

### P0 — bloqueiam o uso
1. **Modo "Visualizar" não tem saída.** `Escape` não fecha, não há botão X, clique não avança slide
   (somente setas do teclado funcionam). O usuário fica preso e precisa recarregar a página.
   Corrigir: fechar com Esc e botão X visível; avançar com clique/espaço; contador "3/11";
   controles flutuantes (anterior/próximo/sair/fullscreen).
2. **Menus "Exportações" e "Configurações" do sidebar são mortos.** Não navegam para lugar nenhum
   e as rotas nem existem (`/exports` e `/settings` retornam 404). Criar as duas páginas
   (Exportações: histórico global com re-download; Configurações: idioma, tema claro/escuro,
   preferências de export, gestão de dados locais) ou remover os itens até existirem.
3. **Undo/Redo quebrado.** Após editar texto e arrastar um elemento, dois undos não restauram nem o
   texto nem a posição original (restauração parcial/incorreta). Reimplementar histórico com
   snapshots imutáveis por transação (uma entrada por gesto completo: fim do drag, blur da edição
   de texto), com limite (~100) e redo consistente. Cobrir com testes.

### P1 — degradam muito a experiência
4. **Thumbnails em branco no dashboard e na galeria de templates.** Os cards mostram retângulo
   branco/azul sem conteúdo (os thumbs do painel lateral do editor funcionam — reaproveitar esse
   renderer, gerando preview SVG/canvas em miniatura do primeiro slide).
5. **Seleção não sincroniza ao inserir elementos.** Ao inserir forma/imagem/ícone, o painel
   "Elemento" continua mostrando o elemento anteriormente selecionado (chip "Texto"). O elemento
   recém-inserido deve ser auto-selecionado e o painel refletir seus dados.
6. **Toolbar contextual mostra valores errados.** Com um texto de 52px Inter Bold selecionado, a
   toolbar superior mostra tamanho "10". Sincronizar a toolbar com o estado real do elemento
   (fonte, tamanho, B/I/U, alinhamento, cor).
7. **Conteúdo placeholder em inglês** em produto pt-BR: "Presentation Title", "Your subtitle here",
   "AUTHOR NAME", "Thank You". Internacionalizar (i18n) ou trocar para pt-BR.
8. **Imagens por URL não são embedadas.** A imagem fica referenciada pela URL externa (testei com
   picsum e a imagem muda a cada reload). Ao inserir por URL, baixar e converter para dataURL/base64
   (ou storage próprio) para o slide ser estável e o export PPTX conter a imagem de fato.

### P2 — bugs menores / a investigar no código
9. Retângulo inserido desapareceu do canvas após inserção de imagem subsequente (possível replace
   indevido da seleção ou z-index/render). Reproduzir e corrigir.
10. Posições com frações longas (`x: 108.57142857142857`) — arredondar para 1 casa decimal no
    modelo; evita drift visual e diffs gigantes no JSON.
11. Botão "?" (ajuda) e toggles de tema claro/escuro/sistema no header: verificar funcionamento
    real e dar conteúdo ao painel de ajuda (atalhos de teclado).
12. Auditar página inteira com axe-core (acessibilidade): foco, aria-labels, contraste.

---

## 2. Funcionalidades ausentes (gap para o fluxo-alvo)

### A. Geração assistida por dados/IA — **é o coração do produto e não existe hoje**
O modal "Nova Apresentação" só pede título e tema. Criar o fluxo:
- Passo 1: usuário cola dados iniciais (texto livre, tópicos, tabela, ou upload .md/.txt/.csv).
- Passo 2: escolhe tipo (relatório executivo, pitch, treinamento…), nº aproximado de slides e tema.
- Passo 3: motor gera o deck: título, agenda, seções categorizadas, bullets, slides de KPI/tabela,
  encerramento — usando os layouts existentes.
- Implementação sugerida: endpoint `/api/generate` (Next.js route handler) chamando a API da
  Anthropic (`claude-sonnet-5` para custo/latência; `claude-opus` se qualidade máxima), com
  **structured output**: o modelo devolve JSON exatamente no schema de `slides[]/elements[]` da Vizu
  (validar com Zod antes de aceitar). Sem API key configurada, oferecer fallback "gerar a partir de
  outline" puramente heurístico (parser de markdown → layouts).

### B. Editor — paridade mínima com expectativa de usuário de PowerPoint
- Multi-seleção (shift+clique e marquee/retângulo de seleção) + mover/excluir em grupo; agrupar/desagrupar.
- Guias inteligentes de alinhamento (snap a centro/bordas de outros elementos e do slide) + snap à grade.
- Ferramentas de alinhar/distribuir (esq/centro/dir, topo/meio/base, distribuir horizontal/vertical).
- Copiar/colar/duplicar com atalhos (Ctrl/Cmd+C/V/D), setas para nudge (1px, Shift=10px), Delete.
- Reordenar slides por drag-and-drop; duplicar slide; menu de contexto (botão direito) em elementos e thumbnails.
- Notas do apresentador por slide (exportadas como speaker notes no PPTX).
- Caixa de texto com listas (bullets/numeração) de verdade — hoje bullets são texto com "•", precisa
  ser lista estruturada para virar bullets nativos no PPTX.
- Tabelas simples e gráficos básicos (barra/linha/pizza) — ambos com equivalente nativo no PPTX
  (`addTable`, `addChart` do pptxgenjs).
- Zoom com Ctrl+scroll e pinch; fit-to-screen; pan com espaço.
- Biblioteca de fontes limitada e segura para PPT (ver §4).

### C. Plataforma
- Página **Exportações** (histórico global, re-exportar, apagar).
- Página **Configurações** (idioma, tema, qualidade de export, backup/restore do localStorage em JSON).
- Aviso claro de que os dados são locais ao navegador + botão exportar/importar backup. (Backend com
  auth pode ficar para fase futura; não é pré-requisito do fluxo-alvo.)
- Renomear apresentação inline no editor (verificar) e no card do dashboard.
- Onboarding curto (3 tooltips) na primeira visita.

---

## 3. Tema padrão "Gerdau" (novo tema predefinido + template)

Extraído da apresentação institucional Gerdau de referência (Claude Design) e da identidade Gerdau:

```ts
export const gerdauTheme = {
  id: 'gerdau',
  name: 'Gerdau',
  colors: {
    primary:   '#003DA5', // azul Gerdau
    deep:      '#001B45', // azul profundo (fundos de capa/divisórias)
    accent:    '#FFC72C', // amarelo Gerdau (destaques, filetes, números)
    ink:       '#0A1A33', // texto principal
    inkSoft:   '#4A5568', // texto secundário
    paper:     '#F7F6F2', // fundo claro "papel"
    white:     '#FFFFFF',
    line:      'rgba(10,26,51,0.14)', // linhas divisórias
  },
  typography: {
    heading: { fontFamily: 'Archivo', fontWeight: 700 },        // títulos
    condensed: { fontFamily: 'Archivo Narrow', fontWeight: 600 }, // kickers/labels/uppercase
    body:    { fontFamily: 'Archivo', fontWeight: 400 },
  },
  layoutTokens: { padX: 110, padTop: 96, padBottom: 80 }, // em px na base 960×540 → escalar ~×0.75
}
```

Diretrizes visuais do template Gerdau (criar como template completo em Templates, categoria
"Institucional", 8–10 slides):
- Capa: fundo `deep`, título grande em Archivo Bold branco, kicker uppercase em Archivo Narrow
  amarelo, filete amarelo de 4–8px.
- Slides de conteúdo: fundo `paper` ou branco, título `ink` com barra lateral `primary`,
  labels/eyebrows em Archivo Narrow uppercase `primary`.
- Slides divisores de seção: fundo `primary` ou `deep`, número da seção gigante em amarelo.
- KPIs: número grande Archivo Bold `primary`, descrição `inkSoft`, filete `accent`.
- Encerramento: fundo `deep`, logo/contato, filete amarelo.
- Carregar as fontes Archivo e Archivo Narrow via `next/font` (Google Fonts) e incluí-las no
  mapeamento de fontes do export (§4).

---

## 4. ESPECIFICAÇÃO Vizu ↔ PowerPoint (documentar em `docs/PPTX-SPEC.md` no repo)

Esta é a parte mais crítica. Criar o documento e fazer o código do exporter obedecê-lo. Regras:

### 4.1 Sistema de coordenadas
- Canvas Vizu: 960 × 540 px. Slide PPTX: definir `pptx.defineLayout({ name:'VIZU', width:10, height:5.625 })` (polegadas).
- Conversão universal: `inches = px / 96`. NUNCA usar outro fator em nenhum elemento.
- `x, y, w, h, rotation (rotate), opacity (transparency = (1-opacity)*100)` aplicados a todo elemento.
- Ordem de inserção no slide = zIndex crescente (pptxgenjs empilha na ordem de chamada).

### 4.2 Texto → caixa de texto nativa
- `addText` com: `fontFace` (ver mapa de fontes), `fontSize = px * 0.75` (px→pt), `bold`, `italic`,
  `underline`, `color`, `align`, `valign:'top'`, `lineSpacingMultiple = lineHeight`,
  `charSpacing ≈ letterSpacing * 0.75`, `inset` a partir do `padding` (px/96),
  `fill` quando o texto tiver background, `isTextBox: true`.
- `textTransform: uppercase` não existe no PPTX → aplicar transformação na string antes de exportar.
- Listas: quando o elemento for lista estruturada, exportar como array de runs com
  `{ text, options:{ bullet:true } }` — bullets nativos, nunca "•" literal.
- Quebra: `wrap: true`, shrink desligado — o que couber na Vizu deve caber no PPT (validar com teste §6).

### 4.3 Shapes → shapes nativos
Mapa: rectangle→`rect`, rounded→`roundRect` (radius→`rectRadius` em polegadas), circle→`ellipse`,
triangle→`triangle`, diamond→`diamond`, star→`star5`, arrow-right/left→`rightArrow`/`leftArrow`.
Aplicar `fill`, `line` (border color/width px→pt), `shadow` quando habilitado
(`{type:'outer', blur, offset, color, opacity}`), rotação e transparência.

### 4.4 Imagens
- Sempre embedar: converter para base64 no momento da inserção (nunca URL externa no export).
- `addImage({ data, x, y, w, h, rotate, transparency, rounding })`; manter proporção original registrada.

### 4.5 Ícones
- Ícones (Lucide/SVG) não têm equivalente nativo → rasterizar em PNG @3x com a cor aplicada e
  exportar como imagem no tamanho exato. Documentar que ícone não é editável como vetor no PPT
  (limitação aceita) — mas manter posição/tamanho fiéis.

### 4.6 Fundo do slide e tema
- `slide.background = { color }` ou `{ data }` para imagem; gradiente: gerar PNG do gradiente
  (pptxgenjs não suporta gradiente de fundo diretamente) OU restringir UI a cor sólida + imagem.
- Exportar `notes` do slide via `slide.addNotes()`.
- Metadados: `pptx.author = 'Vizu'`, `title` da apresentação, `subject`.

### 4.7 Mapa de fontes (obrigatório)
| Vizu | PPTX fontFace | Fallback Windows |
|---|---|---|
| Inter | Inter | Calibri |
| Archivo | Archivo | Arial |
| Archivo Narrow | Archivo Narrow | Arial Narrow |
Restringir o seletor de fontes da UI a fontes deste mapa (adicionar apenas fontes com presença
comum no Windows/Office ou com fallback visualmente próximo). Documentar no PPTX-SPEC que fontes
não instaladas na máquina do colaborador caem no fallback do Office.

### 4.8 Regra de ouro
**Se um recurso visual da UI não tiver representação editável no PPTX, ele não entra na UI** (ou
entra marcado como "rasterizado no export"). Toda feature nova do editor exige, no mesmo PR, o
mapeamento correspondente no exporter + teste de fidelidade (§6).

---

## 5. Plano de execução faseado

### Fase 1 — Correções críticas (P0/P1)
1. Preview: sair com Esc/X, navegação por clique/teclado, contador, controles.
2. Rotas/páginas Exportações e Configurações (ou ocultar itens até prontas — preferir criar).
3. Reescrever undo/redo (histórico transacional + testes unitários).
4. Corrigir sincronização de seleção e toolbar contextual.
5. Thumbnails reais no dashboard e templates.
6. Embed de imagens em base64 na inserção.
7. i18n pt-BR completo (placeholders, template inicial, mensagens).

### Fase 2 — Fidelidade PPTX 1:1
1. Escrever `docs/PPTX-SPEC.md` (conteúdo do §4) e refatorar o exporter para cumpri-lo.
2. Implementar harness de testes de fidelidade (§6).
3. Bullets estruturados, notas do apresentador, metadados.
4. Corrigir mapeamento de fontes e restringir seletor.
5. Validar export PDF/PNG (html2canvas) com os mesmos casos.

### Fase 3 — Editor nível PowerPoint
1. Multi-seleção, grupo, alinhar/distribuir, guias inteligentes + snap.
2. Atalhos completos + painel de ajuda com atalhos.
3. Drag-and-drop de slides, duplicar slide, menu de contexto.
4. Tabelas e gráficos simples (com export nativo `addTable`/`addChart`).
5. Zoom/pan aprimorados.

### Fase 4 — Geração por dados/IA (fluxo-alvo)

**Arquitetura obrigatória: a IA NUNCA gera coordenadas x/y.** LLMs produzem ótimo conteúdo e
péssima geometria. Separar em duas camadas:

*Camada 1 — IA (conteúdo e estrutura).* Claude recebe os dados iniciais e devolve um
**SlideSpec semântico** (JSON validado por Zod), sem nenhuma posição:

```ts
type SlideSpec =
  | { layout:'cover';    kicker?:string; title:string; subtitle?:string; author?:string }
  | { layout:'agenda';   title:string; items:string[] }
  | { layout:'section';  number:number; title:string }
  | { layout:'bullets';  title:string; bullets:{text:string; icon?:IconName}[] } // máx 5, ~90 chars
  | { layout:'kpis';     title:string; kpis:{value:string; label:string; icon?:IconName}[] } // 2–4
  | { layout:'compare';  title:string; left:Col; right:Col }
  | { layout:'table';    title:string; headers:string[]; rows:string[][] } // máx 5×6
  | { layout:'quote';    text:string; source?:string }
  | { layout:'closing';  title:string; contact?:string }
// IconName: enum fechado com os ícones existentes na Vizu — a IA escolhe da lista, nunca inventa.
```

*Camada 2 — Motor de layout determinístico (código, sem IA).* Para cada layout, uma função
`compose(spec, theme) => elements[]` calcula posições/tamanhos no canvas 960×540 usando os tokens
do tema (padX/padTop, escala tipográfica, cores). É código puro: sempre alinhado, sempre dentro do
slide, testável com snapshot tests. Os mesmos composers são usados pelos templates da galeria —
uma única fonte de verdade visual.

*Guard-rails que garantem qualidade:*
- Limites rígidos no schema (nº de bullets, tamanho de string) + `.max()` no Zod; se estourar,
  o composer quebra em 2 slides automaticamente.
- Medição real de texto (canvas `measureText`) no composer para decidir fontSize/quebras — nunca
  confiar em estimativa da IA.
- Ícones: a IA só escolhe de um enum dos ícones já existentes; fallback para ícone neutro.
- Retry com feedback: se o JSON falhar na validação, reenviar o erro ao modelo (máx 2 retries).
- Avaliação: 10 conjuntos de dados de teste → gerar deck → checklist automatizado (nada fora do
  canvas, nada sobreposto, contraste ok) + revisão visual.

Entregas:
1. Wizard "Nova Apresentação" em 3 passos (dados → estrutura revisável em outline → tema).
2. Route handler `/api/generate` + Claude com structured output no schema SlideSpec (Zod).
3. Motor de composição com os ~9 layouts acima (usado também pelos templates).
4. Botão "Regenerar slide" e "Melhorar texto" por slide (regenera o spec, recompõe o layout).
5. O usuário edita livremente depois: os elementos gerados são elementos normais do editor.

### Fase 5 — Tema e template Gerdau + polish
1. Tema `gerdau` nos TEMAS PREDEFINIDOS (tokens do §3) + fontes Archivo via next/font.
2. Template completo "Institucional Gerdau" (8–10 slides) na galeria.
3. Onboarding, backup/restore de dados, acessibilidade (axe), performance (Lighthouse ≥ 90).

Regras gerais: uma fase por PR/branch; não iniciar fase seguinte com falhas de aceite na anterior;
rodar `npm run lint && npm run build` + suíte de testes a cada fase.

---

## 6. Harness de testes de fidelidade PPTX (criar em `tests/pptx-fidelity/`)

1. Fixtures: 6 apresentações-teste cobrindo todos os tipos de elemento, rotações, opacidades,
   z-order, listas, notas, fundos e o template Gerdau.
2. Pipeline automatizado: gerar .pptx → abrir com JSZip + parser XML (ou `python-pptx` em script de
   CI) → verificar por elemento: tipo de shape correto, posição/tamanho em EMU com tolerância de
   ±0,02", fonte/tamanho/cor/negrito, texto idêntico, ordem de empilhamento, imagem embedada
   (bytes presentes no pacote), notas presentes.
3. Teste visual: renderizar slide da Vizu em PNG (html2canvas) vs slide do PPTX renderizado
   (LibreOffice headless `soffice --convert-to png` em CI) → comparação por SSIM ≥ 0,95.
4. Falhou fidelidade → PR não mergeia.

---

## 7. Organização do trabalho no Claude Code (agents/squads sugeridos)

Usar subagents para paralelizar com um supervisor (a sessão principal) que só integra e revisa:

- **Agent A — "editor-core"**: Fases 1 e 3 (bugs de editor, undo, seleção, multi-seleção, guias).
- **Agent B — "export-fidelity"**: Fase 2 + §6 (exporter, PPTX-SPEC, harness de testes). É o agent
  mais importante; dar a ele o §4 completo como contexto.
- **Agent C — "platform-ux"**: rotas Exportações/Configurações, thumbnails, i18n, onboarding, a11y.
- **Agent D — "ai-generation"**: Fase 4 (wizard + /api/generate + SlideSpec + motor de composição).
  Regra do agent: IA gera specs semânticos; posições vêm só dos composers determinísticos.
- **Agent E — "theme-gerdau"**: Fase 5 (tema, template, fontes).
- Supervisor: revisa cada PR contra o checklist §8, roda os testes, resolve conflitos de merge.

Skills/referências úteis no Claude Code:
- Skill `pptx` (Anthropic) como referência de manipulação/validação de .pptx nos testes.
- `python-pptx` (CI de fidelidade), `pptxgenjs` docs (https://gitbrent.github.io/PptxGenJS/),
  `@dnd-kit` (drag de slides), `zustand + zundo` ou immer patches (undo/redo), `zod` (schema),
  `next-intl` (i18n), `axe-core` (a11y).
- Modelos: `claude-sonnet-5` para a geração de decks em produção; usar structured outputs/JSON
  schema estrito.

---

## 8. Checklist final de aceite (cheque ao fim de tudo)

**Bugs:**
- [ ] Preview fecha com Esc e botão X; navega com clique/setas/espaço; mostra contador.
- [ ] Exportações e Configurações navegáveis e funcionais (sem 404, sem item morto).
- [ ] Undo/redo restaura fielmente 20 operações mistas (texto, drag, insert, delete, tema).
- [ ] Inserir elemento → elemento fica selecionado e painel/toolbar refletem seus valores reais.
- [ ] Thumbnails do dashboard e templates mostram o conteúdo real do slide 1.
- [ ] Nenhum texto de UI/placeholder em inglês.
- [ ] Imagem inserida por URL permanece idêntica após reload e está embedada no .pptx.

**Fidelidade PPTX:**
- [ ] Todos os elementos chegam como objetos nativos editáveis (nenhum slide rasterizado).
- [ ] Posições/tamanhos dentro de ±0,02" nas fixtures; SSIM ≥ 0,95 no teste visual.
- [ ] Fontes mapeadas conforme tabela; bullets nativos; notas exportadas; z-order correto.
- [ ] Arquivo abre sem aviso de reparo no PowerPoint (Windows e macOS) e no Google Slides.

**Fluxo-alvo:**
- [ ] Colar dados iniciais → deck estruturado gerado em < 30s com layouts coerentes.
- [ ] Tema Gerdau disponível como preset e como template completo, com Archivo/Archivo Narrow.
- [ ] Editor: multi-seleção, guias de alinhamento, atalhos, drag de slides funcionando.
- [ ] `npm run build` limpo, testes verdes, Lighthouse ≥ 90, axe sem violações críticas.

---

## Apêndice — Evidências do diagnóstico (produção, 05/07/2026)

- `/exports` e `/settings` → 404 (itens de menu presentes e inertes).
- Preview aberto → Esc pressionado 2× sem efeito; sem controles visíveis; setas funcionam.
- Undo 2× após "digitar TESTE + arrastar título" → texto permaneceu "TESTE" e posição ficou em
  (108.6, 281.4) em vez de (80, 160).
- Toolbar mostrava fonte "Inter 10" com elemento de 52px selecionado.
- Export PPTX de 11 slides concluído com sucesso (histórico "OK"); stack confirmada no bundle:
  `pptxgenjs`, `jspdf`, `html2canvas`; dados em `localStorage.vizu_presentations`; canvas 960×540.
- Novo deck criado vem com 3 slides em inglês ("Presentation Title" / "Thank You").
