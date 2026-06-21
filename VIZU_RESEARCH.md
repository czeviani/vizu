# VIZU Research — Referências de UX para Editor de Apresentações

> Documento produzido por pesquisa web em 2026-06-21. Base para o Agente Arquiteto de UX projetar a nova interação do VIZU sem novas pesquisas.

---

## 1. Excalidraw — Filosofia e Princípios

### Estrutura de interface
Excalidraw usa um layout de **três partes fixas**: toolbar no topo (ferramentas de desenho), canvas infinito no centro, painel contextual à **esquerda** que só aparece quando há algo selecionado.

### Filosofia central: ferramenta que sai do caminho
- A interface fica propositalmente "pequena" — o objetivo é que o usuário se esqueça de que está usando uma ferramenta.
- Estética de rascunho à mão (hand-drawn) transmite a mensagem "isto ainda é um rascunho" — diminui pressão por perfeição prematura.
- **Modo Zen**: quando ativado, os painéis não somem — eles deslizam para fora da tela via CSS (`transition-left`, `transition-right`). Estado é preservado, mas a tela fica limpa.

### Toolbar e ativação de ferramentas
- Cada ferramenta tem um atalho numérico (1–9) e de letra (R = retângulo, D = diamante, E = elipse, L = linha etc).
- Double-click em qualquer lugar do canvas ativa a ferramenta de texto — atalho natural sem precisar ir à toolbar.
- Toolbar contém apenas as ferramentas de **criação de elemento** — sem propriedades de elemento na toolbar principal.

### Painel contextual (left panel)
- Aparece **somente quando há seleção** — quando nada está selecionado, desaparece silenciosamente.
- Mostra: stroke color, background fill, opacity, edge style (sharp/rounded), stroke style (solid/dashed/dotted).
- Versão compacta (mobile): usa Popovers do Radix UI para agrupar controles relacionados.
- Três variações de toolbar para contexto: `SelectedShapeActions`, `CompactShapeActions`, `MobileShapeActions`.

### Padrão técnico relevante
- O sistema detecta form factor (phone/tablet/desktop) e renderiza hierarquias de componente radicalmente diferentes — não é CSS hiding, é arquitetura adaptativa.
- `LayerUI` usa memo com comparação granular: ignora `scrollX/scrollY/cursor` (que mudam durante pan/zoom) mas monitora `selectedElementIds` para disparar atualização do painel.

### Insight para o VIZU
O Excalidraw resolve a tensão "toolbar sempre visível vs. canvas limpo" ao tornar o painel de propriedades **intrinsecamente contextual**: ele só existe quando você selecionou algo. A toolbar fixa no topo só tem ferramentas de criação. Propriedades vivem no painel lateral que aparece/desaparece com a seleção. Isto é diferente do modelo atual do VIZU onde PropertiesPanel existe sempre mas fica "vazio" quando sem seleção.

---

## 2. Canva Editor — Organização Visual

### Redesign "Glow Up" (2024–2025)
O Canva passou por uma reformulação completa chamada "Glow Up". Principais mudanças de UX:

### Toolbar contextual flutuante (elemento selecionado)
- A toolbar fixa abaixo do header **foi eliminada**.
- No lugar: uma **Quick Actions Toolbar** que aparece quando você seleciona um elemento.
- A toolbar **muda completamente** dependendo do tipo selecionado — texto, imagem, elemento, vídeo mostram toolbars diferentes.
- Acesso a funcionalidades extras: botão `>>` no final da toolbar abre o "edit panel" com todas as opções do elemento.

### Painel lateral esquerdo
- Contém: Templates, Elementos, Fontes, Brand Kit, Draw, Projects, Apps.
- Hover no ícone expande o conteúdo; click fixa o painel aberto.
- Pode ser fechado facilmente para dar mais espaço ao canvas.

### Princípio de organização
- Ferramentas de **adição** ficam no painel esquerdo.
- Ferramentas de **edição** ficam na toolbar contextual que aparece ao selecionar.
- Propriedades avançadas ficam no edit panel (acessível via `>>`).

