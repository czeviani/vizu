'use client';
import type { TableElement } from '@/types/slide';

interface Props {
  element: TableElement;
}

export function TableEl({ element: el }: Props) {
  const rows = el.rows;
  if (!rows || rows.length === 0) return null;

  const colCount = rows[0].length;
  const rowCount = rows.length;

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

                  return (
                    <td
                      key={ci}
                      colSpan={cell.colspan}
                      rowSpan={cell.rowspan}
                      style={{
                        background: cell.background !== 'transparent' ? cell.background : bg,
                        color,
                        border: `1px solid ${el.borderColor}`,
                        padding: '6px 10px',
                        fontWeight: isHeader || isHeaderCol ? 600 : 400,
                        textAlign: (cell.style?.textAlign as 'left' | 'center' | 'right') ?? 'left',
                        verticalAlign: 'middle',
                        fontSize: cell.style?.fontSize ?? 14,
                        fontFamily: cell.style?.fontFamily ?? 'Inter',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {cell.content}
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
