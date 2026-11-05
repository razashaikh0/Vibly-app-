import { useCallback, useEffect, useRef } from "react";

/**
 * Coalesces bursty realtime events into a single trailing call so panels
 * don't re-fetch (and re-render) once per incoming database event.
 */
export function useDebouncedCallback(fn: () => void | Promise<void>, delay = 400) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      void fnRef.current();
    }, delay);
  }, [delay]);
}
