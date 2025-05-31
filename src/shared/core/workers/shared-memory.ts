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

      // const _memory = memory.pipe(
      //   HashMap.toValues,
      //   Array.map((item) => ({ item })),
      //   (_) => JSON.stringify({ memory: _ }),
      // );

      // yield* Fs.writeFile("", _memory).pipe(
      //   Effect.schedule(Schedule.spaced(Duration.seconds(5))),
      // );

      return {
        saveToSharedMemory,
        getFromSharedMemory,
      };
    }),
  },
) {}
