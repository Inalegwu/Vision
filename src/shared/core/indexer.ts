import * as fs from "node:fs";
import { parseWorkerMessageWithSchema } from "../utils";
import { z } from "zod";

const loadSchema = z.object({
  index: z.array(z.object({
    v: z.string()
  }))
})

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

  load(path: string) {
    console.log({ message: `loading index from path ${path}` })
    const result = fs.readFileSync(path).toString();

    console.log({ result });

    parseWorkerMessageWithSchema(loadSchema, JSON.parse(result)).match(({ data }) => {
      for (const item in data.index) {
        this.$store.add(item);
      }
    }, ({ message }) => {
      console.error({ message, code: "failed to load" })
    })

    console.log({ store: this.$store })

    return new Indexer
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

  
    writer(path, JSON.stringify({
      index: indexAsJSON
    }), {});
  }
}

const watcherIndex = new Indexer().init()

export default watcherIndex;
