'use client';
import { useRef, useEffect, useCallback } from 'react';
import type { TextElement } from '@/types/slide';

interface Props {
  element: TextElement;
  selected: boolean;
  editing: boolean;
  onStartEdit: () => void;
  onChange: (content: string) => void;
}

export function TextEl({ element: el, selected, editing, onStartEdit, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (editing && document.activeElement !== ref.current) {
      ref.current.focus();
      // Place cursor at end
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [editing]);

  const handleInput = useCallback(() => {
    if (ref.current) onChange(ref.current.innerText);
  }, [onChange]);

  const va = el.verticalAlign === 'middle' ? 'center' : el.verticalAlign === 'bottom' ? 'flex-end' : 'flex-start';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: va,
        background: el.background === 'transparent' ? undefined : el.background,
        borderRadius: el.border.radius,
        border: el.border.style !== 'none' ? `${el.border.width}px ${el.border.style} ${el.border.color}` : undefined,
        padding: el.padding,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <div
        ref={ref}
        contentEditable={editing}
        suppressContentEditableWarning
        onDoubleClick={onStartEdit}
        onInput={handleInput}
        style={{
          fontFamily: el.style.fontFamily,
          fontSize: el.style.fontSize,
          fontWeight: el.style.fontWeight,
          fontStyle: el.style.fontStyle,
          textDecoration: el.style.textDecoration,
          color: el.style.color,
          textAlign: el.style.textAlign,
          lineHeight: el.style.lineHeight,
          letterSpacing: el.style.letterSpacing,
          textTransform: el.style.textTransform,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          width: '100%',
          outline: 'none',
          cursor: editing ? 'text' : 'default',
          userSelect: editing ? 'text' : 'none',
        }}
        dangerouslySetInnerHTML={!editing ? { __html: el.content.replace(/\n/g, '<br/>') } : undefined}
      >
        {editing ? el.content : undefined}
      </div>
    </div>
  );
}
