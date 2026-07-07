'use client';
import { useCallback, useRef, useState } from 'react';

const MAX_HISTORY = 100;

export function useHistory<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  const history = useRef<T[]>([initialState]);
  const [pointer, setPointer] = useState(0);
  const [historyLength, setHistoryLength] = useState(1);

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setState((prev) => {
      const nextState = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      history.current = history.current.slice(0, pointer + 1);
      history.current.push(nextState);
      if (history.current.length > MAX_HISTORY) {
        history.current.shift();
      } else {
        setPointer((p) => p + 1);
      }
      setHistoryLength(history.current.length);
      return nextState;
    });
  }, [pointer]);

  // Resets history to a single state (used when loading a presentation)
  const reset = useCallback((newState: T) => {
    history.current = [newState];
    setPointer(0);
    setHistoryLength(1);
    setState(newState);
  }, []);

  const undo = useCallback(() => {
    setPointer((p) => {
      if (p <= 0) return p;
      const prevIndex = p - 1;
      setState(history.current[prevIndex]);
      return prevIndex;
    });
  }, []);

  const redo = useCallback(() => {
    setPointer((p) => {
      if (p >= history.current.length - 1) return p;
      const nextIndex = p + 1;
      setState(history.current[nextIndex]);
      return nextIndex;
    });
  }, []);

  const canUndo = pointer > 0;
  const canRedo = pointer < historyLength - 1;

  return { state, set, undo, redo, canUndo, canRedo, reset };
}
