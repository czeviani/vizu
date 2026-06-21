'use client';
import { useState, useRef } from 'react';
import type {
  Slide, SlideElement, TextElement, ShapeElement,
  ImageElement, IconElement, Theme, Presentation,
} from '@/types/slide';
import { DEFAULT_THEMES } from '@/lib/themes';
import { t } from '@/lib/i18n';

interface Props {
  presentation: Presentation;
  slide: Slide | null;
  selectedElements: SlideElement[];
  onUpdateElement: (id: string, updater: (e: SlideElement) => SlideElement) => void;
  onUpdateSlide: (updater: (s: Slide) => Slide) => void;
  onSetTheme: (theme: Theme) => void;
  onDuplicateElement?: (id: string) => void;
  onRemoveElement?: (id: string) => void;
  onBringToFront?: (id: string) => void;
  onSendToBack?: (id: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

type Tab = 'element' | 'slide' | 'theme';

/* ── Sub-components ──────────────────────────────────────── */

function PanelLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10.5,
      fontWeight: 700,
      color: 'var(--text-3)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: 5,
    }}>
      {children}
    </div>
  );
}

function Row({ children, cols }: { children: React.ReactNode; cols?: number }) {
  return (
    <div style={{
      marginBottom: 12,
      display: cols ? 'grid' : 'block',
      gridTemplateColumns: cols ? `repeat(${cols}, 1fr)` : undefined,
      gap: cols ? 8 : undefined,
    }}>
      {children}
    </div>
  );
}

function ColorSwatch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const safeHex = /^#[0-9a-fA-F]{3,8}$/.test(value) ? value : '#000000';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 30,
        height: 30,
        borderRadius: 'var(--r-xs)',
        border: '1.5px solid var(--border)',
        background: value,
        flexShrink: 0,
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <input
          type="color"
          value={safeHex}
          onChange={(e) => onChange(e.target.value)}
          style={{ position: 'absolute', inset: '-4px', opacity: 0, width: 'calc(100% + 8px)', height: 'calc(100% + 8px)', cursor: 'pointer' }}
        />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1,
          padding: '5px 8px',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-xs)',
          fontSize: 12,
          background: 'var(--bg)',
          color: 'var(--text)',
          outline: 'none',
          fontFamily: 'ui-monospace, monospace',
          transition: 'border-color 0.15s',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
      />
    </div>
  );
}

function NumInput({ value, onChange, min, max, step = 1, suffix }: {
  value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; suffix?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <input
        type="number"
        value={Math.round(value * 10) / 10}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min} max={max} step={step}
        className="select"
        style={{ flex: 1, padding: '5px 7px', fontVariantNumeric: 'tabular-nums' }}
      />
      {suffix && <span style={{ fontSize: 11, color: 'var(--text-3)', minWidth: 16, fontWeight: 600 }}>{suffix}</span>}
    </div>
  );
}

function SelectInput({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="select">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          padding: '9px 14px',
          background: 'transparent',
          border: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-2)',
          textAlign: 'left',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          fontFamily: 'inherit',
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-2)'; }}
      >
        {title}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      {open && <div style={{ padding: '4px 14px 14px' }}>{children}</div>}
    </div>
  );
}

/* ── AlignButton ────────────────────────────────────────── */
function AlignButton({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: '100%',
        height: 32,
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-xs)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-2)',
        transition: 'all 0.12s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-soft)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      {children}
    </button>
  );
}

/* ── Element-type properties ────────────────────────────── */

