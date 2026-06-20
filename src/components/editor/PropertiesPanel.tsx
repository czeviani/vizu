'use client';
import { useState } from 'react';
import type {
  Slide, SlideElement, TextElement, ShapeElement,
  ImageElement, IconElement, Theme, Presentation, TableElement,
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
}

type Tab = 'element' | 'slide' | 'theme';

const actionBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 4,
  padding: '4px 8px', background: 'transparent',
  border: '1px solid var(--border)', borderRadius: 5,
  fontSize: 11, color: 'var(--text)', cursor: 'pointer',
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 500 }}>
      {children}
    </label>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ marginBottom: 14 }}>{children}</div>;
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const safeHex = value.startsWith('#') ? value : '#000000';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, border: '1.5px solid var(--border)', background: value, flexShrink: 0, overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
        <input
          type="color"
          value={safeHex}
          onChange={(e) => onChange(e.target.value)}
          style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
        />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ flex: 1, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, background: 'var(--bg)', color: 'var(--text)', outline: 'none', fontFamily: 'monospace' }}
      />
    </div>
  );
}

function NumberInput({ value, onChange, min, max, step = 1, suffix }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <input
        type="number"
        value={Math.round(value * 10) / 10}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min} max={max} step={step}
        style={{ flex: 1, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, background: 'var(--bg)', color: 'var(--text)', outline: 'none' }}
      />
      {suffix && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{suffix}</span>}
    </div>
  );
}

function SelectInput({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: '100%', padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, background: 'var(--bg)', color: 'var(--text)', outline: 'none', cursor: 'pointer' }}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text)', textAlign: 'left' }}
      >
        {title}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && <div style={{ padding: '0 14px 14px' }}>{children}</div>}
    </div>
  );
}

