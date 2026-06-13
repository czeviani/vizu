'use client';
import type { ShapeElement, ShapeType } from '@/types/slide';

interface Props {
  element: ShapeElement;
}

function getClipPath(shape: ShapeType): string | undefined {
  switch (shape) {
    case 'triangle':
      return 'polygon(50% 0%, 0% 100%, 100% 100%)';
    case 'diamond':
      return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
    case 'pentagon':
      return 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)';
    case 'hexagon':
      return 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
    case 'star':
      return 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
    case 'arrow-right':
      return 'polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)';
    case 'arrow-left':
      return 'polygon(100% 20%, 40% 20%, 40% 0%, 0% 50%, 40% 100%, 40% 80%, 100% 80%)';
    default:
      return undefined;
  }
}

export function ShapeEl({ element: el }: Props) {
  const clipPath = getClipPath(el.shape);
  const isCircle = el.shape === 'circle';
  const isRounded = el.shape === 'rounded-rectangle';

  const shadow = el.shadow.enabled
    ? `${el.shadow.x}px ${el.shadow.y}px ${el.shadow.blur}px ${el.shadow.color}`
    : undefined;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: el.fill,
        borderRadius: isCircle ? '50%' : isRounded ? el.border.radius || 12 : el.border.radius,
        border:
          el.border.style !== 'none' && !clipPath
            ? `${el.border.width}px ${el.border.style} ${el.border.color}`
            : undefined,
        clipPath,
        boxShadow: shadow,
      }}
    />
  );
}
