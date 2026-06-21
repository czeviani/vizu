'use client';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface ContextMenuItem {
  label: string;
  shortcut?: string;
  icon?: React.ReactNode;
  action: () => void;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean; // se true, renderiza separador antes deste item
}

interface Props {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Fechar no Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Ajuste de posição de borda
  const menuWidth = 196;
  const estimatedHeight = items.length * 38 + 16;
  const adjustedX = x + menuWidth > window.innerWidth ? x - menuWidth : x;
  const adjustedY = y + estimatedHeight > window.innerHeight ? y - estimatedHeight : y;

  const menu = (
    <>
      {/* Overlay transparente para fechar ao clicar fora */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 999 }}
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      />
      {/* Menu */}
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          left: adjustedX,
          top: adjustedY,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          padding: '4px 0',
          minWidth: menuWidth,
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {items.map((item, i) => (
          <div key={i}>
            {item.separator && (
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
            )}
            {item.label && (
              <button
                onClick={() => { if (!item.disabled) { item.action(); onClose(); } }}
                disabled={item.disabled}
                style={{
                  width: '100%',
                  padding: '8px 14px',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  fontSize: 13,
                  fontWeight: 500,
                  color: item.disabled ? 'var(--text-3)' : item.danger ? 'var(--bad)' : 'var(--text-2)',
                  cursor: item.disabled ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  fontFamily: 'inherit',
                  opacity: item.disabled ? 0.5 : 1,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (!item.disabled) {
                    e.currentTarget.style.background = item.danger ? 'var(--bad-soft)' : 'var(--surface-2)';
                  }
                }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {item.icon && (
                    <span style={{ color: item.danger ? 'var(--bad)' : 'var(--text-3)', display: 'flex' }}>
                      {item.icon}
                    </span>
                  )}
                  {item.label}
                </span>
                {item.shortcut && (
                  <span style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {item.shortcut}
                  </span>
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );

  // Portal para document.body
  if (typeof document === 'undefined') return null;
  return createPortal(menu, document.body);
}
