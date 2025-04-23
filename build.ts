import { Console, Data, Effect } from "effect";
import { build } from "electron-builder";

class BuildError extends Data.TaggedError("BuildError")<{
  error: unknown;
}> {}

Effect.tryPromise({
  try: async () =>
    await build({
      config: {
        appId: "com.vision.app",
        productName: "Vision",
        artifactName: "${productName}-${version}_${platform}_${arch}.${ext}",
        buildDependenciesFromSource: true,
        files: ["out/**/*"],
        directories: {
          output: "release/${version}",
        },
        mac: {
          target: ["dmg"],
          hardenedRuntime: true,
        },
        win: {
          target: [
            {
              target: "msi",
              arch: ["x64"],
            },
          ],
        },
        linux: {
          target: [
            {
              target: "AppImage",
            },
          ],
          category: "entertainment",
        },
        msi: {
          oneClick: true,
          perMachine: true,
          runAfterFinish: true,
        },
      },
    }).then((result) => {
      Console.log(result);
    }),
  catch: (error) => new BuildError({ error }),
}).pipe(
  Effect.catchTags({
    BuildError: (error) =>
      Effect.logFatal(
        // @ts-ignore: it's correctly typed
        `Build failed with Exit Code ${error.error.exitCode} ERROR CODE ==> ${error.error.code}`,
      ),
  }),
  Effect.withLogSpan("build"),
  Effect.runPromise,
);

// build({
//   config: {
//     appId: "com.vision.app",
//     productName: "Vision",
//     artifactName: "${productName}-${version}_${platform}_${arch}.${ext}",
//     buildDependenciesFromSource: true,
//     files: ["out/**/*"],
//     directories: {
//       output: "release/${version}",
//     },
//     mac: {
//       target: ["dmg"],
//       hardenedRuntime: true,
//     },
//     win: {
//       target: [
//         {
//           target: "msi",
//           arch: ["x64"],
//         },
//       ],
//     },
//     linux: {
//       target: [
//         {
//           target: "AppImage",
//         },
//       ],
//       category: "entertainment",
//     },
//     msi: {
//       oneClick: true,
//       perMachine: true,
//       runAfterFinish: true,
//     },
//   },
// });
