'use client';
import { useState } from 'react';
import type {
  Slide, SlideElement, TextElement, ShapeElement,
  ImageElement, IconElement, Theme, Presentation, TableElement,
} from '@/types/slide';
import { DEFAULT_THEMES } from '@/lib/themes';

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
}

type Tab = 'element' | 'slide' | 'theme';

const actionBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 8px',
  background: 'transparent',
  border: '1px solid var(--border)',
  borderRadius: 5,
  fontSize: 11,
  color: 'var(--text)',
  cursor: 'pointer',
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        fontSize: 11,
        color: 'var(--text-secondary)',
        display: 'block',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontWeight: 500,
      }}
    >
      {children}
    </label>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>{children}</div>
  );
}

function ColorInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          border: '1.5px solid var(--border)',
          background: value,
          flexShrink: 0,
          overflow: 'hidden',
          position: 'relative',
          cursor: 'pointer',
        }}
      >
        <input
          type="color"
          value={value.startsWith('#') ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            width: '100%',
            height: '100%',
            cursor: 'pointer',
          }}
        />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1,
          padding: '4px 8px',
          border: '1px solid var(--border)',
          borderRadius: 6,
          fontSize: 12,
          background: 'var(--bg)',
          color: 'var(--text)',
          outline: 'none',
          fontFamily: 'monospace',
        }}
      />
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <input
        type="number"
        value={Math.round(value * 10) / 10}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min}
        max={max}
        step={step}
        style={{
          flex: 1,
          padding: '4px 8px',
          border: '1px solid var(--border)',
          borderRadius: 6,
          fontSize: 12,
          background: 'var(--bg)',
          color: 'var(--text)',
          outline: 'none',
        }}
      />
      {suffix && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{suffix}</span>}
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '5px 8px',
        border: '1px solid var(--border)',
        borderRadius: 6,
        fontSize: 12,
        background: 'var(--bg)',
        color: 'var(--text)',
        outline: 'none',
        cursor: 'pointer',
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          padding: '10px 14px',
          background: 'transparent',
          border: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text)',
          textAlign: 'left',
        }}
      >
        {title}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && <div style={{ padding: '0 14px 14px' }}>{children}</div>}
    </div>
  );
}

