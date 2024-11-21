import { useEffect } from "react";

export function useWindow<K extends keyof WindowEventMap>(
  type: K,
  listener: (this: Window, ev: WindowEventMap[K]) => unknown,
) {
  useEffect(() => {
    window.addEventListener(type, listener);

    return () => window.removeEventListener(type, listener);
  });
}
