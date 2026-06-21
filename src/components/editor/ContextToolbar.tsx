'use client';
import type { SlideElement, TextElement, ShapeElement, ImageElement, IconElement } from '@/types/slide';
import { t } from '@/lib/i18n';

interface Props {
  elements: SlideElement[];
  onUpdateElement: (id: string, updater: (e: SlideElement) => SlideElement) => void;
}

const FONTS = ['Inter', 'Manrope', 'Georgia', 'Times New Roman', 'Arial', 'Helvetica Neue', 'Courier New'];
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

export function ContextToolbar({ elements, onUpdateElement }: Props) {
  if (elements.length === 0) return null;

  const el = elements[0];

  const updAll = (updater: (e: SlideElement) => SlideElement) => {
    elements.forEach((e) => onUpdateElement(e.id, updater));
  };

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
      </div>
    );
  }

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
              updAll((el) => ({ ...(el as ShapeElement), fill: e.target.value } as ShapeElement))
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
          onChange={(e) => updAll((el) => ({ ...el, opacity: parseFloat(e.target.value) }))}
          style={{ width: 80 }}
        />
        <span style={{ fontSize: 11, color: 'var(--text-3)', minWidth: 28 }}>
          {Math.round(el.opacity * 100)}%
        </span>
      </div>
    );
  }

  if (el.type === 'image') {
    const ie = el as ImageElement;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', height: '100%' }}>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.lbl_fit}</span>
        <select
          value={ie.objectFit}
          onChange={(e) =>
            updAll((el) => ({ ...(el as ImageElement), objectFit: e.target.value as 'cover' | 'contain' | 'fill' } as ImageElement))
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
          onChange={(e) => updAll((el) => ({ ...el, opacity: parseFloat(e.target.value) }))}
          style={{ width: 80 }}
        />
        <span style={{ fontSize: 11, color: 'var(--text-3)', minWidth: 28 }}>
          {Math.round(el.opacity * 100)}%
        </span>
      </div>
    );
  }

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
              updAll((el) => ({ ...(el as IconElement), color: e.target.value } as IconElement))
            }
            style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
          />
        </div>
      </div>
    );
  }

  return null;
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