function TextProperties({ el, onChange }: { el: TextElement; onChange: (u: (e: SlideElement) => SlideElement) => void }) {
  const upd = (props: Partial<TextElement>) => onChange((e) => ({ ...e, ...props } as TextElement));
  const updStyle = (props: Partial<TextElement['style']>) =>
    onChange((e) => ({ ...e, style: { ...(e as TextElement).style, ...props } } as TextElement));

  return (
    <>
      <Section title="Tipografia">
        <Row>
          <PanelLabel>Fonte</PanelLabel>
          <SelectInput value={el.style.fontFamily} onChange={(v) => updStyle({ fontFamily: v })} options={[
            { value: 'Inter', label: 'Inter' }, { value: 'Manrope', label: 'Manrope' },
            { value: 'Georgia', label: 'Georgia' }, { value: 'Times New Roman', label: 'Times New Roman' },
            { value: 'Arial', label: 'Arial' }, { value: 'Helvetica Neue', label: 'Helvetica Neue' },
            { value: 'Courier New', label: 'Courier New' },
          ]} />
        </Row>
        <Row cols={2}>
          <div>
            <PanelLabel>Tamanho</PanelLabel>
            <NumInput value={el.style.fontSize} onChange={(v) => updStyle({ fontSize: v })} min={6} max={200} suffix="px" />
          </div>
          <div>
            <PanelLabel>Espessura</PanelLabel>
            <SelectInput value={String(el.style.fontWeight)} onChange={(v) => updStyle({ fontWeight: Number(v) })} options={[
              { value: '300', label: 'Leve' }, { value: '400', label: 'Normal' },
              { value: '500', label: 'Médio' }, { value: '600', label: 'Semi' },
              { value: '700', label: 'Negrito' }, { value: '800', label: 'Extra' },
            ]} />
          </div>
        </Row>
        <Row>
          <PanelLabel>Cor do texto</PanelLabel>
          <ColorSwatch value={el.style.color} onChange={(v) => updStyle({ color: v })} />
        </Row>
        <Row>
          <PanelLabel>Alinhamento</PanelLabel>
          <div style={{ display: 'flex', gap: 3 }}>
            {(['left', 'center', 'right', 'justify'] as const).map((a) => {
              const icons: Record<string, string> = {
                left: 'M3 6h18M3 12h12M3 18h16',
                center: 'M3 6h18M6 12h12M4 18h16',
                right: 'M3 6h18M9 12h12M5 18h16',
                justify: 'M3 6h18M3 12h18M3 18h18',
              };
              return (
                <button
                  key={a}
                  onClick={() => updStyle({ textAlign: a })}
                  title={a}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    border: `1.5px solid ${el.style.textAlign === a ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--r-xs)',
                    background: el.style.textAlign === a ? 'var(--accent-soft)' : 'transparent',
                    cursor: 'pointer',
                    color: el.style.textAlign === a ? 'var(--accent)' : 'var(--text-3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.12s',
                    fontFamily: 'inherit',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d={icons[a]} />
                  </svg>
                </button>
              );
            })}
          </div>
        </Row>
        <Row>
          <PanelLabel>Estilo</PanelLabel>
          <div style={{ display: 'flex', gap: 3 }}>
            {[
              { key: 'italic', label: 'I', style: { fontStyle: 'italic' as const }, prop: 'fontStyle', active: el.style.fontStyle === 'italic', toggle: () => updStyle({ fontStyle: el.style.fontStyle === 'italic' ? 'normal' : 'italic' }) },
              { key: 'underline', label: 'U', style: { textDecoration: 'underline' as const }, prop: 'textDecoration', active: el.style.textDecoration === 'underline', toggle: () => updStyle({ textDecoration: el.style.textDecoration === 'underline' ? 'none' : 'underline' }) },
            ].map((s) => (
              <button
                key={s.key}
                onClick={s.toggle}
                style={{
                  width: 32, height: 30,
                  border: `1.5px solid ${s.active ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--r-xs)',
                  background: s.active ? 'var(--accent-soft)' : 'transparent',
                  cursor: 'pointer',
                  color: s.active ? 'var(--accent)' : 'var(--text-3)',
                  fontSize: 13,
                  fontWeight: 700,
                  ...s.style,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'inherit',
                  transition: 'all 0.12s',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </Row>
        <Row cols={2}>
          <div>
            <PanelLabel>Altura linha</PanelLabel>
            <NumInput value={el.style.lineHeight} onChange={(v) => updStyle({ lineHeight: v })} min={0.8} max={4} step={0.05} />
          </div>
          <div>
            <PanelLabel>Espaçamento</PanelLabel>
            <NumInput value={el.style.letterSpacing} onChange={(v) => updStyle({ letterSpacing: v })} min={-5} max={20} step={0.1} suffix="px" />
          </div>
        </Row>
      </Section>
      <Section title="Caixa de texto" defaultOpen={false}>
        <Row>
          <PanelLabel>Fundo</PanelLabel>
          <ColorSwatch value={el.background} onChange={(v) => upd({ background: v })} />
        </Row>
        <Row cols={2}>
          <div>
            <PanelLabel>Padding</PanelLabel>
            <NumInput value={el.padding} onChange={(v) => upd({ padding: v })} min={0} max={80} suffix="px" />
          </div>
          <div>
            <PanelLabel>Alinhamento V.</PanelLabel>
            <SelectInput value={el.verticalAlign} onChange={(v) => upd({ verticalAlign: v as TextElement['verticalAlign'] })} options={[
              { value: 'top', label: 'Topo' }, { value: 'middle', label: 'Meio' }, { value: 'bottom', label: 'Base' },
            ]} />
          </div>
        </Row>
      </Section>
    </>
  );
}

function ImageProperties({ el, onChange, onUpdate }: {
  el: ImageElement;
  onChange: (u: (e: SlideElement) => SlideElement) => void;
  onUpdate: (props: Partial<ImageElement>) => void;
}) {
  const upd = (props: Partial<ImageElement>) => onChange((e) => ({ ...e, ...props } as ImageElement));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      if (src) onUpdate({ src });
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <Section title="Imagem">
        <Row>
          <PanelLabel>URL / Fonte</PanelLabel>
          <input
            type="text" value={el.src}
            onChange={(e) => upd({ src: e.target.value })}
            placeholder="https://…"
            className="select"
            style={{ width: '100%', padding: '6px 8px', fontSize: 12 }}
          />
        </Row>
        <Row>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'center', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
            Substituir imagem
          </button>
        </Row>
        <Row cols={2}>
          <div>
            <PanelLabel>Ajuste</PanelLabel>
            <SelectInput value={el.objectFit} onChange={(v) => upd({ objectFit: v as 'cover' | 'contain' | 'fill' })} options={[
              { value: 'cover', label: 'Cobrir' }, { value: 'contain', label: 'Conter' }, { value: 'fill', label: 'Preencher' },
            ]} />
          </div>
          <div>
            <PanelLabel>Texto alt</PanelLabel>
            <input
              type="text" value={el.alt}
              onChange={(e) => upd({ alt: e.target.value })}
              placeholder="Descrição"
              className="select"
              style={{ padding: '5px 7px', fontSize: 12, width: '100%' }}
            />
          </div>
        </Row>
      </Section>
      <Section title="Borda" defaultOpen={false}>
        <Row cols={2}>
          <div>
            <PanelLabel>Largura</PanelLabel>
            <NumInput value={el.border.width} onChange={(v) => upd({ border: { ...el.border, width: v } })} min={0} max={20} suffix="px" />
          </div>
          <div>
            <PanelLabel>Raio</PanelLabel>
            <NumInput value={el.border.radius} onChange={(v) => upd({ border: { ...el.border, radius: v } })} min={0} max={200} suffix="px" />
          </div>
        </Row>
        {el.border.width > 0 && (
          <Row>
            <PanelLabel>Cor da borda</PanelLabel>
            <ColorSwatch value={el.border.color || '#000000'} onChange={(v) => upd({ border: { ...el.border, color: v } })} />
          </Row>
        )}
      </Section>
    </>
  );
}

function ShapeProperties({ el, onChange }: { el: ShapeElement; onChange: (u: (e: SlideElement) => SlideElement) => void }) {
  const upd = (props: Partial<ShapeElement>) => onChange((e) => ({ ...e, ...props } as ShapeElement));

  return (
    <>
      <Section title="Preenchimento">
        <Row>
          <PanelLabel>Cor de preenchimento</PanelLabel>
          <ColorSwatch value={el.fill} onChange={(v) => upd({ fill: v })} />
        </Row>
      </Section>
      <Section title="Borda" defaultOpen={false}>
        <Row cols={2}>
          <div>
            <PanelLabel>Largura</PanelLabel>
            <NumInput value={el.border.width} onChange={(v) => upd({ border: { ...el.border, width: v } })} min={0} max={20} suffix="px" />
          </div>
          <div>
            <PanelLabel>Raio</PanelLabel>
            <NumInput value={el.border.radius} onChange={(v) => upd({ border: { ...el.border, radius: v } })} min={0} max={200} suffix="px" />
          </div>
        </Row>
        <Row cols={2}>
          <div>
            <PanelLabel>Estilo</PanelLabel>
            <SelectInput value={el.border.style} onChange={(v) => upd({ border: { ...el.border, style: v as 'solid' | 'dashed' | 'dotted' | 'none' } })} options={[
              { value: 'none', label: 'Nenhuma' }, { value: 'solid', label: 'Sólida' },
              { value: 'dashed', label: 'Tracejada' }, { value: 'dotted', label: 'Pontilhada' },
            ]} />
          </div>
          <div>
            <PanelLabel>Cor</PanelLabel>
            <input type="color" value={el.border.color || '#000000'} onChange={(e) => upd({ border: { ...el.border, color: e.target.value } })} style={{ width: '100%', height: 30, border: '1px solid var(--border)', borderRadius: 'var(--r-xs)', cursor: 'pointer', padding: 2 }} />
          </div>
        </Row>
      </Section>
      <Section title="Sombra" defaultOpen={false}>
        <Row>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: 500, color: 'var(--text-2)' }}>
            <input
              type="checkbox"
              checked={el.shadow.enabled}
              onChange={(e) => upd({ shadow: { ...el.shadow, enabled: e.target.checked } })}
              style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
            />
            Ativar sombra
          </label>
        </Row>
        {el.shadow.enabled && (
          <>
            <Row cols={2}>
              <div><PanelLabel>Offset X</PanelLabel><NumInput value={el.shadow.x} onChange={(v) => upd({ shadow: { ...el.shadow, x: v } })} min={-50} max={50} suffix="px" /></div>
              <div><PanelLabel>Offset Y</PanelLabel><NumInput value={el.shadow.y} onChange={(v) => upd({ shadow: { ...el.shadow, y: v } })} min={-50} max={50} suffix="px" /></div>
            </Row>
            <Row>
              <PanelLabel>Desfoque</PanelLabel>
              <NumInput value={el.shadow.blur} onChange={(v) => upd({ shadow: { ...el.shadow, blur: v } })} min={0} max={100} suffix="px" />
            </Row>
            <Row>
              <PanelLabel>Cor da sombra</PanelLabel>
              <ColorSwatch value={el.shadow.color} onChange={(v) => upd({ shadow: { ...el.shadow, color: v } })} />
            </Row>
          </>
        )}
      </Section>
    </>
  );
}

function IconProperties({ el, onChange }: { el: IconElement; onChange: (u: (e: SlideElement) => SlideElement) => void }) {
  const upd = (props: Partial<IconElement>) => onChange((e) => ({ ...e, ...props } as IconElement));
  return (
    <Section title="Ícone">
      <Row>
        <PanelLabel>Cor</PanelLabel>
        <ColorSwatch value={el.color} onChange={(v) => upd({ color: v })} />
      </Row>
    </Section>
  );
}

function CommonProperties({ el, onChange }: { el: SlideElement; onChange: (u: (e: SlideElement) => SlideElement) => void }) {
  const upd = (props: Partial<SlideElement>) => onChange((e) => ({ ...e, ...props } as SlideElement));

  return (
    <Section title="Posição e Tamanho">
      <Row cols={2}>
        <div><PanelLabel>X</PanelLabel><NumInput value={el.x} onChange={(v) => upd({ x: v })} suffix="px" /></div>
        <div><PanelLabel>Y</PanelLabel><NumInput value={el.y} onChange={(v) => upd({ y: v })} suffix="px" /></div>
      </Row>
      <Row cols={2}>
        <div><PanelLabel>Largura</PanelLabel><NumInput value={el.width} onChange={(v) => upd({ width: Math.max(8, v) })} min={8} suffix="px" /></div>
        <div><PanelLabel>Altura</PanelLabel><NumInput value={el.height} onChange={(v) => upd({ height: Math.max(8, v) })} min={8} suffix="px" /></div>
      </Row>
      <Row cols={2}>
        <div><PanelLabel>Rotação</PanelLabel><NumInput value={el.rotation} onChange={(v) => upd({ rotation: v })} min={-360} max={360} suffix="°" /></div>
        <div><PanelLabel>Camada</PanelLabel><NumInput value={el.zIndex} onChange={(v) => upd({ zIndex: Math.round(v) })} min={0} max={1000} /></div>
      </Row>
      <Row>
        <PanelLabel>Opacidade — {Math.round(el.opacity * 100)}%</PanelLabel>
        <input
          type="range" min={0} max={1} step={0.01} value={el.opacity}
          onChange={(e) => upd({ opacity: parseFloat(e.target.value) })}
          style={{ width: '100%' }}
        />
      </Row>
      <Row>
        <div style={{ display: 'flex', gap: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12.5, fontWeight: 500, color: 'var(--text-2)' }}>
            <input type="checkbox" checked={el.locked} onChange={(e) => upd({ locked: e.target.checked })} style={{ accentColor: 'var(--accent)', width: 13, height: 13 }} />
            Bloqueado
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12.5, fontWeight: 500, color: 'var(--text-2)' }}>
            <input type="checkbox" checked={el.visible} onChange={(e) => upd({ visible: e.target.checked })} style={{ accentColor: 'var(--accent)', width: 13, height: 13 }} />
            Visível
          </label>
        </div>
      </Row>
    </Section>
  );
}

