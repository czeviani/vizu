'use client';
import type { SlideElement, TextElement, ShapeElement, ImageElement, IconElement } from '@/types/slide';
import { t } from '@/lib/i18n';
import { PPTX_SAFE_FONTS } from '@/lib/fontMap';

interface Props {
  elements: SlideElement[];
  onUpdateElement: (id: string, updater: (e: SlideElement) => SlideElement) => void;
  onRemoveElement?: (id: string) => void;
  onDuplicateElement?: (id: string) => void;
}

// Restrito às fontes com fallback seguro no PPTX (§4.7 do PPTX-SPEC).
const FONTS = PPTX_SAFE_FONTS;
const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96];

function Sep() {
  return <div style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 4px' }} />;
}

function CtxBtn({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        padding: '4px 7px',
        background: active ? 'var(--accent-soft)' : 'transparent',
        border: active ? '1.5px solid var(--accent)' : '1.5px solid transparent',
        borderRadius: 5,
        cursor: 'pointer',
        color: active ? 'var(--accent)' : 'var(--text)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        lineHeight: 1,
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--hover)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </button>
  );
}

function AlignIcon({ type }: { type: 'left' | 'center' | 'right' }) {
  const paths = {
    left: 'M3 6h18M3 12h12M3 18h15',
    center: 'M3 6h18M6 12h12M4 18h16',
    right: 'M3 6h18M9 12h12M6 18h15',
  };
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d={paths[type]} />
    </svg>
  );
}

/* ── Alignment helper button ───────────────────────────────── */
function AlignBtn({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        padding: '4px 6px',
        background: 'transparent',
        border: '1.5px solid transparent',
        borderRadius: 5,
        cursor: 'pointer',
        color: 'var(--text)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </button>
  );
}

/* ── Alignment / Distribution functions ────────────────────── */
function alignElements(
  type: 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom',
  elements: SlideElement[],
  onUpdateElement: (id: string, updater: (e: SlideElement) => SlideElement) => void
) {
  const minX = Math.min(...elements.map(e => e.x));
  const maxX = Math.max(...elements.map(e => e.x + e.width));
  const minY = Math.min(...elements.map(e => e.y));
  const maxY = Math.max(...elements.map(e => e.y + e.height));
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  elements.forEach(el => {
    let x = el.x, y = el.y;
    if (type === 'left') x = minX;
    if (type === 'centerH') x = midX - el.width / 2;
    if (type === 'right') x = maxX - el.width;
    if (type === 'top') y = minY;
    if (type === 'centerV') y = midY - el.height / 2;
    if (type === 'bottom') y = maxY - el.height;
    onUpdateElement(el.id, (e) => ({ ...e, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }));
  });
}

function distributeElements(
  axis: 'H' | 'V',
  elements: SlideElement[],
  onUpdateElement: (id: string, updater: (e: SlideElement) => SlideElement) => void
) {
  if (elements.length < 3) return;
  if (axis === 'H') {
    const sorted = [...elements].sort((a, b) => a.x - b.x);
    const totalWidth = sorted.reduce((sum, e) => sum + e.width, 0);
    const startX = sorted[0].x;
    const endX = sorted[sorted.length - 1].x + sorted[sorted.length - 1].width;
    const gap = (endX - startX - totalWidth) / (sorted.length - 1);
    let currentX = startX;
    sorted.forEach(el => {
      onUpdateElement(el.id, (e) => ({ ...e, x: Math.round(currentX * 10) / 10 }));
      currentX += el.width + gap;
    });
  } else {
    const sorted = [...elements].sort((a, b) => a.y - b.y);
    const totalHeight = sorted.reduce((sum, e) => sum + e.height, 0);
    const startY = sorted[0].y;
    const endY = sorted[sorted.length - 1].y + sorted[sorted.length - 1].height;
    const gap = (endY - startY - totalHeight) / (sorted.length - 1);
    let currentY = startY;
    sorted.forEach(el => {
      onUpdateElement(el.id, (e) => ({ ...e, y: Math.round(currentY * 10) / 10 }));
      currentY += el.height + gap;
    });
  }
}

