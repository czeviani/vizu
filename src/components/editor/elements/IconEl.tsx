'use client';
import * as LucideIcons from 'lucide-react';
import type { IconElement } from '@/types/slide';

interface Props {
  element: IconElement;
}

export function IconEl({ element: el }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[el.iconName] as React.ComponentType<{ size: number; color: string; strokeWidth: number }> | undefined;

  const size = Math.min(el.width, el.height) * 0.7;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: el.background === 'transparent' ? undefined : el.background,
        borderRadius: el.border.radius,
        border: el.border.style !== 'none' ? `${el.border.width}px ${el.border.style} ${el.border.color}` : undefined,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {Icon ? (
        <Icon size={size} color={el.color} strokeWidth={1.5} />
      ) : (
        <span style={{ fontSize: size * 0.8, color: el.color }}>?</span>
      )}
    </div>
  );
}
