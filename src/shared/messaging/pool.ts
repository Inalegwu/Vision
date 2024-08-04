import type { Emitter } from "./emitter";

function createPool<T extends Record<string, unknown>>() {
  let idx = 0;
  const pool = new Map<number, Emitter<T>>();

  function addEmitterToPool(e: Emitter<T>) {
    pool.set(idx, e);
    idx += 1;
  }

  const emitters = Array.from(pool.values());

  for (const emitter of emitters) {
    emitter.on("", () => {});
  }
}