function SlideProperties({ slide, onUpdateSlide }: { slide: Slide; onUpdateSlide: (u: (s: Slide) => Slide) => void }) {
  const bg = slide.background;
  const updBg = (props: Partial<typeof bg>) => onUpdateSlide((s) => ({ ...s, background: { ...s.background, ...props } }));

  return (
    <Section title="Fundo do Slide">
      <Row>
        <PanelLabel>Tipo</PanelLabel>
        <SelectInput value={bg.type} onChange={(v) => updBg({ type: v as 'color' | 'gradient' | 'image' })} options={[
          { value: 'color', label: 'Cor sólida' }, { value: 'gradient', label: 'Gradiente' }, { value: 'image', label: 'Imagem URL' },
        ]} />
      </Row>
      {bg.type === 'color' && (
        <Row>
          <PanelLabel>Cor</PanelLabel>
          <ColorSwatch value={bg.color ?? '#ffffff'} onChange={(v) => updBg({ color: v })} />
        </Row>
      )}
      {bg.type === 'gradient' && (
        <>
          <Row cols={2}>
            <div><PanelLabel>De</PanelLabel><input type="color" value={bg.gradient?.from ?? '#3b82f6'} onChange={(e) => updBg({ gradient: { ...bg.gradient!, from: e.target.value } })} style={{ width: '100%', height: 30, border: '1px solid var(--border)', borderRadius: 'var(--r-xs)', cursor: 'pointer', padding: 2 }} /></div>
            <div><PanelLabel>Para</PanelLabel><input type="color" value={bg.gradient?.to ?? '#8b5cf6'} onChange={(e) => updBg({ gradient: { ...bg.gradient!, to: e.target.value } })} style={{ width: '100%', height: 30, border: '1px solid var(--border)', borderRadius: 'var(--r-xs)', cursor: 'pointer', padding: 2 }} /></div>
          </Row>
          <Row>
            <PanelLabel>Direção</PanelLabel>
            <NumInput value={bg.gradient?.direction ?? 135} onChange={(v) => updBg({ gradient: { ...bg.gradient!, direction: v } })} min={0} max={360} suffix="°" />
          </Row>
        </>
      )}
      {bg.type === 'image' && (
        <Row>
          <PanelLabel>URL da imagem</PanelLabel>
          <input
            type="text" value={bg.image ?? ''}
            onChange={(e) => updBg({ image: e.target.value })}
            placeholder="https://…"
            className="select"
            style={{ width: '100%', padding: '6px 8px', fontSize: 12 }}
          />
        </Row>
      )}
    </Section>
  );
}