### Insight para o VIZU
O Canva separa claramente os dois momentos do usuário: (1) **criação** — buscar e inserir um elemento, via painel esquerdo, e (2) **edição** — ajustar o elemento selecionado, via toolbar contextual. O VIZU atualmente mistura esses dois momentos na Toolbar superior (que tem tanto ferramentas de inserção quanto ações). Separar isso seria uma melhoria arquitetural clara.

---

## 3. Pitch.com — Editor de Apresentações Moderno

### Filosofia de produto (pré-2024)
Pitch posicionou-se como a alternativa "para equipes de design" ao Google Slides — interface moderna, controle tipográfico preciso, colaboração em tempo real.

### Fluxo de edição
- Prompt de IA → seleciona paleta de cores e fonte → gera rascunho → edita manualmente.
- Editor tem controle total sobre posicionamento e design.

### Toolbar e painéis
- Toolbar superior: ações globais (arquivo, compartilhar, apresentar).
- Painel direito: Design panel com Animate button (segundo item), acessível via "bubble bar" lateral.
- Top toolbar com opção de Text → Edit menu → style builder.
- Diferencial: **Animate** está acessível diretamente no painel lateral, não dentro de um menu aninhado.

### Adição de elementos e layouts
- O editor oferece "Slide Styles" personalizáveis — o usuário cria estilos reutilizáveis para slides.
- Atualizações 2024: stacked e area charts para slides de dados; crop/resize de imagem fast and easy.

### Insight para o VIZU
Pitch valida a abordagem de ter **animações diretamente acessíveis** no painel lateral — não enterradas em menus. Para o VIZU, isso sugere que funcionalidades como "Preview", "Exportar" e "Tema" deveriam estar acessíveis com 1 clique, sem submenus. O painel direito de propriedades do VIZU atual (com 3 tabs) é análogo ao painel de design do Pitch.

---

## 4. Google Slides — Interface Contextual

### Material Design 3 (2023–2024)
- Toolbar com formato de pílula (pill-shaped), fundo azul claro nas sugestões e comentários.
- Botões do topo sem containers, compartilhamento como pílula azul.
- Apresentador reformulado: mostra apenas o que é relevante durante a apresentação.

### New Sidebar with Design Elements (março 2025)
- **Novo painel lateral direito** com dois tipos de conteúdo:
  - **Building blocks**: pedaços pré-formatados (agendas, citações, estatísticas-chave) que o usuário insere e depois customiza livremente.
  - **Recursos visuais**: banco de imagens, stickers, GIFs, geração de imagem por IA.
- Os building blocks são inseridos como grupos e podem ser "des-agrupados e customizados".
- Filosofia: eliminar a troca de contexto — o usuário não precisa sair do editor para buscar inspiração ou recursos.

### Presenter Toolbar
- Reformulada para mostrar **apenas o que é útil durante a apresentação**, removendo opções irrelevantes.
- Prova do princípio de contextualidade por modo/estado de uso.

### Insight para o VIZU
O conceito de **Building Blocks** do Google Slides é diretamente aplicável ao VIZU: os 7 layouts de slide já funcionam como building blocks. A diferença é que o Google Slides permite inserir blocos temáticos (agenda, quote) dentro de um slide existente — algo que o VIZU ainda não tem. O painel lateral direito no Google Slides (para inserção de conteúdo) é separado das propriedades do elemento selecionado — dois momentos distintos, dois painéis distintos.

---

## 5. Figma — Painéis Contextuais

### UI3 — Filosofia Central (2024)
Princípio único guiando 2 anos de redesign: **"Manter designers no flow minimizando distrações e colocando o trabalho em destaque."**

### Decisão crítica: floating panels vs. fixed panels
O Figma testou **floating panels** (painéis flutuantes) e reverteu:
- Problema 1: comprimiam o canvas em telas menores.
- Problema 2: distraíam ao sobrepor o design (conteúdo ficava obscurecido).
- Problema 3: reposicionavam as réguas, tornando o workflow mais lento.
- **Solução**: voltou para painéis **fixos com redimensionamento**. A recuperação de 24px horizontais fez diferença real.

