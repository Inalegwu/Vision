import { Fs } from "@src/shared/fs";
import { convertToImageUrl, parseFileNameFromPath } from "@src/shared/utils";
import { Effect } from "effect";
import path from "node:path";
import { v4 } from "uuid";
import {
  createRarExtractor,
  createZipExtractor,
  parseXML,
} from "../utils/functions";

export class FileSystemArchive extends Effect.Service<FileSystemArchive>()(
  "@vision/Core/FileSystemArchive",
  {
    effect: Effect.gen(function* () {
      const rar = Effect.fnUntraced(function* (filePath: string) {
        const { meta, files } = yield* createRarExtractor(filePath);

        const issueTitle = yield* Effect.sync(() =>
          parseFileNameFromPath(filePath),
        );

        const thumbnail = yield* Effect.sync(() =>
          convertToImageUrl(files[0].data || files[1].data!),
        );

        const savePath = path.join(process.env.cache_dir!, issueTitle);

        const newIssue = {
          id: v4(),
          issueTitle,
          thumbnail,
        };

        yield* Fs.writeFile(
          path.join(process.env.lib_dir!, "cache.json"),
          JSON.stringify({
            cache: [newIssue] satisfies ComicCacheSchema,
          }),
          {},
        );

        yield* parseXML(meta, newIssue.id).pipe(
          Effect.fork,
          Effect.catchAll(Effect.logFatal),
        );

        yield* Fs.makeDirectory(savePath).pipe(
          Effect.catchAll(Effect.logFatal),
        );

        yield* Effect.forEach(files, (file) =>
          Fs.writeFile(
            path.join(savePath, file.name),
            Buffer.from(file.data!).toString("base64"),
            {
              encoding: "base64",
            },
          ).pipe(Effect.catchAll(Effect.logFatal)),
        );
      });

      const zip = Effect.fnUntraced(function* (filePath: string) {
        const { meta, files } = yield* createZipExtractor(filePath);

        const issueTitle = yield* Effect.sync(() =>
          parseFileNameFromPath(filePath),
        );

        const thumbnail = yield* Effect.sync(() =>
          convertToImageUrl(files[0].data || files[1].data!),
        );

        const savePath = path.join(process.env.cache_dir!, issueTitle);

        const newIssue = {
          id: v4(),
          issueTitle,
          thumbnail,
        };

        yield* Fs.writeFile(
          path.join(process.env.lib_dir!, "cache.json"),
          JSON.stringify({
            cache: [newIssue] satisfies ComicCacheSchema,
          }),
          {},
        );

        yield* parseXML(meta, newIssue.id).pipe(
          Effect.fork,
          Effect.catchAll(Effect.logFatal),
        );

        yield* Fs.makeDirectory(savePath).pipe(
          Effect.catchAll(Effect.logFatal),
        );

        yield* Effect.forEach(files, (file) =>
          Fs.writeFile(
            path.join(savePath, file.name),
            Buffer.from(file.data!).toString("base64"),
            {
              encoding: "base64",
            },
          ).pipe(Effect.catchAll(Effect.logFatal)),
        );
      });

      return { rar, zip };
    }),
  },
) {}
