import type * as fs from "node:fs";

// TODO persist index across app runs
class Indexer {
  $store: Set<string> = new Set<string>();

  init() {
    return new Indexer();
  }

  write(value: string) {
    this.$store.add(value);
  }

  checkIndex(value: string) {
    return this.$store.has(value);
  }

  clearIndex() {
    this.$store.clear();
  }

  removeFromIndex(value: string) {
    console.log({ message: `removing ${value}` });
    this.$store.delete(value);
  }

  saveIndex(
    path: string,
    writer: (
      file: fs.PathOrFileDescriptor,
      data: string | NodeJS.ArrayBufferView,
      options?: fs.WriteFileOptions,
    ) => void,
  ) {
    const indexAsJSON = Array.from(this.$store).map((v) => ({ v }));

    console.log({ indexAsJSON });

    writer(path, JSON.stringify(indexAsJSON), {});
  }
}

const watcherIndex = new Indexer().init();

export default watcherIndex;
