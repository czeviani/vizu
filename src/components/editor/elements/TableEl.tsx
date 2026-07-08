'use client';
import { useState } from 'react';
import type { TableElement } from '@/types/slide';

interface Props {
  element: TableElement;
  onUpdate?: (props: Record<string, unknown>) => void;
}

export function TableEl({ element: el, onUpdate }: Props) {
  const [editingCell, setEditingCell] = useState<{ r: number; c: number } | null>(null);
  const rows = el.rows;
  if (!rows || rows.length === 0) return null;

  const commitCell = (r: number, c: number, content: string) => {
    const next = rows.map((row, ri) =>
      ri === r ? row.map((cell, ci) => (ci === c ? { ...cell, content } : cell)) : row
    );
    onUpdate?.({ rows: next });
  };

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <table
        style={{
          width: '100%',
          height: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
          fontSize: 14,
        }}
      >
        <tbody>
          {rows.map((row, ri) => {
            const isHeader = el.headerRow && ri === 0;
            return (
              <tr key={ri}>
                {row.map((cell, ci) => {
                  const isHeaderCol = el.headerCol && ci === 0;
                  const isAlt = el.alternateRowColor && ri % 2 === 1 && !isHeader;
                  const bg = isHeader || isHeaderCol
                    ? el.headerBackground
                    : isAlt
                    ? el.alternateColor
                    : 'transparent';
                  const color = isHeader || isHeaderCol ? el.headerTextColor : (cell.style?.color ?? '#0f172a');
                  const isEditing = editingCell?.r === ri && editingCell?.c === ci;

                  return (
                    <td
                      key={ci}
                      colSpan={cell.colspan}
                      rowSpan={cell.rowspan}
                      onDoubleClick={(e) => { e.stopPropagation(); if (onUpdate) setEditingCell({ r: ri, c: ci }); }}
                      onMouseDown={(e) => { if (isEditing) e.stopPropagation(); }}
                      style={{
                        background: cell.background !== 'transparent' ? cell.background : bg,
                        color,
                        border: `1px solid ${el.borderColor}`,
                        padding: isEditing ? 0 : '6px 10px',
                        fontWeight: isHeader || isHeaderCol ? 600 : 400,
                        textAlign: (cell.style?.textAlign as 'left' | 'center' | 'right') ?? 'left',
                        verticalAlign: 'middle',
                        fontSize: cell.style?.fontSize ?? 14,
                        fontFamily: cell.style?.fontFamily ?? 'Inter',
                        overflow: 'hidden',
                        whiteSpace: isEditing ? 'normal' : 'nowrap',
                        textOverflow: 'ellipsis',
                        cursor: onUpdate ? 'text' : undefined,
                      }}
                    >
                      {isEditing ? (
                        <input
                          autoFocus
                          defaultValue={cell.content}
                          onMouseDown={(e) => e.stopPropagation()}
                          onBlur={(e) => { commitCell(ri, ci, e.target.value); setEditingCell(null); }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'Escape') {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          style={{
                            width: '100%',
                            height: '100%',
                            padding: '6px 10px',
                            border: 'none',
                            outline: '2px solid var(--accent, #3b82f6)',
                            outlineOffset: -2,
                            background: 'var(--bg, #fff)',
                            color: '#0f172a',
                            fontSize: cell.style?.fontSize ?? 14,
                            fontFamily: cell.style?.fontFamily ?? 'Inter',
                            boxSizing: 'border-box',
                          }}
                        />
                      ) : (
                        cell.content
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