### Minimize UI
- Substitui o antigo toggle binário "Hide UI".
- Colapsa os painéis laterais para trabalho sem distração, mas mantém acesso fácil às ferramentas.
- Não é ausência total da UI — é compressão controlada.

### Painel de propriedades (direito)
- Contextual por tipo de elemento:
  - Texto: controles de tipografia (fonte, tamanho, peso, alinhamento, espaçamento)
  - Shape/Frame: corner radius, constraints, fill, stroke
  - Componente: component properties no topo, depois instance controls
  - Qualquer layer: alignment, rotation, position sempre visíveis no topo
- Header row com **ações do elemento** (criar componente, aplicar máscara, boolean operation).
- Botão "More" para ações secundárias.
- Quando nada está selecionado: mostra estilos e variáveis do arquivo.

### Estrutura do toolbar
- Toolbar **na parte inferior** do canvas (não no topo) — libera área superior para conteúdo.
- Botão "Actions" centralizado — agrupa funcionalidades de IA e não-IA, muda baseado no contexto do canvas.
- Resizable panels em vez de tamanho fixo.

### 6 Considerações Cognitivas para Toolbar Design (pesquisa independente)
1. **Posicionamento fixo vs. dinâmico**: fixo quando maioria das ações vêm da toolbar e seleção múltipla é comum.
2. **Redução de carga visual**: ocultar ações indisponíveis elimina ruído visual.
3. **Status claro**: ações desabilitadas devem aparecer em cinza, não sumir — desaparecimento cria ambiguidade sobre se a feature existe.
4. **Memória muscular**: usuários pesados desenvolvem padrões automáticos de acesso — repositionamento dinâmico destrói eficiência.
5. **Sem distração de movimento**: quando ações somem e outras se movem para preencher o espaço, visão periférica detecta o movimento e distrai do canvas.
6. **Sem ambiguidade**: ações em cinza comunicam "não disponível agora"; ações ausentes criam confusão sobre se existem em outro lugar.

### Insight para o VIZU
A lição do Figma é dupla: (1) painéis **fixos** são superiores a flutuantes para editores de design canvas-based, e (2) o painel de propriedades deve mostrar **ações do elemento** no topo (não apenas campos de edição), seguidas pelas propriedades contextuais organizadas por relevância. O atual PropertiesPanel do VIZU já segue parcialmente esse modelo, mas pode ser melhorado na ordenação e nas ações do header.

---

## 6. Tome.app / Beautiful.ai / Gamma — IA Integrada

### Tome (encerrado em março 2025)
- Não tinha slides tradicionais — tinha **"pages"** de altura variável em scroll vertical.
- IA via GPT gerava narrativa completa a partir de um prompt simples.
- Interface: **command bar** simples para criação de conteúdo — minimalismo extremo.
- Sem toolbar tradicional — o modelo era "escreva e a IA organiza visualmente".
- Diferencial: embed de live content de Figma, Miro, etc.

### Beautiful.ai
- **Smart Templates com design logic embutida**: conforme o usuário adiciona texto/imagens, o layout se reconfigura automaticamente para manter harmonia visual.
- Usuário não precisa arrastar elementos — a IA cuida do posicionamento.
- Controls de marca (brand kit) aplicados automaticamente via "smart brand controls".
- Filosofia: eliminar as decisões granulares de design da responsabilidade do usuário.

### Gamma
- Layout por **cards** (não slides fixos) — scrollable, responsivo, mais próximo de uma webpage.
- Slash command (`/`) no corpo do card para inserir blocos de conteúdo (texto, lista, callout, colunas, gráficos, embeds).
- **Toolbar superior**: Theme, Share, Agent, Present.
- **Sidebar esquerda**: thumbnails de cards para navegação.
- **Painel Agent (direito)**: dois modos — "Edit All Cards" (bulk) e "Writing Tools" (um clique para expand, condense, translate, simplify).
- Seleção → botão "Edit with AI" na toolbar → rephrase section com presets ou prompt customizado.
- Filosofia: "se você consegue escrever uma frase, consegue criar uma apresentação profissional".

