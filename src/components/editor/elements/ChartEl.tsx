'use client';
import type { ChartElement } from '@/types/slide';

interface Props {
  element: ChartElement;
}

const PAD = { top: 20, right: 12, bottom: 28, left: 36 };

export function ChartEl({ element: el }: Props) {
  const { width, height, labels, series, colors, chartType, showLegend, title } = el;
  if (!labels.length || !series.length) return null;

  const palette = colors.length ? colors : ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];
  const titleH = title ? 22 : 0;
  const legendH = showLegend ? 20 : 0;
  const plotW = Math.max(10, width - PAD.left - PAD.right);
  const plotH = Math.max(10, height - PAD.top - PAD.bottom - titleH - legendH);
  const plotY = PAD.top + titleH;

  const allValues = series.flatMap((s) => s.values);
  const maxVal = Math.max(1, ...allValues);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
        {title && (
          <text x={width / 2} y={16} textAnchor="middle" fontSize={13} fontWeight={600} fill="#1e293b" fontFamily="Inter, sans-serif">
            {title}
          </text>
        )}

        {chartType === 'pie' ? (
          <PieChart labels={labels} values={series[0].values} colors={palette} cx={width / 2} cy={plotY + plotH / 2} r={Math.min(plotW, plotH) / 2 - 4} />
        ) : (
          <>
            {/* Eixo base */}
            <line x1={PAD.left} y1={plotY + plotH} x2={PAD.left + plotW} y2={plotY + plotH} stroke="#cbd5e1" strokeWidth={1} />
            {chartType === 'bar' ? (
              <BarChart labels={labels} series={series} colors={palette} x={PAD.left} y={plotY} w={plotW} h={plotH} maxVal={maxVal} />
            ) : (
              <LineChart labels={labels} series={series} colors={palette} x={PAD.left} y={plotY} w={plotW} h={plotH} maxVal={maxVal} />
            )}
            {labels.map((label, i) => {
              const cx = PAD.left + (plotW / labels.length) * (i + 0.5);
              return (
                <text key={label + i} x={cx} y={plotY + plotH + 16} textAnchor="middle" fontSize={10} fill="#64748b" fontFamily="Inter, sans-serif">
                  {label.length > 10 ? label.slice(0, 9) + '…' : label}
                </text>
              );
            })}
          </>
        )}

        {showLegend && series.length > 1 && (
          <g transform={`translate(${PAD.left}, ${height - legendH + 6})`}>
            {series.map((s, i) => (
              <g key={s.name} transform={`translate(${i * 90}, 0)`}>
                <rect width={10} height={10} fill={palette[i % palette.length]} rx={2} />
                <text x={14} y={9} fontSize={10} fill="#475569" fontFamily="Inter, sans-serif">{s.name}</text>
              </g>
            ))}
          </g>
        )}
        {showLegend && chartType === 'pie' && (
          <g transform={`translate(${PAD.left}, ${height - legendH + 6})`}>
            {labels.map((label, i) => (
              <g key={label + i} transform={`translate(${i * 80}, 0)`}>
                <rect width={10} height={10} fill={palette[i % palette.length]} rx={2} />
                <text x={14} y={9} fontSize={10} fill="#475569" fontFamily="Inter, sans-serif">{label.length > 8 ? label.slice(0, 7) + '…' : label}</text>
              </g>
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}

function BarChart({
  labels, series, colors, x, y, w, h, maxVal,
}: {
  labels: string[]; series: { name: string; values: number[] }[]; colors: string[];
  x: number; y: number; w: number; h: number; maxVal: number;
}) {
  const groupW = w / labels.length;
  const barGap = 3;
  const barW = Math.max(2, (groupW - barGap * (series.length + 1)) / series.length);

  return (
    <>
      {labels.map((_, li) => {
        const groupX = x + li * groupW;
        return series.map((s, si) => {
          const val = s.values[li] ?? 0;
          const barH = (val / maxVal) * h;
          const bx = groupX + barGap + si * (barW + barGap);
          const by = y + h - barH;
          return <rect key={`${li}-${si}`} x={bx} y={by} width={barW} height={barH} fill={colors[si % colors.length]} rx={2} />;
        });
      })}
    </>
  );
}

function LineChart({
  labels, series, colors, x, y, w, h, maxVal,
}: {
  labels: string[]; series: { name: string; values: number[] }[]; colors: string[];
  x: number; y: number; w: number; h: number; maxVal: number;
}) {
  return (
    <>
      {series.map((s, si) => {
        const points = s.values.map((v, i) => {
          const px = x + (w / Math.max(1, labels.length - 1)) * i;
          const py = y + h - (v / maxVal) * h;
          return `${px},${py}`;
        }).join(' ');
        return (
          <g key={s.name}>
            <polyline points={points} fill="none" stroke={colors[si % colors.length]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {s.values.map((v, i) => {
              const px = x + (w / Math.max(1, labels.length - 1)) * i;
              const py = y + h - (v / maxVal) * h;
              return <circle key={i} cx={px} cy={py} r={3} fill={colors[si % colors.length]} />;
            })}
          </g>
        );
      })}
    </>
  );
}

function PieChart({
  labels, values, colors, cx, cy, r,
}: {
  labels: string[]; values: number[]; colors: string[]; cx: number; cy: number; r: number;
}) {
  const total = values.reduce((a, b) => a + b, 0) || 1;
  let angle = -Math.PI / 2;

  return (
    <>
      {values.map((v, i) => {
        const slice = (v / total) * Math.PI * 2;
        const x1 = cx + r * Math.cos(angle);
        const y1 = cy + r * Math.sin(angle);
        angle += slice;
        const x2 = cx + r * Math.cos(angle);
        const y2 = cy + r * Math.sin(angle);
        const largeArc = slice > Math.PI ? 1 : 0;
        const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        return <path key={labels[i] + i} d={d} fill={colors[i % colors.length]} stroke="#fff" strokeWidth={1} />;
      })}
    </>
  );
}
