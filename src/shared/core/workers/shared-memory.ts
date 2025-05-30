import { Effect, HashMap, Option } from "effect";

export class SharedMemory extends Effect.Service<SharedMemory>()(
  "SharedMemory",
  {
    scoped: Effect.gen(function* () {
      const memory = HashMap.empty<string, string>();

      const saveToSharedMemory = (key: string, value: unknown) =>
        memory.pipe(HashMap.set(key, value));

      const getFromSharedMemory = (key: string) =>
        memory.pipe(HashMap.get(key), Option.getOrUndefined);

      return {
        saveToSharedMemory,
        getFromSharedMemory,
      };
    }),
  },
) {}
