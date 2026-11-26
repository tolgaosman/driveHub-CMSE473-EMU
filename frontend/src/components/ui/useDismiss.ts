'use client';

import { RefObject, useEffect } from 'react';

/** Calls `onClose` on pointer-down outside `ref` or on Escape while `active`. */
export function useDismiss(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onClose: () => void
) {
  useEffect(() => {
    if (!active) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, active, onClose]);
}
