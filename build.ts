import { Data, Effect } from "effect";
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
        artifactName: "${productName}-${version}-${platform}-${arch}.${ext}",
        buildDependenciesFromSource: true,
        files: ["out/**/*"],
        extraFiles: {
          from: "drizzle/",
          to: "drizzle/",
        },
        extraResources: {
          from: "drizzle/",
          to: "drizzle/",
        },
        directories: {
          output: "release/${version}",
        },
        mac: {
          target: ["dmg"],
          hardenedRuntime: true,
          category: "entertaiment",
        },
        win: {
          icon: "build/win.png",
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
    }).then((paths) => console.log(`Packaged App @ ${paths.join(",")}`)),
  catch: (error) => new BuildError({ error }),
}).pipe(
  Effect.andThen(Effect.logInfo),
  Effect.catchTags({
    BuildError: ({ error }) =>
      Effect.logFatal(
        // @ts-ignore: it's correctly typed
        `Build failed with Exit Code ${error.exitCode} ERROR CODE ==> ${error.code}...\n${error}`,
      ),
  }),
  Effect.withLogSpan("app.build"),
  Effect.runPromise,
);
