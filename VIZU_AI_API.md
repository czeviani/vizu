# Vizu — AI API Reference

Vizu is a canvas-based presentation editor. Claude Code can create and modify presentations via REST API.

## Base URL

Local: `http://localhost:3003`
Production: Set NEXT_PUBLIC_APP_URL in .env.local

---

## POST /api/ai/create

Create a full presentation from a structured spec.

### Request body

```json
{
  "title": "Presentation Title",
  "theme": {
    "id": "slate"
  },
  "slides": [
    {
      "layout": "cover",
      "data": {
        "title": "Main Title",
        "subtitle": "Subtitle text",
        "author": "Author Name",
        "date": "2026"
      }
    }
  ]
}
```

### Available themes

| ID | Name | Style |
|----|------|-------|
| `slate` | Slate | Blue on white (default) |
| `midnight` | Midnight | Purple/pink on dark |
| `forest` | Forest | Green tones |
| `rose` | Rose | Red/purple on white |
| `ocean` | Ocean | Sky blue tones |
| `mono` | Mono | Black and white |
| `gerdau` | Gerdau | Institutional blue/yellow, Archivo font |

### Available layouts

| Layout | Required data fields | Optional fields |
|--------|---------------------|-----------------|
| `blank` | — | — |
| `cover` | `title` | `subtitle`, `author`, `date` |
| `section` | `title` | `subtitle` |
| `content` | `title` | `bullets[]`, `bulletIcons[]` (lucide icon name per bullet), `content` |
| `comparison` | — | `title`, `leftTitle`, `leftContent`, `rightTitle`, `rightContent` |
| `quote` | `quote` | `attribution` |
| `closing` | `title` | `subtitle` |
| `metrics` | `metrics[]` ({value, label, delta?}, 2-4 items, real numbers only) | `title` |
| `agenda` | `bullets[]` (up to 6, numbered list) | `title` |
| `chart` | `chart` ({chartType, labels[], series[]}, real data only) | `title` |
| `table` | `columns[]` ({heading, rows[]}, up to 4 columns) | `title` |
| `image-split` | — | `title`, `bullets[]`, `image` ({src, alt} — leave empty, renders as placeholder) |

### Response

Returns the full `Presentation` JSON object with all elements generated.

---

## POST /api/ai/modify

Modify an existing presentation via operations.

### Request body

```json
{
  "presentationData": { "...full presentation JSON..." },
  "operations": [
    { "op": "set-title", "title": "New Title" },
    { "op": "set-theme", "theme": { "id": "midnight" } },
    { "op": "add-slide", "position": 2, "spec": { "layout": "content", "data": { "title": "New Slide", "bullets": ["Point 1", "Point 2"] } } },
    { "op": "remove-slide", "slideId": "abc-123" },
    { "op": "update-element", "slideId": "slide-id", "elementId": "element-id", "props": { "content": "Updated text" } },
    { "op": "reorder-slides", "order": ["slide-id-2", "slide-id-1", "slide-id-3"] }
  ]
}
```

### Operations

| op | Fields | Description |
|----|--------|-------------|
| `set-title` | `title` | Change presentation title |
| `set-theme` | `theme` (partial Theme) | Apply theme by ID or custom colors |
| `add-slide` | `position`, `spec` | Insert slide at position |
| `remove-slide` | `slideId` | Delete a slide |
| `update-slide` | `slideId`, `spec` | Rebuild a slide from a new spec |
| `update-element` | `slideId`, `elementId`, `props` | Update element properties |
| `reorder-slides` | `order` (string[]) | Reorder slides by ID array |

### Response

Returns the modified `Presentation` JSON.

---

## POST /api/export

Export a presentation to .pptx.

### Request body

Full `Presentation` JSON.

### Response

Binary `.pptx` file download.

---

## Typical Claude Code workflow

```bash
# 1. Create presentation
RESULT=$(curl -s -X POST http://localhost:3003/api/ai/create \
  -H "Content-Type: application/json" \
  -d '{ "title": "My Deck", "slides": [...] }')

# 2. Save the presentation JSON to a variable
echo $RESULT | python3 -m json.tool > /tmp/my-deck.json

# 3. Open in browser (the JSON is localStorage-compatible)
# To load: paste the JSON into browser console:
#   localStorage.setItem('vizu_presentations', JSON.stringify({[id]: presentation}))
#   then navigate to /editor/{id}

# 4. Or use the modify endpoint to iterate
curl -s -X POST http://localhost:3003/api/ai/modify \
  -H "Content-Type: application/json" \
  -d "{ \"presentationData\": $(cat /tmp/my-deck.json), \"operations\": [...] }"
```

## Presentation data structure (TypeScript types)

See `src/types/slide.ts` for complete types.

Key types:
- `Presentation` — top-level object
- `Slide` — one slide with `background` and `elements[]`
- `SlideElement` — union of TextElement | ImageElement | ShapeElement | IconElement | TableElement | LineElement
- `Theme` — color palette + fonts
- `AICreateRequest` / `AIModifyRequest` — API payloads
