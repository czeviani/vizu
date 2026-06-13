'use client';
import type { ImageElement } from '@/types/slide';

interface Props {
  element: ImageElement;
}

export function ImageEl({ element: el }: Props) {
  const shadow = el.shadow.enabled
    ? `${el.shadow.x}px ${el.shadow.y}px ${el.shadow.blur}px ${el.shadow.color}`
    : undefined;

  if (!el.src) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#e2e8f0',
          borderRadius: el.border.radius,
          border: el.border.style !== 'none' ? `${el.border.width}px ${el.border.style} ${el.border.color}` : undefined,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
          fontSize: 14,
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
        <span style={{ fontSize: 12 }}>No image</span>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: el.border.radius,
        border: el.border.style !== 'none' ? `${el.border.width}px ${el.border.style} ${el.border.color}` : undefined,
        overflow: 'hidden',
        boxShadow: shadow,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={el.src}
        alt={el.alt}
        style={{ width: '100%', height: '100%', objectFit: el.objectFit }}
        draggable={false}
      />
    </div>
  );
}
