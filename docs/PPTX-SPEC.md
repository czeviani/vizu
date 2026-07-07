# Vizu ↔ PowerPoint — Especificação de exportação (.pptx)

Fonte única de verdade para `src/lib/pptxExport.ts`. Qualquer feature nova de canvas
precisa, no mesmo PR, ganhar mapeamento aqui + no exporter (regra de ouro, §7).

## 1. Sistema de coordenadas

- Canvas Vizu: **960 × 540 px** (16:9).
- Slide PPTX: layout customizado `pptx.defineLayout({ name: 'VIZU', width: 10, height: 5.625 })`
  (polegadas), ativado com `pptx.layout = 'VIZU'`.
- Conversão universal px → in: `inches = px / 96` (`px()` em `pptxExport.ts`). Nunca usar outro fator.
- Conversão px → pt (fontSize, margin/inset, charSpacing, blur/offset de sombra):
  `pt = px * 0.75` (96dpi → 72pt/in), função `pt()`.
- `x, y, w, h, rotate` e `transparency = round((1 - opacity) * 100)` aplicados a todo elemento.
  Exceção: `ShapeProps` e `addShape('line', …)` não têm opacidade de objeto único — a transparência
  é replicada em `fill.transparency` e `line.transparency`. `TableProps` não suporta transparency;
  a opacidade de tabela não é representada no export (limitação aceita).
- Ordem de inserção no slide = `zIndex` crescente (elementos filtrados por `visible` e ordenados
  antes do loop de export); pptxgenjs empilha na ordem de chamada.

## 2. Texto → caixa de texto nativa (`addTextElement`)

- `addText` com array de `TextProps`, uma entrada por linha de `content.split('\n')`.
- `fontSize = pt(style.fontSize)`, `bold = fontWeight >= 700`, `italic`, `underline`
  (`{ style: 'sng' }`), `strike` (`textDecoration === 'line-through'`).
- `color` via `colorToHex` (aceita `#hex`, `rgb()/rgba()` e nomes básicos).
- `fontFace` via `toPptxFontFace()` (mapa §6) — nunca a string livre da UI.
- `charSpacing = pt(letterSpacing)`, `lineSpacingMultiple = lineHeight`.
- `textTransform: uppercase/lowercase/capitalize` não existe no PPTX → aplicado na string
  (`applyTextTransform`) antes de montar o `TextProps`.
- Listas: linha que já começa com `"• "` (prefixo gerado pelos composers determinísticos) vira
  bullet nativo (`bullet: true`) com o prefixo removido do texto — nunca o caractere literal.
- Caixa: `margin = pt(padding)`, `valign`, `rotate`, `isTextBox: true`, `fill` (se `background`
  não for `transparent`), `line` (se `border.width > 0` e `border.style !== 'none'`).
- `breakLine: true` em cada linha; sem shrink automático — o que couber no canvas da Vizu deve
  caber no PPT (validar visualmente ao adicionar layouts novos).

## 3. Shapes → shapes nativos (`addShapeElement`)

Mapa `SHAPE_MAP`: `rectangle→rect`, `rounded-rectangle→roundRect`, `circle→ellipse`,
`triangle→triangle`, `diamond→diamond`, `pentagon→pentagon`, `hexagon→hexagon`, `star→star5`,
`arrow-right→rightArrow`, `arrow-left→leftArrow`. Shape desconhecida cai em `rect`.

- `fill` aplicado só se `el.fill !== 'transparent'`; `transparency` no próprio `fill`.
- `line` aplicado só se `border.width > 0` e `border.style !== 'none'`; `dashType`:
  `dashed→dash`, `dotted→sysDot`, senão `solid`; `transparency` no próprio `line`.
- `shadow` via `toShadowProps()` (§5).

Linhas (`LineElement`, `addLineElement`) usam `addShape('line', …)` com o mesmo `dashType` e
`beginArrowType`/`endArrowType: triangle|none` conforme `arrowStart`/`arrowEnd`; transparência
em `line.transparency`.

## 4. Imagens (`addImageElement`)

- Sempre que possível, embedar: `src` iniciando com `data:` vai em `addImage({ data })`.
  `src` que ainda for URL externa vai em `addImage({ path })` — mas a UI já converte upload/URL
  para dataURL na inserção (`src/lib/imageEmbed.ts`), então `path` é só fallback de dados legados.