### Insight para o VIZU
O VIZU tem uma vantagem sobre esses três: é um **canvas-based** real com posicionamento livre de elementos — Gamma e Beautiful.ai sacrificam controle por facilidade. O ponto a aprender é o **slash command** do Gamma: inserção de elementos diretamente no canvas via teclado, sem ir à toolbar. Outra lição: o botão "Edit with AI" aparecer na toolbar contextual quando algo está selecionado — o VIZU poderia expor "Modificar com IA" nessa posição futuramente.

---

## 7. Padrões Recorrentes nas Melhores Ferramentas

### 7.1 Toolbar: flutuante vs. fixo vs. híbrido contextual

| Abordagem | Ferramentas | Prós | Contras |
|-----------|-------------|------|---------|
| **Fixo no topo** | Excalidraw, Google Slides | Memória muscular, previsível | Ocupa espaço permanente |
| **Fixo na base** | Figma UI3 | Libera área superior, canvas mais limpo | Menos familiar para usuários de ferramentas de apresentação |
| **Flutuante** | Figma UI3 (testado e revertido) | Parece "moderno", economiza espaço | Confunde canvas com UI, comprime área de trabalho, distrai |
| **Contextual por seleção** | Canva, Infogram, Excalidraw (painel esq.) | Mostra só o relevante | Requer que usuário descubra o que aparece ao selecionar |
| **Híbrido: fixo + contextual secundário** | Canva "Glow Up", VIZU atual (ContextToolbar) | Melhor dos dois mundos | Complexidade de implementação |

**Conclusão da pesquisa**: o padrão vencedor em 2024–2025 é o **híbrido**: toolbar fixa para ações globais e inserção, + toolbar contextual secundária que aparece ao selecionar elemento com ações rápidas específicas do tipo, + painel lateral de propriedades detalhadas.

### 7.2 Adição de elementos — quantos cliques, onde ficam os botões

| Ferramenta | Método primário | Cliques até inserir |
|------------|----------------|---------------------|
| Excalidraw | Tecla de atalho (R, E, L…) ou toolbar | 1 (atalho) ou 2 (click na toolbar → click no canvas) |
| Canva | Painel esq. → arrastar ou click | 2–3 |
| Gamma | Slash command `/` no corpo | 2 (digitar `/` + selecionar bloco) |
| Google Slides | Insert menu ou sidebar direita (2025) | 2–3 |
| Figma | `F`/`R`/`T` atalho ou toolbar | 1 (atalho) ou 2 |
| VIZU atual | Toolbar → Text/Shape/Icon dropdown | 2–3 |

**Insight**: ferramentas líderes favorecem **atalhos de teclado** para inserção frequente. O VIZU tem atalhos para Ctrl+Z/Ctrl+S/Ctrl+D mas não para inserir elementos (`T` para texto, `R` para retângulo, por exemplo). Isso é uma gap de eficiência.

### 7.3 Seleção, edição de texto, inserção de imagem

| Ação | Padrão universal |
|------|-----------------|
| Selecionar | Click simples no elemento |
| Editar texto | Double-click no texto (ativa edição inline) |
| Inserir imagem | Drag-and-drop no canvas OU upload via painel/toolbar |
| Colar imagem | Ctrl+V no canvas |
| Multi-seleção | Shift+click ou box-select (drag no fundo) |
| Deletar | Delete/Backspace quando canvas tem foco e não está em edição de texto |
| Duplicar | Ctrl+D (padrão em praticamente todos) |

**VIZU já implementa todos esses padrões** — isso é um ponto forte. O risco é desviar deles ao redesenhar a UI.

### 7.4 Painéis de propriedades — organização e adaptabilidade

Estrutura hierárquica observada nas melhores ferramentas:

```
Painel de propriedades (direito)
├── Header: ações do elemento (Duplicar, Deletar, Trazer pra frente, etc.)
├── Seção 1: Posição e tamanho (x, y, w, h, rotação) — sempre no topo para qualquer elemento
├── Seção 2: Propriedades específicas do tipo
│   ├── Texto: tipografia (família, tamanho, peso, cor, alinhamento)
│   ├── Shape: preenchimento, borda, sombra, radius
│   ├── Imagem: fit, opacidade, replace
│   └── Ícone: cor, tamanho
├── Seção 3: Visibilidade e comportamento (locked, visible, opacity, zIndex)
└── Seção 4: Slide atual (background) — tab separada ou collapse
```

Padrão de collapsibility: seções com título e chevron — click no título colapsa/expande. Seção "Posição & Tamanho" quase nunca é colapsada por padrão.

---

## 8. Os 5 Princípios de UX Mais Recorrentes

### 1. Canvas em Destaque (Canvas-First)
**Descrição**: O canvas é o protagonista. Toda interface deve servir ao canvas, nunca competir com ele. Painéis fixos mas redimensionáveis, atalhos de teclado para ações frequentes, modo de foco sem distrações.

**Aplicam**: Figma UI3 ("work takes center stage"), Excalidraw (Zen Mode), Canva Glow Up (painel esq. fechável), Gamma (sidebar mínima).

**Para o VIZU**: O SlidePanel (esquerda) e o PropertiesPanel (direita) não devem competir com o canvas. Ter opção de colapsar ambos (como o VIZU já tem na home page) seria valioso no editor.

### 2. Contextualidade por Estado (State-Driven Context)
**Descrição**: A interface muda baseada no que está selecionado. Quando nada está selecionado, a UI é mínima. Quando um texto está selecionado, aparecem controles tipográficos. Quando uma shape está selecionada, aparecem controles de preenchimento. Nunca mostrar controles irrelevantes.

**Aplicam**: Excalidraw (painel esq. só aparece com seleção), Figma (painel direito contextual), Canva (quick actions toolbar muda por tipo), Infogram (floating toolbar contextual por tipo de elemento).

**Para o VIZU**: O ContextToolbar já implementa isso parcialmente. O PropertiesPanel atual mostra tabs fixas (Elemento/Slide/Tema) — o tab "Elemento" poderia ser mais contextual (mostrar seções diferentes para texto vs. shape vs. imagem de forma mais proeminente, em vez de tudo em uma lista longa).

### 3. Progressividade de Descoberta (Progressive Disclosure)
**Descrição**: Ações mais frequentes acessíveis em 1 clique. Ações menos frequentes em 2 cliques (submenu, painel expandido). Ações avançadas em 3+ cliques (configurações globais, exportação customizada).

**Aplicam**: Canva (quick actions → `>>` para mais opções), Figma (ações do header → More menu), Google Slides (Build blocks simples, depois customização), Gamma (`/` slash command → seleção de bloco).

**Para o VIZU**: O ContextToolbar é o layer de "1 clique". O PropertiesPanel é o layer de "2 cliques". Porém o caminho para inserir um elemento poderia ser mais curto via atalho de teclado.

### 4. Memória Muscular e Previsibilidade (Stability)
**Descrição**: Ações que o usuário usa frequentemente devem estar no mesmo lugar sempre. Quando a UI move coisas dinamicamente (itens sumindo, reordenando), a visão periférica detecta o movimento e distrai. Ações indisponíveis devem aparecer em cinza, não sumir.

**Aplicam**: Figma (reverteu floating panels por quebrar memória muscular), Excalidraw (toolbar fixa no topo com posições estáveis), referência de pesquisa cognitiva (6 considerações de UX para toolbar).

**Para o VIZU**: O ContextToolbar atual some completamente quando nada está selecionado. Isso cria instabilidade visual e quebra a consistência do layout (o canvas "pula" verticalmente). Melhor: manter o espaço reservado mas vazio (ou com estado "neutro"), ou animar suavemente o colapso.

### 5. Separação Criação vs. Edição (Dual-Mode UX)
**Descrição**: Existem dois momentos distintos no workflow: (1) "quero adicionar algo ao slide" e (2) "quero ajustar algo que já está no slide". Ferramentas líderes separaram esses dois modos em locais físicos diferentes na interface.