function ThemeProperties({ presentation, onSetTheme }: { presentation: Presentation; onSetTheme: (theme: Theme) => void }) {
  const th = presentation.theme;
  const updColors = (props: Partial<Theme['colors']>) => onSetTheme({ ...th, colors: { ...th.colors, ...props } });

  const colorLabels: [string, keyof Theme['colors']][] = [
    ['Primária', 'primary'], ['Secundária', 'secondary'], ['Destaque', 'accent'],
    ['Fundo', 'background'], ['Superfície', 'surface'], ['Texto', 'text'],
    ['Texto secundário', 'textSecondary'], ['Borda', 'border'],
  ];

  return (
    <>
      <Section title="Temas predefinidos">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {DEFAULT_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onSetTheme(theme)}
              style={{
                padding: 10,
                border: `2px solid ${th.id === theme.id ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--r-sm)',
                background: th.id === theme.id ? 'var(--accent-soft)' : 'var(--bg)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => { if (th.id !== theme.id) { e.currentTarget.style.borderColor = 'var(--border-strong)'; } }}
              onMouseLeave={(e) => { if (th.id !== theme.id) { e.currentTarget.style.borderColor = 'var(--border)'; } }}
            >
              {/* Mini preview */}
              <div style={{ height: 24, borderRadius: 4, background: theme.colors.background, marginBottom: 6, border: '1px solid rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', bottom: 5, left: 5, right: 5, height: 2, borderRadius: 2, background: theme.colors.primary, opacity: 0.9 }} />
              </div>
              <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                {[theme.colors.primary, theme.colors.secondary, theme.colors.accent].map((c) => (
                  <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                ))}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: th.id === theme.id ? 'var(--accent)' : 'var(--text-2)' }}>{theme.name}</span>
            </button>
          ))}
        </div>
      </Section>
      <Section title="Cores customizadas" defaultOpen={false}>
        {colorLabels.map(([label, key]) => (
          <Row key={key}>
            <PanelLabel>{label}</PanelLabel>
            <ColorSwatch value={th.colors[key]} onChange={(v) => updColors({ [key]: v })} />
          </Row>
        ))}
      </Section>
      <Section title="Tipografia" defaultOpen={false}>
        <Row>
          <PanelLabel>Fonte título</PanelLabel>
          <SelectInput value={th.fonts.heading} onChange={(v) => onSetTheme({ ...th, fonts: { ...th.fonts, heading: v } })} options={[
            { value: 'Inter', label: 'Inter' }, { value: 'Manrope', label: 'Manrope' },
            { value: 'Georgia', label: 'Georgia' }, { value: 'Arial', label: 'Arial' },
          ]} />
        </Row>
        <Row>
          <PanelLabel>Fonte corpo</PanelLabel>
          <SelectInput value={th.fonts.body} onChange={(v) => onSetTheme({ ...th, fonts: { ...th.fonts, body: v } })} options={[
            { value: 'Inter', label: 'Inter' }, { value: 'Manrope', label: 'Manrope' },
            { value: 'Georgia', label: 'Georgia' }, { value: 'Arial', label: 'Arial' },
          ]} />
        </Row>
      </Section>
    </>
  );
}

/* ── Action button ──────────────────────────────────────── */
function ActionBtn({ onClick, title, danger, children }: {
  onClick: () => void; title?: string; danger?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '5px 9px',
        background: 'transparent',
        border: `1px solid ${danger ? 'var(--bad-soft)' : 'var(--border)'}`,
        borderRadius: 'var(--r-xs)',
        fontSize: 11.5,
        fontWeight: 600,
        color: danger ? 'var(--bad)' : 'var(--text-2)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.12s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger ? 'var(--bad-soft)' : 'var(--surface-2)';
        e.currentTarget.style.color = danger ? 'var(--bad)' : 'var(--text)';
        e.currentTarget.style.borderColor = danger ? 'var(--bad)' : 'var(--border-strong)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = danger ? 'var(--bad)' : 'var(--text-2)';
        e.currentTarget.style.borderColor = danger ? 'var(--bad-soft)' : 'var(--border)';
      }}
    >
      {children}
    </button>
  );
}

/* ── CollapseButton ─────────────────────────────────────── */
function CollapseButton({ collapsed, onToggle }: { collapsed: boolean; onToggle?: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={collapsed ? 'Expandir propriedades' : 'Recolher propriedades'}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--text-3)',
        display: 'flex',
        alignItems: 'center',
        padding: '4px',
        borderRadius: 'var(--r-xs)',
        transition: 'all 0.15s',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        {collapsed
          ? <path d="M11 19l-7-7 7-7M21 19l-7-7 7-7"/>
          : <path d="M13 5l7 7-7 7M3 5l7 7-7 7"/>
        }
      </svg>
    </button>
  );
}

/* ── PropertiesPanel ───────────────────────────────────── */
export function PropertiesPanel({
  presentation, slide, selectedElements,
  onUpdateElement, onUpdateSlide, onSetTheme,
  onDuplicateElement, onRemoveElement, onBringToFront, onSendToBack,
  collapsed, onToggleCollapse,
}: Props) {
  const [tab, setTab] = useState<Tab>('element');
  const el = selectedElements.length === 1 ? selectedElements[0] : null;

  /* ── Collapsed state — faixa estreita ────────────────── */
  if (collapsed) {
    return (
      <aside style={{
        width: 36,
        flexShrink: 0,
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 8,
        overflow: 'hidden',
      }}>
        <CollapseButton collapsed={true} onToggle={onToggleCollapse} />
      </aside>
    );
  }

  /* ── Alignment helpers (multi-select) ───────────────── */
  const alignElements = (type: 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom') => {
    const els = selectedElements;
    const minX = Math.min(...els.map((e) => e.x));
    const maxX = Math.max(...els.map((e) => e.x + e.width));
    const minY = Math.min(...els.map((e) => e.y));
    const maxY = Math.max(...els.map((e) => e.y + e.height));
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    els.forEach((elem) => {
      let x = elem.x, y = elem.y;
      if (type === 'left') x = minX;
      else if (type === 'centerH') x = midX - elem.width / 2;
      else if (type === 'right') x = maxX - elem.width;
      else if (type === 'top') y = minY;
      else if (type === 'centerV') y = midY - elem.height / 2;
      else if (type === 'bottom') y = maxY - elem.height;
      onUpdateElement(elem.id, (e) => ({ ...e, x, y }));
    });
  };

  const distributeElements = (axis: 'H' | 'V') => {
    const els = selectedElements;
    if (els.length < 3) return;
    if (axis === 'H') {
      const sorted = [...els].sort((a, b) => a.x - b.x);
      const totalW = sorted.reduce((s, e) => s + e.width, 0);
      const start = sorted[0].x;
      const end = sorted[sorted.length - 1].x + sorted[sorted.length - 1].width;
      const gap = (end - start - totalW) / (sorted.length - 1);
      let cur = start;
      sorted.forEach((elem) => {
        onUpdateElement(elem.id, (e) => ({ ...e, x: cur }));
        cur += elem.width + gap;
      });
    } else {
      const sorted = [...els].sort((a, b) => a.y - b.y);
      const totalH = sorted.reduce((s, e) => s + e.height, 0);
      const start = sorted[0].y;
      const end = sorted[sorted.length - 1].y + sorted[sorted.length - 1].height;
      const gap = (end - start - totalH) / (sorted.length - 1);
      let cur = start;
      sorted.forEach((elem) => {
        onUpdateElement(elem.id, (e) => ({ ...e, y: cur }));
        cur += elem.height + gap;
      });
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'element', label: 'Elemento' },
    { id: 'slide', label: 'Slide' },
    { id: 'theme', label: 'Tema' },
  ];

  /* ── Render: sem seleção ─────────────────────────────── */
  if (selectedElements.length === 0) {
    return (
      <aside style={{
        width: 256,
        flexShrink: 0,
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Cabeçalho sem tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          flexShrink: 0,
          padding: '10px 14px 8px',
        }}>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-3)',
          }}>
            Slide atual
          </span>
          <CollapseButton collapsed={false} onToggle={onToggleCollapse} />
        </div>

        {/* Conteúdo: SlideProperties + ThemeProperties */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {slide && <SlideProperties slide={slide} onUpdateSlide={onUpdateSlide} />}
          <ThemeProperties presentation={presentation} onSetTheme={onSetTheme} />
        </div>
      </aside>
    );
  }

  /* ── Render: multi-seleção ───────────────────────────── */
  if (selectedElements.length > 1) {
    return (
      <aside style={{
        width: 256,
        flexShrink: 0,
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Cabeçalho */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px 8px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>
            {selectedElements.length} elementos selecionados
          </span>
          <CollapseButton collapsed={false} onToggle={onToggleCollapse} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Seção de Alinhamento */}
          <Section title="Alinhamento" defaultOpen={true}>
            {/* Linha 1: Alinhamento horizontal */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginBottom: 4 }}>
              <AlignButton title="Alinhar à esquerda" onClick={() => alignElements('left')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 6h16M4 12h10M4 18h14"/><line x1="2" y1="4" x2="2" y2="20"/>
                </svg>
              </AlignButton>
              <AlignButton title="Centralizar horizontalmente" onClick={() => alignElements('centerH')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M2 12h20M6 6h12M4 18h16"/><line x1="12" y1="2" x2="12" y2="22"/>
                </svg>
              </AlignButton>
              <AlignButton title="Alinhar à direita" onClick={() => alignElements('right')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 6h16M10 12h10M6 18h14"/><line x1="22" y1="4" x2="22" y2="20"/>
                </svg>
              </AlignButton>
            </div>
            {/* Linha 2: Alinhamento vertical */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginBottom: 4 }}>
              <AlignButton title="Alinhar ao topo" onClick={() => alignElements('top')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 4h4v10H6zM14 4h4v7h-4z"/><line x1="2" y1="4" x2="22" y2="4"/>
                </svg>
              </AlignButton>
              <AlignButton title="Centralizar verticalmente" onClick={() => alignElements('centerV')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 7h4v10H6zM14 9h4v6h-4z"/><line x1="2" y1="12" x2="22" y2="12"/>
                </svg>
              </AlignButton>
              <AlignButton title="Alinhar à base" onClick={() => alignElements('bottom')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 10h4v10H6zM14 13h4v7h-4z"/><line x1="2" y1="20" x2="22" y2="20"/>
                </svg>
              </AlignButton>
            </div>
            {/* Linha 3: Distribuição */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
              <AlignButton title="Distribuir horizontalmente" onClick={() => distributeElements('H')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="2" y="7" width="4" height="10" rx="1"/><rect x="18" y="7" width="4" height="10" rx="1"/><rect x="10" y="9" width="4" height="6" rx="1"/>
                </svg>
              </AlignButton>
              <AlignButton title="Distribuir verticalmente" onClick={() => distributeElements('V')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="7" y="2" width="10" height="4" rx="1"/><rect x="7" y="18" width="10" height="4" rx="1"/><rect x="9" y="10" width="6" height="4" rx="1"/>
                </svg>
              </AlignButton>
            </div>
          </Section>

          {/* Opacidade global */}
          <Section title="Opacidade" defaultOpen={true}>
            <Row>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="range" min={0} max={1} step={0.01}
                  value={selectedElements[0]?.opacity ?? 1}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    selectedElements.forEach((elem) => onUpdateElement(elem.id, (el) => ({ ...el, opacity: val })));
                  }}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: 12, color: 'var(--text-3)', minWidth: 34, textAlign: 'right' }}>
                  {Math.round((selectedElements[0]?.opacity ?? 1) * 100)}%
                </span>
              </div>
            </Row>
          </Section>

          {/* Excluir seleção */}
          <div style={{ padding: '8px 14px 14px' }}>
            <button
              onClick={() => selectedElements.forEach((elem) => onRemoveElement?.(elem.id))}
              style={{
                width: '100%',
                justifyContent: 'center',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                background: 'transparent',
                border: '1px solid var(--bad-soft)',
                borderRadius: 'var(--r-xs)',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--bad)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.12s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bad-soft)'; e.currentTarget.style.borderColor = 'var(--bad)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--bad-soft)'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
              </svg>
              Excluir seleção
            </button>
          </div>
        </div>
      </aside>
    );
  }

  /* ── Render: seleção única (padrão com tabs) ─────────── */
  return (
    <aside style={{
      width: 256,
      flexShrink: 0,
      background: 'var(--surface)',
      borderLeft: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Tabs + botão colapso */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        flexShrink: 0,
        alignItems: 'stretch',
      }}>
        <div style={{ display: 'flex', flex: 1 }}>
          {tabs.map((tb) => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              style={{
                flex: 1,
                padding: '11px 0',
                background: 'transparent',
                border: 'none',
                borderBottom: tab === tb.id ? '2px solid var(--accent)' : '2px solid transparent',
                fontSize: 12,
                fontWeight: tab === tb.id ? 700 : 500,
                color: tab === tb.id ? 'var(--accent)' : 'var(--text-3)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'inherit',
                letterSpacing: '0.01em',
              }}
            >
              {tb.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 6px', borderLeft: '1px solid var(--border)' }}>
          <CollapseButton collapsed={false} onToggle={onToggleCollapse} />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'element' && (
          <>
            {el && (
              <>
                {/* Quick actions */}
                <div style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 4,
                  background: 'var(--surface-2)',
                }}>
                  <ActionBtn onClick={() => onBringToFront?.(el.id)} title="Trazer para frente">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                    Frente
                  </ActionBtn>
                  <ActionBtn onClick={() => onSendToBack?.(el.id)} title="Enviar para o fundo">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                    Fundo
                  </ActionBtn>
                  <ActionBtn onClick={() => onDuplicateElement?.(el.id)} title="Duplicar (Ctrl+D)">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Copiar
                  </ActionBtn>
                  <ActionBtn onClick={() => onRemoveElement?.(el.id)} title="Excluir (Del)" danger>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                    Excluir
                  </ActionBtn>
                </div>

                {/* Type indicator */}
                <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="tag tag-accent" style={{ fontSize: 10.5, padding: '1px 7px' }}>
                    {el.type === 'text' ? 'Texto' : el.type === 'image' ? 'Imagem' : el.type === 'shape' ? 'Forma' : el.type === 'icon' ? 'Ícone' : 'Tabela'}
                  </span>
                  {el.locked && <span className="tag tag-warn" style={{ fontSize: 10.5, padding: '1px 7px' }}>Bloqueado</span>}
                </div>

                <CommonProperties el={el} onChange={(updater) => onUpdateElement(el.id, updater)} />
                {el.type === 'text' && <TextProperties el={el as TextElement} onChange={(updater) => onUpdateElement(el.id, updater)} />}
                {el.type === 'image' && (
                  <ImageProperties
                    el={el as ImageElement}
                    onChange={(updater) => onUpdateElement(el.id, updater)}
                    onUpdate={(props) => onUpdateElement(el.id, (e) => ({ ...e, ...props } as ImageElement))}
                  />
                )}
                {el.type === 'shape' && <ShapeProperties el={el as ShapeElement} onChange={(updater) => onUpdateElement(el.id, updater)} />}
                {el.type === 'icon' && <IconProperties el={el as IconElement} onChange={(updater) => onUpdateElement(el.id, updater)} />}
              </>
            )}
          </>
        )}

        {tab === 'slide' && slide && <SlideProperties slide={slide} onUpdateSlide={onUpdateSlide} />}
        {tab === 'theme' && <ThemeProperties presentation={presentation} onSetTheme={onSetTheme} />}
      </div>
    </aside>
  );
}