- `rotate`, `transparency`, `shadow` (§5) aplicados via `ImageProps` (que, diferente de
  `ShapeProps`, aceita `transparency` no nível do objeto).
- Borda: `ImageProps` não tem borda nativa no pptxgenjs → `addBorderOverlay()` desenha um
  `rect` sem preenchimento, mesma posição/rotação, como segundo objeto editável por cima.

## 5. Sombra (`toShadowProps`)

Convertida para `ShadowProps { type: 'outer', color, opacity, blur, offset, angle }`:
- `color`/`opacity` extraídos da cor da sombra (`colorToHex`/`colorAlpha`, suporta `rgba()`).
- `blur = pt(shadow.blur)`.
- `offset = pt(hypot(x, y))` (mínimo 0.5pt se x=y=0, exigência do pptxgenjs).
- `angle = atan2(y, x)` convertido para graus, normalizado 0–360.
- Sombra desabilitada (`enabled: false`) não gera `ShadowProps` (`undefined`).

## 6. Ícones (`addIconElement`)

Sem equivalente nativo editável no PPTX → rasterizados via `iconToDataUrl()` (SVG → PNG 200px,
cor aplicada) e inseridos como imagem no tamanho exato. Limitação aceita e documentada: ícone não
é editável como vetor no PowerPoint, mas posição/tamanho são fiéis.

## 7. Tabelas (`addTableElement`)

- `addTable` com matriz de `TableRow`/`TableCell`.
- Cabeçalho: `headerRow` (primeira linha) e/ou `headerCol` (primeira coluna) marcam célula como
  header — `bold`, `color: headerTextColor`, `fill: headerBackground`.
- Zebra: `alternateRowColor` aplica `alternateColor` em linhas ímpares não-header.
- `fill` por célula tem prioridade: `cell.background` explícito > header > zebra > nenhum.
- `colspan`/`rowspan` repassados direto do modelo.
- Borda uniforme `{ color: borderColor, pt: 1 }` na tabela e em cada célula.
- Sem opacidade de objeto (`TableProps` não suporta `transparency`).

## 8. Fundo do slide e tema

- `background.type === 'color'` → `pptxSlide.background = { color }`.
- `background.type === 'gradient'` → gradiente de fundo não é suportado nativamente pelo
  pptxgenjs; usa a cor `from` do gradiente como fallback sólido.
- `background.type === 'image'` → `data:` vai em `{ data }`, URL externa em `{ path }`.
- `slide.notes` (quando presente) vira `pptxSlide.addNotes(notes)` — speaker notes nativas.
  UI para editar notas ainda não existe (Fase 3); o export já suporta o campo.
- Metadados do arquivo: `pptx.title`, `pptx.subject` (`metadata.description`), `pptx.author`
  (`metadata.author` ou `'Vizu'`).

## 9. Mapa de fontes (`src/lib/fontMap.ts`)

| Vizu (UI)        | PPTX `fontFace`   | Fallback Windows/Office |
|---|---|---|
| Inter             | Inter             | Calibri |
| Archivo           | Archivo           | Arial |
| Archivo Narrow    | Archivo Narrow    | Arial Narrow |
| Georgia           | Georgia           | Georgia |
| Arial             | Arial             | Arial |
| Verdana           | Verdana           | Verdana |
| Courier New       | Courier New       | Courier New |
| Times New Roman   | Times New Roman   | Times New Roman |
| Trebuchet MS      | Trebuchet MS      | Trebuchet MS |

`PPTX_SAFE_FONTS` (chaves do mapa) é a única lista usada pelos seletores de fonte da UI
(`ContextToolbar`, `PropertiesPanel` — texto e tema). `toPptxFontFace()` faz o lookup no export;
fonte fora do mapa (dado legado) passa direto (`?? vizuFont`) e cai no fallback padrão do Office.
Fontes não instaladas na máquina do colaborador caem no fallback do Office — comportamento
esperado, não é bug.

## 10. Regra de ouro

Se um recurso visual da UI não tiver representação editável no PPTX, ele não entra na UI (ou
entra explicitamente marcado como "rasterizado no export", como os ícones — §6). Toda feature
nova do editor exige, no mesmo PR: entrada em `types/slide.ts`, renderer em
`components/editor/elements/`, mapeamento correspondente neste documento e em `pptxExport.ts`.