**Aplicam**: Canva (inserção no painel esq., edição na quick actions toolbar), Google Slides 2025 (design elements na sidebar direita, edição contextual), Figma (inserção via toolbar, propriedades no painel direito).

**Para o VIZU**: A Toolbar atual combina inserção (Text, Shape, Icon, Image) e ações globais (Undo, Zoom, Preview, Export) no mesmo espaço. Separar fisicamente "inserir elemento" de "ações globais" reduziria a carga cognitiva.

---

## 9. Decisão Fundamentada para o VIZU

### Modelo de interação recomendado: Híbrido Fixo + Contextual Secundário

**Com base nas evidências coletadas**, o VIZU já tem a arquitetura certa (Toolbar fixa no topo + ContextToolbar secundária + PropertiesPanel à direita + SlidePanel à esquerda). O que precisa de refinamento são os **detalhes de comportamento**:

#### 9.1 Toolbar principal (fixa, 60px no topo) — o que manter e o que refinar

**Manter como fixo e sempre visível:**
- Logo/monogram
- Título editável inline
- Save indicator
- Zoom controls (−, %, +, Fit)
- Preview button
- Export .pptx
- Theme toggle

**Refinar — separar inserção de ações globais:**
- Criar grupo visual distinto para inserção de elementos (Text, Shape, Icon, Image) vs. ações globais (Undo/Redo, Zoom).
- Undo/Redo: considerar mover para junto do título (padrão Word/Docs) liberando espaço central para inserção.
- Inserção: adicionar atalhos de teclado (`T` para texto, `R` para retângulo, `I` para ícone) documentados em tooltip.

**Evidências**: Figma tem toolbar na base; Excalidraw tem no topo com atalhos numéricos; Canva separou inserção do painel esq. Manter toolbar no topo é mais familiar para usuários de ferramentas de apresentação (PowerPoint, Google Slides).

#### 9.2 ContextToolbar (toolbar secundária contextual) — como deveria funcionar

**Estado sem seleção:**
- Manter o espaço reservado (altura fixa), mas exibir hint sutil: "Selecione um elemento para editar" ou simplesmente ficar vazio com separador visual.
- Evitar que o canvas "pule" quando a toolbar aparece/desaparece — usar `min-height` e animação de `opacity` ao invés de montar/desmontar o componente.

**Estado com seleção (texto):**
Fonte | Tamanho | B / I / U / S | Cor do texto | Alinhamento (L/C/R/J) | | Duplicar | Deletar

**Estado com seleção (shape):**
Fill color | Border width | Opacity | | Bring Front | Send Back | | Duplicar | Deletar

**Estado com seleção (imagem):**
[Replace image] | Fit/Fill | Opacity | | Bring Front | Send Back | | Duplicar | Deletar

**Estado com seleção (ícone):**
Cor | | Bring Front | Send Back | | Duplicar | Deletar

**Estado com multi-seleção:**
Align Left | Align Center | Align Right | Align Top | Align Middle | Align Bottom | Distribute H | Distribute V | | Agrupar | Deletar

**Evidências**: Canva quick actions toolbar muda por tipo; Infogram floating toolbar por tipo; Figma header row com ações do elemento; Excalidraw painel esq. contextual. A multi-seleção com alinhamento é um gap atual do VIZU.

#### 9.3 PropertiesPanel (painel direito fixo) — reorganização sugerida

**Estrutura atual do VIZU**: Tabs fixas (Elemento / Slide / Tema) com longa lista de propriedades dentro de "Elemento".

**Estrutura sugerida baseada nas referências:**

```
PropertiesPanel
├── [Sem seleção] → mostrar props do Slide + acesso ao Tema (estado unificado, não vazio)
│
└── [Com seleção] → 
    ├── Header: nome do elemento (editável) + ações (Duplicar, Deletar, Lock, Visible)
    ├── Posição & Tamanho: x, y, w, h | rotação, opacity — sempre visível, sempre no topo
    ├── [Seção contextual por tipo]:
    │   ├── Texto → Tipografia (família, tamanho, peso, estilo, decoração, cor, alinhamento, lineHeight, letterSpacing, verticalAlign) + Background da caixa
    │   ├── Shape → Preenchimento + Borda (espessura, cor, estilo, radius) + Sombra
    │   ├── Imagem → Fit/Fill, Replace, Filtros básicos
    │   └── Ícone → Cor
    └── Slide / Tema → acessíveis como tabs ou como seção colapsada abaixo quando há seleção
```