function TextProperties({
  el,
  onChange,
}: {
  el: TextElement;
  onChange: (updater: (e: SlideElement) => SlideElement) => void;
}) {
  const upd = (props: Partial<TextElement>) =>
    onChange((e) => ({ ...e, ...props } as TextElement));
  const updStyle = (props: Partial<TextElement['style']>) =>
    onChange((e) => ({ ...e, style: { ...(e as TextElement).style, ...props } } as TextElement));

  return (
    <>
      <Section title="Typography">
        <Row>
          <Label>Font Family</Label>
          <SelectInput
            value={el.style.fontFamily}
            onChange={(v) => updStyle({ fontFamily: v })}
            options={[
              { value: 'Inter', label: 'Inter' },
              { value: 'Manrope', label: 'Manrope' },
              { value: 'Georgia', label: 'Georgia' },
              { value: 'Times New Roman', label: 'Times New Roman' },
              { value: 'Arial', label: 'Arial' },
              { value: 'Helvetica Neue', label: 'Helvetica Neue' },
              { value: 'Courier New', label: 'Courier New' },
            ]}
          />
        </Row>
        <Row>
          <Label>Size</Label>
          <NumberInput value={el.style.fontSize} onChange={(v) => updStyle({ fontSize: v })} min={6} max={200} suffix="px" />
        </Row>
        <Row>
          <Label>Weight</Label>
          <SelectInput
            value={String(el.style.fontWeight)}
            onChange={(v) => updStyle({ fontWeight: Number(v) })}
            options={[
              { value: '300', label: 'Light' },
              { value: '400', label: 'Regular' },
              { value: '500', label: 'Medium' },
              { value: '600', label: 'Semibold' },
              { value: '700', label: 'Bold' },
              { value: '800', label: 'Extrabold' },
            ]}
          />
        </Row>
        <Row>
          <Label>Color</Label>
          <ColorInput value={el.style.color} onChange={(v) => updStyle({ color: v })} />
        </Row>
        <Row>
          <Label>Alignment</Label>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['left', 'center', 'right', 'justify'] as const).map((a) => (
              <button
                key={a}
                onClick={() => updStyle({ textAlign: a })}
                style={{
                  flex: 1,
                  padding: '5px 0',
                  border: `1.5px solid ${el.style.textAlign === a ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 5,
                  background: el.style.textAlign === a ? 'var(--accent-subtle)' : 'transparent',
                  cursor: 'pointer',
                  color: 'var(--text)',
                  fontSize: 11,
                }}
              >
                {a[0].toUpperCase()}
              </button>
            ))}
          </div>
        </Row>
        <Row>
          <Label>Style</Label>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => updStyle({ fontStyle: el.style.fontStyle === 'italic' ? 'normal' : 'italic' })}
              style={{
                padding: '5px 10px',
                border: `1.5px solid ${el.style.fontStyle === 'italic' ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 5,
                background: el.style.fontStyle === 'italic' ? 'var(--accent-subtle)' : 'transparent',
                cursor: 'pointer',
                color: 'var(--text)',
                fontSize: 13,
                fontStyle: 'italic',
              }}
            >
              I
            </button>
            <button
              onClick={() => updStyle({ textDecoration: el.style.textDecoration === 'underline' ? 'none' : 'underline' })}
              style={{
                padding: '5px 10px',
                border: `1.5px solid ${el.style.textDecoration === 'underline' ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 5,
                background: el.style.textDecoration === 'underline' ? 'var(--accent-subtle)' : 'transparent',
                cursor: 'pointer',
                color: 'var(--text)',
                fontSize: 13,
                textDecoration: 'underline',
              }}
            >
              U
            </button>
          </div>
        </Row>
        <Row>
          <Label>Line Height</Label>
          <NumberInput value={el.style.lineHeight} onChange={(v) => updStyle({ lineHeight: v })} min={0.8} max={4} step={0.05} />
        </Row>
        <Row>
          <Label>Letter Spacing</Label>
          <NumberInput value={el.style.letterSpacing} onChange={(v) => updStyle({ letterSpacing: v })} min={-5} max={20} step={0.1} suffix="px" />
        </Row>
      </Section>
      <Section title="Box">
        <Row>
          <Label>Background</Label>
          <ColorInput value={el.background} onChange={(v) => upd({ background: v })} />
        </Row>
        <Row>
          <Label>Padding</Label>
          <NumberInput value={el.padding} onChange={(v) => upd({ padding: v })} min={0} max={80} suffix="px" />
        </Row>
        <Row>
          <Label>Vertical Align</Label>
          <SelectInput
            value={el.verticalAlign}
            onChange={(v) => upd({ verticalAlign: v as TextElement['verticalAlign'] })}
            options={[
              { value: 'top', label: 'Top' },
              { value: 'middle', label: 'Middle' },
              { value: 'bottom', label: 'Bottom' },
            ]}
          />
        </Row>
      </Section>
    </>
  );
}

function ImageProperties({
  el,
  onChange,
}: {
  el: ImageElement;
  onChange: (updater: (e: SlideElement) => SlideElement) => void;
}) {
  const upd = (props: Partial<ImageElement>) =>
    onChange((e) => ({ ...e, ...props } as ImageElement));

  return (
    <>
      <Section title="Image">
        <Row>
          <Label>URL</Label>
          <input
            type="text"
            value={el.src}
            onChange={(e) => upd({ src: e.target.value })}
            placeholder="https://..."
            style={{ width: '100%', padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, background: 'var(--bg)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
          />
        </Row>
        <Row>
          <Label>Fit</Label>
          <SelectInput
            value={el.objectFit}
            onChange={(v) => upd({ objectFit: v as 'cover' | 'contain' | 'fill' })}
            options={[
              { value: 'cover', label: 'Cover' },
              { value: 'contain', label: 'Contain' },
              { value: 'fill', label: 'Fill' },
            ]}
          />
        </Row>
        <Row>
          <Label>Alt Text</Label>
          <input
            type="text"
            value={el.alt}
            onChange={(e) => upd({ alt: e.target.value })}
            placeholder="Description"
            style={{ width: '100%', padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, background: 'var(--bg)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
          />
        </Row>
      </Section>
      <Section title="Border">
        <Row>
          <Label>Radius</Label>
          <NumberInput value={el.border.radius} onChange={(v) => upd({ border: { ...el.border, radius: v } })} min={0} max={200} suffix="px" />
        </Row>
        <Row>
          <Label>Width</Label>
          <NumberInput value={el.border.width} onChange={(v) => upd({ border: { ...el.border, width: v } })} min={0} max={20} suffix="px" />
        </Row>
        {el.border.width > 0 && (
          <Row>
            <Label>Color</Label>
            <ColorInput value={el.border.color || '#000000'} onChange={(v) => upd({ border: { ...el.border, color: v } })} />
          </Row>
        )}
      </Section>
    </>
  );
}

function ShapeProperties({
  el,
  onChange,
}: {
  el: ShapeElement;
  onChange: (updater: (e: SlideElement) => SlideElement) => void;
}) {
  const upd = (props: Partial<ShapeElement>) =>
    onChange((e) => ({ ...e, ...props } as ShapeElement));

  return (
    <>
      <Section title="Fill">
        <Row>
          <Label>Color</Label>
          <ColorInput value={el.fill} onChange={(v) => upd({ fill: v })} />
        </Row>
      </Section>
      <Section title="Border">
        <Row>
          <Label>Width</Label>
          <NumberInput value={el.border.width} onChange={(v) => upd({ border: { ...el.border, width: v } })} min={0} max={20} suffix="px" />
        </Row>
        <Row>
          <Label>Color</Label>
          <ColorInput value={el.border.color || '#000000'} onChange={(v) => upd({ border: { ...el.border, color: v } })} />
        </Row>
        <Row>
          <Label>Style</Label>
          <SelectInput
            value={el.border.style}
            onChange={(v) => upd({ border: { ...el.border, style: v as 'solid' | 'dashed' | 'dotted' | 'none' } })}
            options={[
              { value: 'none', label: 'None' },
              { value: 'solid', label: 'Solid' },
              { value: 'dashed', label: 'Dashed' },
              { value: 'dotted', label: 'Dotted' },
            ]}
          />
        </Row>
        <Row>
          <Label>Radius</Label>
          <NumberInput value={el.border.radius} onChange={(v) => upd({ border: { ...el.border, radius: v } })} min={0} max={200} suffix="px" />
        </Row>
      </Section>
      <Section title="Shadow">
        <Row>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={el.shadow.enabled}
              onChange={(e) => upd({ shadow: { ...el.shadow, enabled: e.target.checked } })}
            />
            <Label>Enable Shadow</Label>
          </div>
        </Row>
        {el.shadow.enabled && (
          <>
            <Row>
              <Label>Offset X</Label>
              <NumberInput value={el.shadow.x} onChange={(v) => upd({ shadow: { ...el.shadow, x: v } })} min={-50} max={50} suffix="px" />
            </Row>
            <Row>
              <Label>Offset Y</Label>
              <NumberInput value={el.shadow.y} onChange={(v) => upd({ shadow: { ...el.shadow, y: v } })} min={-50} max={50} suffix="px" />
            </Row>
            <Row>
              <Label>Blur</Label>
              <NumberInput value={el.shadow.blur} onChange={(v) => upd({ shadow: { ...el.shadow, blur: v } })} min={0} max={100} suffix="px" />
            </Row>
            <Row>
              <Label>Color</Label>
              <ColorInput value={el.shadow.color} onChange={(v) => upd({ shadow: { ...el.shadow, color: v } })} />
            </Row>
          </>
        )}
      </Section>
    </>
  );
}

function CommonProperties({
  el,
  onChange,
}: {
  el: SlideElement;
  onChange: (updater: (e: SlideElement) => SlideElement) => void;
}) {
  const upd = (props: Partial<SlideElement>) =>
    onChange((e) => ({ ...e, ...props } as SlideElement));

  return (
    <Section title="Position & Size">
      <Row>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <Label>X</Label>
            <NumberInput value={el.x} onChange={(v) => upd({ x: v })} suffix="px" />
          </div>
          <div>
            <Label>Y</Label>
            <NumberInput value={el.y} onChange={(v) => upd({ y: v })} suffix="px" />
          </div>
        </div>
      </Row>
      <Row>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <Label>W</Label>
            <NumberInput value={el.width} onChange={(v) => upd({ width: Math.max(8, v) })} min={8} suffix="px" />
          </div>
          <div>
            <Label>H</Label>
            <NumberInput value={el.height} onChange={(v) => upd({ height: Math.max(8, v) })} min={8} suffix="px" />
          </div>
        </div>
      </Row>
      <Row>
        <Label>Rotation</Label>
        <NumberInput value={el.rotation} onChange={(v) => upd({ rotation: v })} min={-360} max={360} suffix="°" />
      </Row>
      <Row>
        <Label>Opacity</Label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={el.opacity}
          onChange={(e) => upd({ opacity: parseFloat(e.target.value) })}
          style={{ width: '100%' }}
        />
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{Math.round(el.opacity * 100)}%</span>
      </Row>
      <Row>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={el.locked}
            onChange={(e) => upd({ locked: e.target.checked })}
          />
          <Label>Locked</Label>
        </div>
      </Row>
      <Row>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={el.visible}
            onChange={(e) => upd({ visible: e.target.checked })}
          />
          <Label>Visible</Label>
        </div>
      </Row>
      <Row>
        <Label>Z-Index</Label>
        <NumberInput value={el.zIndex} onChange={(v) => upd({ zIndex: Math.round(v) })} min={0} max={1000} />
      </Row>
    </Section>
  );
}

function SlideProperties({
  slide,
  onUpdateSlide,
}: {
  slide: Slide;
  onUpdateSlide: (updater: (s: Slide) => Slide) => void;
}) {
  const bg = slide.background;

  const updBg = (props: Partial<typeof bg>) =>
    onUpdateSlide((s) => ({ ...s, background: { ...s.background, ...props } }));

  return (
    <>
      <Section title="Background">
        <Row>
          <Label>Type</Label>
          <SelectInput
            value={bg.type}
            onChange={(v) => updBg({ type: v as 'color' | 'gradient' | 'image' })}
            options={[
              { value: 'color', label: 'Solid Color' },
              { value: 'gradient', label: 'Gradient' },
              { value: 'image', label: 'Image URL' },
            ]}
          />
        </Row>
        {bg.type === 'color' && (
          <Row>
            <Label>Color</Label>
            <ColorInput value={bg.color ?? '#ffffff'} onChange={(v) => updBg({ color: v })} />
          </Row>
        )}
        {bg.type === 'gradient' && (
          <>
            <Row>
              <Label>From</Label>
              <ColorInput value={bg.gradient?.from ?? '#3b82f6'} onChange={(v) => updBg({ gradient: { ...bg.gradient!, from: v } })} />
            </Row>
            <Row>
              <Label>To</Label>
              <ColorInput value={bg.gradient?.to ?? '#8b5cf6'} onChange={(v) => updBg({ gradient: { ...bg.gradient!, to: v } })} />
            </Row>
            <Row>
              <Label>Direction</Label>
              <NumberInput value={bg.gradient?.direction ?? 135} onChange={(v) => updBg({ gradient: { ...bg.gradient!, direction: v } })} min={0} max={360} suffix="°" />
            </Row>
          </>
        )}
        {bg.type === 'image' && (
          <Row>
            <Label>URL</Label>
            <input
              type="text"
              value={bg.image ?? ''}
              onChange={(e) => updBg({ image: e.target.value })}
              placeholder="https://..."
              style={{
                width: '100%',
                padding: '5px 8px',
                border: '1px solid var(--border)',
                borderRadius: 6,
                fontSize: 12,
                background: 'var(--bg)',
                color: 'var(--text)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </Row>
        )}
      </Section>
    </>
  );
}

function ThemeProperties({
  presentation,
  onSetTheme,
}: {
  presentation: Presentation;
  onSetTheme: (theme: Theme) => void;
}) {
  const t = presentation.theme;

  const updColors = (props: Partial<Theme['colors']>) =>
    onSetTheme({ ...t, colors: { ...t.colors, ...props } });

  return (
    <>
      <Section title="Preset Themes">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {DEFAULT_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onSetTheme(theme)}
              style={{
                padding: 10,
                border: `2px solid ${t.id === theme.id ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 8,
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                {[theme.colors.primary, theme.colors.secondary, theme.colors.accent].map((c) => (
                  <div
                    key={c}
                    style={{ width: 12, height: 12, borderRadius: '50%', background: c }}
                  />
                ))}
              </div>
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text)' }}>{theme.name}</span>
            </button>
          ))}
        </div>
      </Section>
      <Section title="Custom Colors">
        {(
          [
            ['Primary', 'primary'],
            ['Secondary', 'secondary'],
            ['Accent', 'accent'],
            ['Background', 'background'],
            ['Surface', 'surface'],
            ['Text', 'text'],
            ['Text Secondary', 'textSecondary'],
            ['Border', 'border'],
          ] as const
        ).map(([label, key]) => (
          <Row key={key}>
            <Label>{label}</Label>
            <ColorInput value={t.colors[key]} onChange={(v) => updColors({ [key]: v })} />
          </Row>
        ))}
      </Section>
      <Section title="Typography">
        <Row>
          <Label>Heading Font</Label>
          <SelectInput
            value={t.fonts.heading}
            onChange={(v) => onSetTheme({ ...t, fonts: { ...t.fonts, heading: v } })}
            options={[
              { value: 'Inter', label: 'Inter' },
              { value: 'Manrope', label: 'Manrope' },
              { value: 'Georgia', label: 'Georgia' },
              { value: 'Arial', label: 'Arial' },
            ]}
          />
        </Row>
        <Row>
          <Label>Body Font</Label>
          <SelectInput
            value={t.fonts.body}
            onChange={(v) => onSetTheme({ ...t, fonts: { ...t.fonts, body: v } })}
            options={[
              { value: 'Inter', label: 'Inter' },
              { value: 'Manrope', label: 'Manrope' },
              { value: 'Georgia', label: 'Georgia' },
              { value: 'Arial', label: 'Arial' },
            ]}
          />
        </Row>
      </Section>
    </>
  );
}

export function PropertiesPanel({
  presentation,
  slide,
  selectedElements,
  onUpdateElement,
  onUpdateSlide,
  onSetTheme,
  onDuplicateElement,
  onRemoveElement,
  onBringToFront,
  onSendToBack,
}: Props) {
  const [tab, setTab] = useState<Tab>('element');

  const el = selectedElements.length === 1 ? selectedElements[0] : null;

  const tabStyle = (t: Tab): React.CSSProperties => ({
    flex: 1,
    padding: '8px 0',
    background: 'transparent',
    border: 'none',
    borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
    fontSize: 12,
    fontWeight: tab === t ? 600 : 400,
    color: tab === t ? 'var(--accent)' : 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 0.15s',
  });

  return (
    <aside
      style={{
        width: 240,
        flexShrink: 0,
        background: 'var(--panel-bg)',
        borderLeft: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        <button style={tabStyle('element')} onClick={() => setTab('element')}>
          Element
        </button>
        <button style={tabStyle('slide')} onClick={() => setTab('slide')}>
          Slide
        </button>
        <button style={tabStyle('theme')} onClick={() => setTab('theme')}>
          Theme
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'element' && (
          <>
            {!el && (
              <div
                style={{
                  padding: 20,
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  style={{ margin: '0 auto 8px', display: 'block' }}
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
                Select an element to edit its properties
              </div>
            )}
            {el && (
              <>
                {/* Element actions */}
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  <button onClick={() => onBringToFront?.(el.id)} title="Bring to front" style={actionBtnStyle}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
                    Front
                  </button>
                  <button onClick={() => onSendToBack?.(el.id)} title="Send to back" style={actionBtnStyle}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
                    Back
                  </button>
                  <button onClick={() => onDuplicateElement?.(el.id)} title="Duplicate (Ctrl+D)" style={actionBtnStyle}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                    Copy
                  </button>
                  <button onClick={() => onRemoveElement?.(el.id)} title="Delete" style={{ ...actionBtnStyle, color: '#ef4444' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                    Delete
                  </button>
                </div>
                <CommonProperties
                  el={el}
                  onChange={(updater) => onUpdateElement(el.id, updater)}
                />
                {el.type === 'text' && (
                  <TextProperties
                    el={el as TextElement}
                    onChange={(updater) => onUpdateElement(el.id, updater)}
                  />
                )}
                {el.type === 'image' && (
                  <ImageProperties
                    el={el as ImageElement}
                    onChange={(updater) => onUpdateElement(el.id, updater)}
                  />
                )}
                {el.type === 'shape' && (
                  <ShapeProperties
                    el={el as ShapeElement}
                    onChange={(updater) => onUpdateElement(el.id, updater)}
                  />
                )}
              </>
            )}
          </>
        )}
        {tab === 'slide' && slide && (
          <SlideProperties slide={slide} onUpdateSlide={onUpdateSlide} />
        )}
        {tab === 'theme' && (
          <ThemeProperties presentation={presentation} onSetTheme={onSetTheme} />
        )}
      </div>
    </aside>
  );
}
