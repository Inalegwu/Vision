import { Array } from "effect";
import type * as fs from "node:fs";

export const watcherIndex = (() => {
  const store = new Set<string>();

  return {
    write: (value: string) => store.add(value),
    clear: () => store.clear(),
    check: (value: string) => store.has(value),
    remove: (value: string) => store.delete(value),
    save: (
      path: string,
      writer: (
        file: fs.PathOrFileDescriptor,
        data: string | NodeJS.ArrayBufferView,
        options?: fs.WriteFileOptions,
      ) => void,
    ) => {
      const indexAsJSON = Array.fromIterable(store).map((path) => ({ path }));

      if (indexAsJSON.length === 0) return;

      writer(path, JSON.stringify({ index: indexAsJSON }), {});
    },
  };
})();

export default watcherIndex;
