# VIZU Changelog

## [2026-06-21] — Infraestrutura de IA: API Programática + in-vizu.md

### Entregáveis desta sessão

---

### Interface Programática VIZU-AI (Fase 2)

**Arquivos criados:**
- `src/app/api/vizu-ai/execute/route.ts` — POST: array de 12 comandos estruturados em PT/EN
- `src/app/api/vizu-ai/create/route.ts` — POST: criação de apresentação via JSON único
- `src/app/api/vizu-ai/schema/route.ts` — GET: schema JSON completo para validação
- `src/app/api/vizu-ai/comandos/route.ts` — GET: referência de todos os comandos com exemplos
- `src/app/api/vizu-ai/temas/route.ts` — GET: catálogo de 6 temas com tokens de cor
- `src/app/api/vizu-ai/layouts/route.ts` — GET: 7 layouts com elementos e campos de dados
- `src/app/api/vizu-ai/icones/route.ts` — GET: 48 ícones por categoria com IDs e uso
- `src/app/api/vizu-ai/fontes/route.ts` — GET: fontes + escala tipográfica recomendada

**Funcionalidades do /execute:**
- 12 comandos: `criar_apresentacao`, `definir_titulo`, `definir_tema`, `adicionar_slide`, `remover_slide`, `duplicar_slide`, `mover_slide`, `reordenar_slides`, `editar_slide`, `adicionar_elemento`, `editar_elemento`, `remover_elemento`
- Aliases PT/EN em todos os campos (ex.: `conteudo` = `content`, `titulo` = `title`)
- 11 posições semânticas: centro, topo, rodapé, col_esquerda, col_direita, etc.
- Deep merge em `editar_elemento` — só altera campos fornecidos
- Log de execução por comando + array de erros + HTTP 207 para execução parcial

---

### Documentação de IA (Fases 1, 3 e 4)

**Arquivos criados:**
- `VIZU_MAP.md` — mapeamento interno completo (modelo de dados, API, coordenadas, layouts, ícones, fontes, persistência, exportação PPTX)
- `in-vizu.md` — manual cirúrgico para IA (11 seções: propósito, coordenadas, tipos, temas, layouts, comandos, ícones, tipografia, exemplo canônico 8 slides, padrões de qualidade, troubleshooting)

**Arquivos atualizados:**
- `vizu.md` — adicionada seção de destaque "CONSTRUÇÃO POR IA" no topo, seção VIZU-AI na §5, filelist atualizado
- `VIZU_CHANGELOG.md` — esta entrada

---

## [2026-06-21] — V3: Templates, Exportação Multi-formato e Configurações

### Novos módulos implementados nesta sessão

---

### Módulo: Templates (`/templates`)

**Arquivos criados:**
- `src/lib/templateLibrary.ts` — biblioteca de templates
- `src/app/templates/page.tsx` — página de galeria

**Funcionalidades:**
- 12 templates built-in reais (4 categorias × 3):
  - **Negócios**: Pitch de Startup (midnight, 5 slides), Relatório Trimestral (slate, 4), Proposta Comercial (ocean, 4)
  - **Educação**: Aula Introdutória (forest, 5), Material de Treinamento (slate, 4), Apresentação Acadêmica (mono, 5)
  - **Criativo**: Portfolio Criativo (rose, 5), Lançamento de Produto (midnight, 4), Proposta de Branding (rose, 4)
  - **Minimalista**: Reunião Executiva (mono, 4), Status Report (slate, 4), One-pager Limpo (ocean, 3)
- 53 slides reais gerados via `buildSlideFromSpec`
- Galeria com filtro por categoria (pills) + busca com debounce 300ms
- Cards 16:9 com SlideMiniature, hover com botões "Preview" e "Usar template"
- Modal de preview: carousel com navegação por teclado (←/→/Esc), strip de thumbnails
- "Usar template": cria Presentation com novos UUIDs, persiste no localStorage, redireciona para editor
- Sidebar idêntica à home (colapsável, escura, 4 nav-items)
- Suporte a templates user-created em `localStorage['vizu_templates']`

---

### Módulo: Exportação Multi-formato (ExportModal)

**Arquivos criados:**
- `src/lib/exportUtils.ts` — utilitários de exportação
- `src/components/editor/ExportModal.tsx` — modal completo

**Arquivo modificado:**
- `src/components/editor/Toolbar.tsx` — botão "Exportar .pptx" substituído por "Exportar" que abre modal

**Dependência adicionada:**
- `jspdf` — geração de PDF client-side

**Funcionalidades:**
- Modal com 3 abas: PPTX / PDF / PNG
- Aba PPTX: usa `exportToPptx` existente (sem alterações), download direto
- Aba PDF: captura slides via `html-to-image` → `jsPDF` (paisagem 720×405pt = 960×540px), download
- Aba PNG: captura slides com pixelRatio configurável (720p=1×, 1080p=1.5×, 1440p=2×), download individual
- Seleção de range de slides (Todos / Intervalo de X até Y)
- Barra de progresso animada durante export ("Gerando arquivo… slide N de M")
- Toast de conclusão com feedback ok/erro
- Histórico de exportações por apresentação em `localStorage['vizu-export-history']` (max 100 itens)
- Atalho `Ctrl+Shift+E` abre o modal
- Fecha com Escape
- Slides capturados via containers off-screen (SlideMiniature em scale 8× → div 960×540px)

---

### Módulo: Configurações (`/configuracoes`)

**Arquivos criados:**
- `src/lib/settingsStorage.ts` — storage tipado das configurações
- `src/app/configuracoes/page.tsx` — página dedicada

**Funcionalidades:**
- Página dedicada (não modal) acessível via sidebar nav-item
- **Seção Aparência**: tema claro/auto/escuro (aplica imediatamente), fonte padrão
- **Seção Editor**: autosave (5s/15s/30s/1min/desativado), grade com tamanho, snap, guias inteligentes, unidade px/cm
- **Seção Nova Apresentação**: tamanho padrão de slide, tema padrão (6 cards visuais)
- **Seção Atalhos**: tabela com 16 atalhos do sistema usando `<kbd>`
- **Seção Conta**: nome de exibição (edita avatar em tempo real), email readonly, exportar todos os dados como JSON, limpar apresentações (confirmação em 2 cliques)
- Salva automaticamente ao mudar qualquer campo
- Indicador "✓ Salvo" por 1.5s após mudança
- Persistência em `localStorage['vizu_settings']` com fallback para defaults

---

### Integração Global

**Arquivo modificado:**
- `src/app/page.tsx` — navItems de Templates e Configurações agora têm `onClick` com `router.push`

**Antes:** nav items eram puramente visuais (sem handler)
**Depois:** Templates → `/templates`, Configurações → `/configuracoes`, Exportações → `/templates` (galeria inclui funcionalidade)

---

## [2026-06-20/21] — V2: Redesign Visual Completo

(Ver histórico em vizu.md §11)

## [2026-06-13] — V1: Lançamento Inicial

(Ver histórico em vizu.md §11)