/* ── Action buttons (duplicate + delete) shared by element types ── */
function ElementActions({
  elementId,
  onRemoveElement,
  onDuplicateElement,
}: {
  elementId: string;
  onRemoveElement?: (id: string) => void;
  onDuplicateElement?: (id: string) => void;
}) {
  return (
    <>
      <Sep />
      <Sep />
      {onDuplicateElement && (
        <button
          onClick={() => onDuplicateElement(elementId)}
          title="Duplicar elemento (Ctrl+D)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            background: 'transparent',
            border: '1px solid transparent',
            borderRadius: 5,
            cursor: 'pointer',
            color: 'var(--text-2)',
            fontSize: 12,
            fontWeight: 500,
            fontFamily: 'inherit',
            transition: 'all 0.1s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--hover)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="8" y="8" width="13" height="13" rx="2"/><path d="M4 16H3a1 1 0 01-1-1V3a1 1 0 011-1h12a1 1 0 011 1v1"/>
          </svg>
          Duplicar
        </button>
      )}
      {onRemoveElement && (
        <button
          onClick={() => onRemoveElement(elementId)}
          title="Excluir elemento (Del)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            background: 'transparent',
            border: '1px solid transparent',
            borderRadius: 5,
            cursor: 'pointer',
            color: 'var(--bad)',
            fontSize: 12,
            fontWeight: 500,
            fontFamily: 'inherit',
            transition: 'all 0.1s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bad-soft, rgba(239,68,68,0.08))'; e.currentTarget.style.borderColor = 'var(--bad)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
          </svg>
          Excluir
        </button>
      )}
    </>
  );
}