function TextProperties({ el, onChange }: { el: TextElement; onChange: (updater: (e: SlideElement) => SlideElement) => void }) {
  const upd = (props: Partial<TextElement>) => onChange((e) => ({ ...e, ...props } as TextElement));
  const updStyle = (props: Partial<TextElement['style']>) =>
    onChange((e) => ({ ...e, style: { ...(e as TextElement).style, ...props } } as TextElement));

  return (
    <>
      <Section title={t.sec_typography}>
        <Row>
          <Label>{t.lbl_font}</Label>
          <SelectInput value={el.style.fontFamily} onChange={(v) => updStyle({ fontFamily: v })} options={[
            { value: 'Inter', label: 'Inter' }, { value: 'Manrope', label: 'Manrope' },
            { value: 'Georgia', label: 'Georgia' }, { value: 'Times New Roman', label: 'Times New Roman' },
            { value: 'Arial', label: 'Arial' }, { value: 'Helvetica Neue', label: 'Helvetica Neue' },
            { value: 'Courier New', label: 'Courier New' },
          ]} />
        </Row>
        <Row>
          <Label>{t.lbl_size}</Label>
          <NumberInput value={el.style.fontSize} onChange={(v) => updStyle({ fontSize: v })} min={6} max={200} suffix="px" />
        </Row>
        <Row>
          <Label>{t.lbl_weight}</Label>
          <SelectInput value={String(el.style.fontWeight)} onChange={(v) => updStyle({ fontWeight: Number(v) })} options={[
            { value: '300', label: t.opt_light }, { value: '400', label: t.opt_regular },
            { value: '500', label: t.opt_medium }, { value: '600', label: t.opt_semibold },
            { value: '700', label: t.opt_bold }, { value: '800', label: t.opt_extrabold },
          ]} />
        </Row>
        <Row>
          <Label>{t.lbl_color}</Label>
          <ColorInput value={el.style.color} onChange={(v) => updStyle({ color: v })} />
        </Row>
        <Row>
          <Label>{t.lbl_align}</Label>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['left', 'center', 'right', 'justify'] as const).map((a) => (
              <button
                key={a}
                onClick={() => updStyle({ textAlign: a })}
                style={{
                  flex: 1, padding: '5px 0',
                  border: `1.5px solid ${el.style.textAlign === a ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 5,
                  background: el.style.textAlign === a ? 'var(--accent-subtle)' : 'transparent',
                  cursor: 'pointer', color: 'var(--text)', fontSize: 11,
                }}
              >
                {a === 'left' ? 'E' : a === 'center' ? 'C' : a === 'right' ? 'D' : 'J'}
              </button>
            ))}
          </div>
        </Row>
        <Row>
          <Label>{t.lbl_style}</Label>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => updStyle({ fontStyle: el.style.fontStyle === 'italic' ? 'normal' : 'italic' })}
              style={{ padding: '5px 10px', border: `1.5px solid ${el.style.fontStyle === 'italic' ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 5, background: el.style.fontStyle === 'italic' ? 'var(--accent-subtle)' : 'transparent', cursor: 'pointer', color: 'var(--text)', fontSize: 13, fontStyle: 'italic' }}
            >
              I
            </button>
            <button
              onClick={() => updStyle({ textDecoration: el.style.textDecoration === 'underline' ? 'none' : 'underline' })}
              style={{ padding: '5px 10px', border: `1.5px solid ${el.style.textDecoration === 'underline' ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 5, background: el.style.textDecoration === 'underline' ? 'var(--accent-subtle)' : 'transparent', cursor: 'pointer', color: 'var(--text)', fontSize: 13, textDecoration: 'underline' }}
            >
              U
            </button>
          </div>
        </Row>
        <Row>
          <Label>{t.lbl_line_height}</Label>
          <NumberInput value={el.style.lineHeight} onChange={(v) => updStyle({ lineHeight: v })} min={0.8} max={4} step={0.05} />
        </Row>
        <Row>
          <Label>{t.lbl_spacing}</Label>
          <NumberInput value={el.style.letterSpacing} onChange={(v) => updStyle({ letterSpacing: v })} min={-5} max={20} step={0.1} suffix="px" />
        </Row>
      </Section>
      <Section title={t.sec_box}>
        <Row>
          <Label>{t.lbl_bg}</Label>
          <ColorInput value={el.background} onChange={(v) => upd({ background: v })} />
        </Row>
        <Row>
          <Label>{t.lbl_padding}</Label>
          <NumberInput value={el.padding} onChange={(v) => upd({ padding: v })} min={0} max={80} suffix="px" />
        </Row>
        <Row>
          <Label>{t.lbl_valign}</Label>
          <SelectInput value={el.verticalAlign} onChange={(v) => upd({ verticalAlign: v as TextElement['verticalAlign'] })} options={[
            { value: 'top', label: t.opt_top }, { value: 'middle', label: t.opt_middle }, { value: 'bottom', label: t.opt_bottom },
          ]} />
        </Row>
      </Section>
    </>
  );
}

function ImageProperties({ el, onChange }: { el: ImageElement; onChange: (updater: (e: SlideElement) => SlideElement) => void }) {
  const upd = (props: Partial<ImageElement>) => onChange((e) => ({ ...e, ...props } as ImageElement));

  return (
    <>
      <Section title={t.sec_image}>
        <Row>
          <Label>{t.lbl_url}</Label>
          <input
            type="text" value={el.src}
            onChange={(e) => upd({ src: e.target.value })}
            placeholder="https://…"
            style={{ width: '100%', padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, background: 'var(--bg)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
          />
        </Row>
        <Row>
          <Label>{t.lbl_fit}</Label>
          <SelectInput value={el.objectFit} onChange={(v) => upd({ objectFit: v as 'cover' | 'contain' | 'fill' })} options={[
            { value: 'cover', label: t.opt_cover }, { value: 'contain', label: t.opt_contain }, { value: 'fill', label: t.opt_fill },
          ]} />
        </Row>
        <Row>
          <Label>{t.lbl_alt}</Label>
          <input
            type="text" value={el.alt}
            onChange={(e) => upd({ alt: e.target.value })}
            placeholder="Descrição"
            style={{ width: '100%', padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, background: 'var(--bg)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
          />
        </Row>
      </Section>
      <Section title={t.sec_border}>
        <Row>
          <Label>{t.lbl_radius}</Label>
          <NumberInput value={el.border.radius} onChange={(v) => upd({ border: { ...el.border, radius: v } })} min={0} max={200} suffix="px" />
        </Row>
        <Row>
          <Label>{t.lbl_border_width}</Label>
          <NumberInput value={el.border.width} onChange={(v) => upd({ border: { ...el.border, width: v } })} min={0} max={20} suffix="px" />
        </Row>
        {el.border.width > 0 && (
          <Row>
            <Label>{t.lbl_color}</Label>
            <ColorInput value={el.border.color || '#000000'} onChange={(v) => upd({ border: { ...el.border, color: v } })} />
          </Row>
        )}
      </Section>
    </>
  );
}

function ShapeProperties({ el, onChange }: { el: ShapeElement; onChange: (updater: (e: SlideElement) => SlideElement) => void }) {
  const upd = (props: Partial<ShapeElement>) => onChange((e) => ({ ...e, ...props } as ShapeElement));

  return (
    <>
      <Section title={t.sec_fill}>
        <Row>
          <Label>{t.lbl_color}</Label>
          <ColorInput value={el.fill} onChange={(v) => upd({ fill: v })} />
        </Row>
      </Section>
      <Section title={t.sec_border}>
        <Row>
          <Label>{t.lbl_border_width}</Label>
          <NumberInput value={el.border.width} onChange={(v) => upd({ border: { ...el.border, width: v } })} min={0} max={20} suffix="px" />
        </Row>
        <Row>
          <Label>{t.lbl_color}</Label>
          <ColorInput value={el.border.color || '#000000'} onChange={(v) => upd({ border: { ...el.border, color: v } })} />
        </Row>
        <Row>
          <Label>{t.lbl_style}</Label>
          <SelectInput value={el.border.style} onChange={(v) => upd({ border: { ...el.border, style: v as 'solid' | 'dashed' | 'dotted' | 'none' } })} options={[
            { value: 'none', label: t.opt_none }, { value: 'solid', label: t.opt_solid },
            { value: 'dashed', label: t.opt_dashed }, { value: 'dotted', label: t.opt_dotted },
          ]} />
        </Row>
        <Row>
          <Label>{t.lbl_radius}</Label>
          <NumberInput value={el.border.radius} onChange={(v) => upd({ border: { ...el.border, radius: v } })} min={0} max={200} suffix="px" />
        </Row>
      </Section>
      <Section title={t.sec_shadow}>
        <Row>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={el.shadow.enabled} onChange={(e) => upd({ shadow: { ...el.shadow, enabled: e.target.checked } })} />
            <Label>{t.lbl_enable_shadow}</Label>
          </div>
        </Row>
        {el.shadow.enabled && (
          <>
            <Row><Label>{t.lbl_offset_x}</Label><NumberInput value={el.shadow.x} onChange={(v) => upd({ shadow: { ...el.shadow, x: v } })} min={-50} max={50} suffix="px" /></Row>
            <Row><Label>{t.lbl_offset_y}</Label><NumberInput value={el.shadow.y} onChange={(v) => upd({ shadow: { ...el.shadow, y: v } })} min={-50} max={50} suffix="px" /></Row>
            <Row><Label>{t.lbl_blur}</Label><NumberInput value={el.shadow.blur} onChange={(v) => upd({ shadow: { ...el.shadow, blur: v } })} min={0} max={100} suffix="px" /></Row>
            <Row><Label>{t.lbl_color}</Label><ColorInput value={el.shadow.color} onChange={(v) => upd({ shadow: { ...el.shadow, color: v } })} /></Row>
          </>
        )}
      </Section>
    </>
  );
}

function CommonProperties({ el, onChange }: { el: SlideElement; onChange: (updater: (e: SlideElement) => SlideElement) => void }) {
  const upd = (props: Partial<SlideElement>) => onChange((e) => ({ ...e, ...props } as SlideElement));

  return (
    <Section title={t.sec_position}>
      <Row>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div><Label>{t.lbl_x}</Label><NumberInput value={el.x} onChange={(v) => upd({ x: v })} suffix="px" /></div>
          <div><Label>{t.lbl_y}</Label><NumberInput value={el.y} onChange={(v) => upd({ y: v })} suffix="px" /></div>
        </div>
      </Row>
      <Row>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div><Label>{t.lbl_w}</Label><NumberInput value={el.width} onChange={(v) => upd({ width: Math.max(8, v) })} min={8} suffix="px" /></div>
          <div><Label>{t.lbl_h}</Label><NumberInput value={el.height} onChange={(v) => upd({ height: Math.max(8, v) })} min={8} suffix="px" /></div>
        </div>
      </Row>
      <Row><Label>{t.lbl_rotation}</Label><NumberInput value={el.rotation} onChange={(v) => upd({ rotation: v })} min={-360} max={360} suffix="°" /></Row>
      <Row>
        <Label>{t.lbl_opacity}</Label>
        <input type="range" min={0} max={1} step={0.01} value={el.opacity} onChange={(e) => upd({ opacity: parseFloat(e.target.value) })} style={{ width: '100%' }} />
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{Math.round(el.opacity * 100)}%</span>
      </Row>
      <Row>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={el.locked} onChange={(e) => upd({ locked: e.target.checked })} />
          <Label>{t.lbl_locked}</Label>
        </div>
      </Row>
      <Row>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={el.visible} onChange={(e) => upd({ visible: e.target.checked })} />
          <Label>{t.lbl_visible}</Label>
        </div>
      </Row>
      <Row><Label>{t.lbl_zindex}</Label><NumberInput value={el.zIndex} onChange={(v) => upd({ zIndex: Math.round(v) })} min={0} max={1000} /></Row>
    </Section>
  );
}

function SlideProperties({ slide, onUpdateSlide }: { slide: Slide; onUpdateSlide: (updater: (s: Slide) => Slide) => void }) {
  const bg = slide.background;
  const updBg = (props: Partial<typeof bg>) =>
    onUpdateSlide((s) => ({ ...s, background: { ...s.background, ...props } }));

  return (
    <Section title={t.sec_background}>
      <Row>
        <Label>{t.lbl_type}</Label>
        <SelectInput value={bg.type} onChange={(v) => updBg({ type: v as 'color' | 'gradient' | 'image' })} options={[
          { value: 'color', label: t.opt_solid_color }, { value: 'gradient', label: t.opt_gradient }, { value: 'image', label: t.opt_image_url },
        ]} />
      </Row>
      {bg.type === 'color' && (
        <Row><Label>{t.lbl_color}</Label><ColorInput value={bg.color ?? '#ffffff'} onChange={(v) => updBg({ color: v })} /></Row>
      )}
      {bg.type === 'gradient' && (
        <>
          <Row><Label>{t.lbl_from}</Label><ColorInput value={bg.gradient?.from ?? '#3b82f6'} onChange={(v) => updBg({ gradient: { ...bg.gradient!, from: v } })} /></Row>
          <Row><Label>{t.lbl_to}</Label><ColorInput value={bg.gradient?.to ?? '#8b5cf6'} onChange={(v) => updBg({ gradient: { ...bg.gradient!, to: v } })} /></Row>
          <Row><Label>{t.lbl_direction}</Label><NumberInput value={bg.gradient?.direction ?? 135} onChange={(v) => updBg({ gradient: { ...bg.gradient!, direction: v } })} min={0} max={360} suffix="°" /></Row>
        </>
      )}
      {bg.type === 'image' && (
        <Row>
          <Label>{t.lbl_url}</Label>
          <input
            type="text" value={bg.image ?? ''}
            onChange={(e) => updBg({ image: e.target.value })}
            placeholder="https://…"
            style={{ width: '100%', padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, background: 'var(--bg)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
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
    [t.clr_primary, 'primary'], [t.clr_secondary, 'secondary'], [t.clr_accent, 'accent'],
    [t.clr_background, 'background'], [t.clr_surface, 'surface'], [t.clr_text, 'text'],
    [t.clr_text_sec, 'textSecondary'], [t.clr_border, 'border'],
  ];

  return (
    <>
      <Section title={t.sec_preset_themes}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {DEFAULT_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onSetTheme(theme)}
              style={{ padding: 10, border: `2px solid ${th.id === theme.id ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 8, background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                {[theme.colors.primary, theme.colors.secondary, theme.colors.accent].map((c) => (
                  <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
                ))}
              </div>
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text)' }}>{theme.name}</span>
            </button>
          ))}
        </div>
      </Section>
      <Section title={t.sec_custom_colors}>
        {colorLabels.map(([label, key]) => (
          <Row key={key}>
            <Label>{label}</Label>
            <ColorInput value={th.colors[key]} onChange={(v) => updColors({ [key]: v })} />
          </Row>
        ))}
      </Section>
      <Section title={t.sec_typography}>
        <Row>
          <Label>{t.lbl_heading_font}</Label>
          <SelectInput value={th.fonts.heading} onChange={(v) => onSetTheme({ ...th, fonts: { ...th.fonts, heading: v } })} options={[
            { value: 'Inter', label: 'Inter' }, { value: 'Manrope', label: 'Manrope' },
            { value: 'Georgia', label: 'Georgia' }, { value: 'Arial', label: 'Arial' },
          ]} />
        </Row>
        <Row>
          <Label>{t.lbl_body_font}</Label>
          <SelectInput value={th.fonts.body} onChange={(v) => onSetTheme({ ...th, fonts: { ...th.fonts, body: v } })} options={[
            { value: 'Inter', label: 'Inter' }, { value: 'Manrope', label: 'Manrope' },
            { value: 'Georgia', label: 'Georgia' }, { value: 'Arial', label: 'Arial' },
          ]} />
        </Row>
      </Section>
    </>
  );
}

export function PropertiesPanel({
  presentation, slide, selectedElements,
  onUpdateElement, onUpdateSlide, onSetTheme,
  onDuplicateElement, onRemoveElement, onBringToFront, onSendToBack,
}: Props) {
  const [tab, setTab] = useState<Tab>('element');
  const el = selectedElements.length === 1 ? selectedElements[0] : null;

  const tabStyle = (tabId: Tab): React.CSSProperties => ({
    flex: 1, padding: '8px 0', background: 'transparent', border: 'none',
    borderBottom: tab === tabId ? '2px solid var(--accent)' : '2px solid transparent',
    fontSize: 12, fontWeight: tab === tabId ? 600 : 400,
    color: tab === tabId ? 'var(--accent)' : 'var(--text-secondary)',
    cursor: 'pointer', transition: 'all 0.15s',
  });

  return (
    <aside style={{
      width: 248, flexShrink: 0, background: 'var(--panel-bg)',
      borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        <button style={tabStyle('element')} onClick={() => setTab('element')}>{t.panel_element}</button>
        <button style={tabStyle('slide')} onClick={() => setTab('slide')}>{t.panel_slide}</button>
        <button style={tabStyle('theme')} onClick={() => setTab('theme')}>{t.panel_theme}</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'element' && (
          <>
            {!el && (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 8px', display: 'block' }}>
                  <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
                </svg>
                {t.panel_no_selection}
              </div>
            )}
            {el && (
              <>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  <button onClick={() => onBringToFront?.(el.id)} title={t.act_front} style={actionBtnStyle}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
                    {t.act_front}
                  </button>
                  <button onClick={() => onSendToBack?.(el.id)} title={t.act_back} style={actionBtnStyle}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
                    {t.act_back}
                  </button>
                  <button onClick={() => onDuplicateElement?.(el.id)} title={`${t.act_copy} (Ctrl+D)`} style={actionBtnStyle}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                    {t.act_copy}
                  </button>
                  <button onClick={() => onRemoveElement?.(el.id)} title={t.act_delete} style={{ ...actionBtnStyle, color: '#ef4444' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                    {t.act_delete}
                  </button>
                </div>
                <CommonProperties el={el} onChange={(updater) => onUpdateElement(el.id, updater)} />
                {el.type === 'text' && <TextProperties el={el as TextElement} onChange={(updater) => onUpdateElement(el.id, updater)} />}
                {el.type === 'image' && <ImageProperties el={el as ImageElement} onChange={(updater) => onUpdateElement(el.id, updater)} />}
                {el.type === 'shape' && <ShapeProperties el={el as ShapeElement} onChange={(updater) => onUpdateElement(el.id, updater)} />}
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
