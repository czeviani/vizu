# Vizu — Instruções para Claude Code

Leia `vizu.md` antes de qualquer modificação. É a fonte única de verdade técnica do projeto.

## Comandos essenciais

```bash
# Desenvolvimento local
PORT=3003 npm run dev         # servidor em localhost:3003

# Build de produção
npm run build

# Deploy (auto via push, mas manual se precisar)
git add . && git commit -m "..." && git push
# Vercel detecta push na main e deploya automaticamente em vizu-czeviani.vercel.app
```

## Workflow obrigatório

1. Editar código
2. `npm run build` — verificar sem erros TS
3. `git add <arquivos>` (específicos, nunca `git add -A`)
4. `git commit -m "tipo: descrição"`
5. `git push` → Vercel deploya automaticamente

## Regras críticas

- Coordenadas de elemento: sempre pixels do slide (0-960 x, 0-540 y)
- Persistência: sempre via `storage.ts`, nunca `localStorage` direto
- Undo/redo: toda mudança de estado via `usePresentation.update()`
- Ao adicionar elemento: types/slide.ts → elements/ → CanvasElement.tsx → pptxExport.ts
- Ao adicionar layout: templates.ts + SlidePanel.tsx (LAYOUTS array)
- Ao adicionar tema: lib/themes.ts (DEFAULT_THEMES)
- Ao alterar API: atualizar também vizu.md §5

## Portas na VPS

- 3003: Vizu dev
- 3001: Leila
- 3002: Finus backend