/* ── ContextToolbar ────────────────────────────────────────── */
export function ContextToolbar({ elements, onUpdateElement, onRemoveElement, onDuplicateElement }: Props) {
  /* ── Estado neutro: nenhuma seleção ──────────────────────── */
  if (elements.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        height: '100%',
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
          Selecione um elemento para editar suas propriedades rapidamente
        </span>
      </div>
    );
  }

  const el = elements[0];

  const updAll = (updater: (e: SlideElement) => SlideElement) => {
    elements.forEach((e) => onUpdateElement(e.id, updater));
  };

  /* ── Multi-seleção: controles de alinhamento ─────────────── */
  if (elements.length > 1) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '0 8px', height: '100%' }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)', marginRight: 8 }}>
          {elements.length} elementos
        </span>
        <Sep />
        {/* Alinhar à esquerda */}
        <AlignBtn title="Alinhar à esquerda" onClick={() => alignElements('left', elements, onUpdateElement)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h10M4 18h14"/><line x1="2" y1="4" x2="2" y2="20"/></svg>
        </AlignBtn>
        {/* Centralizar horizontalmente */}
        <AlignBtn title="Centralizar horizontalmente" onClick={() => alignElements('centerH', elements, onUpdateElement)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 12h20M6 6h12M4 18h16"/><line x1="12" y1="2" x2="12" y2="22"/></svg>
        </AlignBtn>
        {/* Alinhar à direita */}
        <AlignBtn title="Alinhar à direita" onClick={() => alignElements('right', elements, onUpdateElement)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M10 12h10M6 18h14"/><line x1="22" y1="4" x2="22" y2="20"/></svg>
        </AlignBtn>
        <Sep />
        {/* Alinhar ao topo */}
        <AlignBtn title="Alinhar ao topo" onClick={() => alignElements('top', elements, onUpdateElement)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 4h4v10H6zM14 4h4v7h-4z"/><line x1="2" y1="4" x2="22" y2="4"/></svg>
        </AlignBtn>
        {/* Centralizar verticalmente */}
        <AlignBtn title="Centralizar verticalmente" onClick={() => alignElements('centerV', elements, onUpdateElement)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 7h4v10H6zM14 9h4v6h-4z"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
        </AlignBtn>
        {/* Alinhar à base */}
        <AlignBtn title="Alinhar à base" onClick={() => alignElements('bottom', elements, onUpdateElement)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 10h4v10H6zM14 13h4v7h-4z"/><line x1="2" y1="20" x2="22" y2="20"/></svg>
        </AlignBtn>
        <Sep />
        {/* Distribuir horizontalmente */}
        <AlignBtn title="Distribuir horizontalmente" onClick={() => distributeElements('H', elements, onUpdateElement)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="5" height="10" rx="1"/><rect x="17" y="7" width="5" height="10" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
        </AlignBtn>
        {/* Distribuir verticalmente */}
        <AlignBtn title="Distribuir verticalmente" onClick={() => distributeElements('V', elements, onUpdateElement)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="7" y="2" width="10" height="5" rx="1"/><rect x="7" y="17" width="10" height="5" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/><line x1="12" y1="2" x2="12" y2="22"/></svg>
        </AlignBtn>
        <Sep />
        {/* Excluir tudo */}
        {onRemoveElement && (
          <button
            onClick={() => elements.forEach(elItem => onRemoveElement(elItem.id))}
            title="Excluir seleção"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              background: 'transparent',
              border: '1px solid transparent',
              borderRadius: 5,
              cursor: 'pointer',
              color: 'var(--bad)',
              fontSize: 12,
              fontWeight: 500,
              fontFamily: 'inherit',
              transition: 'all 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bad-soft, rgba(239,68,68,0.08))'; e.currentTarget.style.borderColor = 'var(--bad)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
            </svg>
            Excluir
          </button>
        )}
      </div>
    );
  }

  /* ── Elemento único: Texto ───────────────────────────────── */
  if (el.type === 'text') {
    const te = el as TextElement;
    const updStyle = (props: Partial<TextElement['style']>) =>
      updAll((e) => ({
        ...e,
        style: { ...(e as TextElement).style, ...props },
      } as TextElement));

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          padding: '0 8px',
          height: '100%',
          flexWrap: 'wrap',
        }}
      >
        {/* Font family */}
        <select
          value={te.style.fontFamily}
          onChange={(e) => updStyle({ fontFamily: e.target.value })}
          style={{
            padding: '3px 6px',
            border: '1px solid var(--border)',
            borderRadius: 5,
            fontSize: 12,
            background: 'var(--bg)',
            color: 'var(--text)',
            outline: 'none',
            cursor: 'pointer',
            maxWidth: 130,
          }}
        >
          {FONTS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        {/* Font size */}
        <select
          value={te.style.fontSize}
          onChange={(e) => updStyle({ fontSize: Number(e.target.value) })}
          style={{
            padding: '3px 6px',
            border: '1px solid var(--border)',
            borderRadius: 5,
            fontSize: 12,
            background: 'var(--bg)',
            color: 'var(--text)',
            outline: 'none',
            cursor: 'pointer',
            width: 60,
          }}
        >
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <Sep />

        {/* Bold */}
        <CtxBtn
          active={te.style.fontWeight >= 700}
          onClick={() => updStyle({ fontWeight: te.style.fontWeight >= 700 ? 400 : 700 })}
          title={t.ctx_bold}
        >
          <strong>B</strong>
        </CtxBtn>

        {/* Italic */}
        <CtxBtn
          active={te.style.fontStyle === 'italic'}
          onClick={() => updStyle({ fontStyle: te.style.fontStyle === 'italic' ? 'normal' : 'italic' })}
          title={t.ctx_italic}
        >
          <em>I</em>
        </CtxBtn>

        {/* Underline */}
        <CtxBtn
          active={te.style.textDecoration === 'underline'}
          onClick={() => updStyle({ textDecoration: te.style.textDecoration === 'underline' ? 'none' : 'underline' })}
          title={t.ctx_underline}
        >
          <span style={{ textDecoration: 'underline' }}>U</span>
        </CtxBtn>

        <Sep />

        {/* Align */}
        {(['left', 'center', 'right'] as const).map((align) => (
          <CtxBtn
            key={align}
            active={te.style.textAlign === align}
            onClick={() => updStyle({ textAlign: align })}
            title={align === 'left' ? t.ctx_align_left : align === 'center' ? t.ctx_align_center : t.ctx_align_right}
          >
            <AlignIcon type={align} />
          </CtxBtn>
        ))}

        <Sep />

        {/* Text color */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 22, height: 22, borderRadius: 4, border: '1px solid var(--border)', background: te.style.color, overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
            <input
              type="color"
              value={te.style.color.startsWith('#') ? te.style.color : '#000000'}
              onChange={(e) => updStyle({ color: e.target.value })}
              style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
            />
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{t.lbl_color}</span>
        </div>

        <ElementActions elementId={el.id} onRemoveElement={onRemoveElement} onDuplicateElement={onDuplicateElement} />
      </div>
    );
  }

  /* ── Elemento único: Forma ───────────────────────────────── */
  if (el.type === 'shape') {
    const se = el as ShapeElement;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', height: '100%' }}>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.sec_fill}</span>
        <div style={{ width: 22, height: 22, borderRadius: 4, border: '1px solid var(--border)', background: se.fill, overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
          <input
            type="color"
            value={se.fill.startsWith('#') ? se.fill : '#3b82f6'}
            onChange={(e) =>
              updAll((elItem) => ({ ...(elItem as ShapeElement), fill: e.target.value } as ShapeElement))
            }
            style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
          />
        </div>
        <Sep />
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Opacidade</span>
        <input
          type="range"
          min={0} max={1} step={0.01}
          value={el.opacity}
          onChange={(e) => updAll((elItem) => ({ ...elItem, opacity: parseFloat(e.target.value) }))}
          style={{ width: 80 }}
        />
        <span style={{ fontSize: 11, color: 'var(--text-3)', minWidth: 28 }}>
          {Math.round(el.opacity * 100)}%
        </span>
        <ElementActions elementId={el.id} onRemoveElement={onRemoveElement} onDuplicateElement={onDuplicateElement} />
      </div>
    );
  }

  /* ── Elemento único: Imagem ──────────────────────────────── */
  if (el.type === 'image') {
    const ie = el as ImageElement;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', height: '100%' }}>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.lbl_fit}</span>
        <select
          value={ie.objectFit}
          onChange={(e) =>
            updAll((elItem) => ({ ...(elItem as ImageElement), objectFit: e.target.value as 'cover' | 'contain' | 'fill' } as ImageElement))
          }
          style={{ padding: '3px 6px', border: '1px solid var(--border)', borderRadius: 5, fontSize: 12, background: 'var(--bg)', color: 'var(--text)', outline: 'none' }}
        >
          <option value="cover">{t.opt_cover}</option>
          <option value="contain">{t.opt_contain}</option>
          <option value="fill">{t.opt_fill}</option>
        </select>
        <Sep />
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Opacidade</span>
        <input
          type="range" min={0} max={1} step={0.01}
          value={el.opacity}
          onChange={(e) => updAll((elItem) => ({ ...elItem, opacity: parseFloat(e.target.value) }))}
          style={{ width: 80 }}
        />
        <span style={{ fontSize: 11, color: 'var(--text-3)', minWidth: 28 }}>
          {Math.round(el.opacity * 100)}%
        </span>
        <ElementActions elementId={el.id} onRemoveElement={onRemoveElement} onDuplicateElement={onDuplicateElement} />
      </div>
    );
  }

  /* ── Elemento único: Ícone ───────────────────────────────── */
  if (el.type === 'icon') {
    const ic = el as IconElement;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', height: '100%' }}>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.lbl_color}</span>
        <div style={{ width: 22, height: 22, borderRadius: 4, border: '1px solid var(--border)', background: ic.color, overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
          <input
            type="color"
            value={ic.color.startsWith('#') ? ic.color : '#3b82f6'}
            onChange={(e) =>
              updAll((elItem) => ({ ...(elItem as IconElement), color: e.target.value } as IconElement))
            }
            style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
          />
        </div>
        <ElementActions elementId={el.id} onRemoveElement={onRemoveElement} onDuplicateElement={onDuplicateElement} />
      </div>
    );
  }

  return null;
}