**Por que essa organização**: Figma coloca posição/tamanho sempre no topo porque é a propriedade mais frequentemente ajustada após mover/redimensionar. A lógica contextual por tipo remove a sensação de "lista infinita". O estado sem seleção deixando de ser "vazio" melhora a utilidade do painel (não desperdiça o espaço com mensagem de "nenhum elemento").

#### 9.4 SlidePanel (painel esquerdo fixo) — o que manter

O SlidePanel atual do VIZU está alinhado com as melhores práticas observadas:
- Miniaturas com drag-and-drop para reordenar ✓
- Menu contextual no right-click (Duplicate/Delete) ✓
- Botão de adicionar slide com picker de layout ✓
- Borda de destaque no slide ativo ✓

**Uma melhoria**: tornar o painel **colapsável** (ícone de toggle no canto) para ampliar o canvas quando o usuário quer foco total. O VIZU já tem essa lógica implementada na home page para a sidebar — replicar no editor.

#### 9.5 Inserção de elementos — reduzir fricção

**Hoje (VIZU)**: Toolbar → click em botão → para Shape/Icon, abre dropdown/modal → selecionar → elemento criado no centro do slide.

**Sugestão baseada em Gamma (slash command) + Excalidraw (atalhos):**
- Implementar atalhos de teclado: `T` = inserir Texto, `R` = inserir Retângulo, `I` = abrir Icon picker.
- Tooltip nos botões da toolbar mostrando o atalho: `Texto [T]`, `Shape [R]`, `Ícone [I]`.
- Ao pressionar o atalho, o elemento é inserido no centro do slide ativo e já entra em modo de edição (para texto) ou fica selecionado (para shapes).
- Isso reduz de 3 cliques para 1 tecla a inserção mais frequente.

#### 9.6 Interações que o VIZU não deve mudar

Com base nos padrões universais identificados, estas interações já estão corretas e não devem ser alteradas:
- Double-click em texto → edição inline (contenteditable)
- Drag no fundo → box-select
- Shift+click → multi-seleção
- Ctrl+Z / Ctrl+Shift+Z → undo/redo
- Ctrl+D → duplicar elemento
- Ctrl+V → colar imagem da área de transferência
- Delete/Backspace → deletar elemento (quando não está editando texto)
- Drag-and-drop de arquivo no canvas → criar ImageElement
- Drag nos handles → resize com 8 direções
- Coordenadas em pixels nativos do slide (960×540)

---

## Resumo Executivo para o Agente Arquiteto de UX

O VIZU já tem a arquitetura correta. Os três refinamentos prioritários, ordenados por impacto:

1. **ContextToolbar estável**: animar via opacity (não montar/desmontar) + adicionar estado de multi-seleção com controles de alinhamento.
2. **PropertiesPanel com estado sem seleção útil**: em vez de mostrar "nenhum elemento", mostrar propriedades do slide atual (background) + acesso ao tema — eliminando o desperdício do espaço.
3. **Atalhos de teclado para inserção**: `T`, `R`, `I` para inserir Text/Rectangle/Icon — com tooltips documentando o atalho em cada botão da toolbar.

Evidências mais fortes para essas decisões:
- Figma reverteu floating panels → fixos são superiores (**validado por empresa líder de mercado com 2 anos de teste**)
- Excalidraw mostra que painel de propriedades pode ser contextual e aparecer apenas com seleção (**padrão de editor canvas mais famoso do mercado**)
- 6 considerações cognitivas confirmam: ações devem manter posição fixa e aparecer em cinza (não sumir) para preservar memória muscular
- Canva Glow Up confirma a separação entre momento de inserção (painel esq.) e momento de edição (toolbar contextual)
