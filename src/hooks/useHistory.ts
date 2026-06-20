'use client';
import { useCallback, useRef, useState } from 'react';

const MAX_HISTORY = 100;

export function useHistory<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  const history = useRef<T[]>([initialState]);
  const pointer = useRef(0);

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setState((prev) => {
      const nextState = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      history.current = history.current.slice(0, pointer.current + 1);
      history.current.push(nextState);
      if (history.current.length > MAX_HISTORY) {
        history.current.shift();
      } else {
        pointer.current++;
      }
      return nextState;
    });
  }, []);

  // Resets history to a single state (used when loading a presentation)
  const reset = useCallback((newState: T) => {
    history.current = [newState];
    pointer.current = 0;
    setState(newState);
  }, []);

  const undo = useCallback(() => {
    if (pointer.current <= 0) return;
    pointer.current--;
    const prev = history.current[pointer.current];
    setState(prev);
  }, []);

  const redo = useCallback(() => {
    if (pointer.current >= history.current.length - 1) return;
    pointer.current++;
    const next = history.current[pointer.current];
    setState(next);
  }, []);

  const canUndo = pointer.current > 0;
  const canRedo = pointer.current < history.current.length - 1;

  return { state, set, undo, redo, canUndo, canRedo, reset };
}
