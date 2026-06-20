'use client';
import { useRef, useEffect, useCallback } from 'react';
import type { TextElement } from '@/types/slide';

interface Props {
  element: TextElement;
  selected: boolean;
  editing: boolean;
  onStartEdit: () => void;
  onChange: (content: string) => void;
  onExitEdit?: () => void;
}

export function TextEl({ element: el, editing, onStartEdit, onChange, onExitEdit }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const wasEditingRef = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const entering = editing && !wasEditingRef.current;
    wasEditingRef.current = editing;

    if (entering) {
      // Set initial content ONCE when entering edit mode.
      // We do NOT use React-controlled content during editing to avoid cursor jumps.
      ref.current.innerHTML = el.content.replace(/\n/g, '<br/>');
      ref.current.focus();
      // Move cursor to end
      const sel = window.getSelection();
      if (sel) {
        const range = document.createRange();
        range.selectNodeContents(ref.current);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }, [editing]); // intentionally excludes el.content — DOM is source of truth while editing

  const handleInput = useCallback(() => {
    if (ref.current) onChange(ref.current.innerText);
  }, [onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (ref.current) onChange(ref.current.innerText);
        onExitEdit?.();
      }
    },
    [onChange, onExitEdit]
  );

  const va =
    el.verticalAlign === 'middle'
      ? 'center'
      : el.verticalAlign === 'bottom'
      ? 'flex-end'
      : 'flex-start';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: va,
        background: el.background === 'transparent' ? undefined : el.background,
        borderRadius: el.border.radius,
        border:
          el.border.style !== 'none'
            ? `${el.border.width}px ${el.border.style} ${el.border.color}`
            : undefined,
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
        onKeyDown={handleKeyDown}
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
          minHeight: '1em',
        }}
        // During editing: React must NOT touch the DOM (cursor would jump).
        // When not editing: render content as HTML (supports line breaks).
        dangerouslySetInnerHTML={
          editing ? undefined : { __html: el.content.replace(/\n/g, '<br/>') }
        }
      />
    </div>
  );
}
