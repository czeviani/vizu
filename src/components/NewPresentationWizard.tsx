'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Presentation } from '@/types/slide';
import { DEFAULT_THEMES } from '@/lib/themes';
import { storage } from '@/lib/storage';
import type { PresentationType } from '@/lib/generateSlides';

interface Props {
  onClose: () => void;
  showToast: (message: string, type: 'ok' | 'bad' | 'info') => void;
}

const TYPE_OPTIONS: { id: PresentationType; label: string; hint: string }[] = [
  { id: 'relatorio', label: 'Relatório executivo', hint: 'Resultados, métricas, próximos passos' },
  { id: 'pitch', label: 'Pitch', hint: 'Problema, solução, proposta de valor' },
  { id: 'treinamento', label: 'Treinamento', hint: 'Conteúdo didático, passo a passo' },
  { id: 'outro', label: 'Outro', hint: 'Estrutura genérica' },
];

export function NewPresentationWizard({ onClose, showToast }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [rawText, setRawText] = useState('');
  const [title, setTitle] = useState('');
  const [presentationType, setPresentationType] = useState<PresentationType>('relatorio');
  const [slideCountHint, setSlideCountHint] = useState(8);
  const [themeId, setThemeId] = useState(DEFAULT_THEMES[0].id);
  const [generating, setGenerating] = useState(false);

  const canAdvance = rawText.trim().length >= 20;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || 'Nova Apresentação',
          rawText,
          presentationType,
          slideCountHint,
          themeId,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { presentation, source } = (await res.json()) as { presentation: Presentation; source: 'ai' | 'heuristic' };
      storage.set(presentation);
      showToast(
        source === 'ai' ? 'Deck gerado com IA' : 'Deck estruturado a partir dos dados (modo heurístico)',
        'ok'
      );
      router.push(`/editor/${presentation.id}`);
    } catch (err) {
      console.error('[NewPresentationWizard] geração falhou:', err);
      showToast('Não foi possível gerar a apresentação. Tente novamente.', 'bad');
      setGenerating(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget && !generating) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 620 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', margin: 0 }}>
              Gerar apresentação com IA
            </h2>
            <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 4 }}>Passo {step} de 2</div>
          </div>
          {!generating && (
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: 6, cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>

        {step === 1 && (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Título da apresentação
              </label>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                placeholder="Ex.: Revisão Trimestral Q3"
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Cole os dados iniciais
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="input"
                placeholder={'Cole texto livre, tópicos, uma lista com "-" ou markdown com "#" para títulos de seção...'}
                style={{ minHeight: 220, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
              />
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 6 }}>
                {rawText.trim().length} caracteres — mínimo 20 para continuar.
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={onClose} className="btn btn-ghost">Cancelar</button>
              <button onClick={() => setStep(2)} disabled={!canAdvance} className="btn btn-primary" style={{ opacity: canAdvance ? 1 : 0.5 }}>
                Continuar
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Tipo de apresentação
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setPresentationType(opt.id)}
                    disabled={generating}
                    style={{
                      padding: 12,
                      textAlign: 'left',
                      border: `2px solid ${presentationType === opt.id ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 'var(--r-md)',
                      background: presentationType === opt.id ? 'var(--accent-soft)' : 'var(--bg)',
                      cursor: generating ? 'default' : 'pointer',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: presentationType === opt.id ? 'var(--accent)' : 'var(--text)' }}>{opt.label}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>{opt.hint}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 18, display: 'flex', gap: 16, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Nº aproximado de slides
                </label>
                <input
                  type="number"
                  min={3}
                  max={20}
                  value={slideCountHint}
                  disabled={generating}
                  onChange={(e) => setSlideCountHint(Math.min(20, Math.max(3, Number(e.target.value) || 8)))}
                  className="input"
                />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Tema
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {DEFAULT_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setThemeId(theme.id)}
                    disabled={generating}
                    style={{
                      padding: 10,
                      border: `2px solid ${themeId === theme.id ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 'var(--r-md)',
                      background: themeId === theme.id ? 'var(--accent-soft)' : 'var(--bg)',
                      cursor: generating ? 'default' : 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ height: 28, borderRadius: 6, background: theme.colors.background, marginBottom: 6, border: '1px solid rgba(0,0,0,0.06)' }} />
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: themeId === theme.id ? 'var(--accent)' : 'var(--text-2)' }}>{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <button onClick={() => setStep(1)} disabled={generating} className="btn btn-ghost">Voltar</button>
              <button onClick={handleGenerate} disabled={generating} className="btn btn-primary" style={{ minWidth: 160, justifyContent: 'center' }}>
                {generating ? 'Gerando…' : 'Gerar apresentação'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
