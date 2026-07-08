'use client';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'vizu_onboarding_seen';

interface Step {
  target: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    target: 'new-presentation',
    title: '1 de 3 · Comece por aqui',
    body: 'Crie uma apresentação em branco ou escolha um template pronto para começar mais rápido.',
  },
  {
    target: 'ai-wizard',
    title: '2 de 3 · Gere com IA',
    body: 'Cole seus dados — texto, tópicos ou números — e deixe a IA montar os slides. É o fluxo principal da Vizu.',
  },
  {
    target: 'templates-nav',
    title: '3 de 3 · Modelos prontos',
    body: 'Explore a galeria de templates, incluindo o tema Institucional Gerdau, pronto para apresentações corporativas.',
  },
];

export function resetOnboarding(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function Onboarding() {
  const [step, setStep] = useState(-1);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    const timer = setTimeout(() => setStep(0), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (step < 0 || step >= STEPS.length) return;

    const measure = () => {
      const el = document.querySelector(`[data-onboarding="${STEPS[step].target}"]`);
      if (el) setRect(el.getBoundingClientRect());
      else finish();
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function finish() {
    localStorage.setItem(STORAGE_KEY, '1');
    setStep(-1);
    setRect(null);
  }

  function next() {
    if (step + 1 >= STEPS.length) finish();
    else setStep(step + 1);
  }

  if (step < 0 || !rect) return null;
  const current = STEPS[step];

  const tooltipLeft = Math.min(rect.right + 16, window.innerWidth - 300);
  const tooltipTop = Math.min(Math.max(rect.top, 16), window.innerHeight - 180);

  return (
    <>
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: rect.top - 4,
          left: rect.left - 4,
          width: rect.width + 8,
          height: rect.height + 8,
          borderRadius: 10,
          border: '2px solid var(--sidebar-accent, #6366f1)',
          boxShadow: '0 0 0 4000px rgba(10,15,25,0.55)',
          pointerEvents: 'none',
          zIndex: 201,
          transition: 'top 0.2s ease, left 0.2s ease, width 0.2s ease, height 0.2s ease',
        }}
      />
      <div
        role="dialog"
        aria-label="Onboarding"
        style={{
          position: 'fixed',
          top: tooltipTop,
          left: tooltipLeft,
          width: 280,
          background: 'var(--surface, #fff)',
          color: 'var(--text, #0f172a)',
          borderRadius: 12,
          padding: '16px 18px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.28)',
          border: '1px solid var(--border, rgba(0,0,0,0.08))',
          zIndex: 202,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', opacity: 0.55, marginBottom: 6 }}>
          {current.title}
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.85, marginBottom: 14 }}>
          {current.body}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <button
            onClick={finish}
            style={{ fontSize: 12, opacity: 0.6, background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}
          >
            Pular
          </button>
          <button onClick={next} className="btn btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}>
            {step + 1 >= STEPS.length ? 'Concluir' : 'Próximo'}
          </button>
        </div>
      </div>
    </>
  );
}
