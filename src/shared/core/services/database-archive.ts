import { parserChannel } from "@src/shared/channels";
import { Fs } from "@src/shared/fs";
import { convertToImageUrl, parseFileNameFromPath } from "@src/shared/utils";
import { Effect } from "effect";
import path from "node:path";
import { v4 } from "uuid";
import { Dump } from "../utils/dump";
import {
  createRarExtractor,
  createZipExtractor,
  parseXML,
  saveIssue,
} from "../utils/functions";

export class DataBaseArchive extends Effect.Service<DataBaseArchive>()(
  "@vision/DatabaseArchive",
  {
    dependencies: [Dump.Default],
    effect: Effect.gen(function* () {
      const dump = yield* Dump;

      /**
       *
       * Extracts .CBR files to a predefined cache directory
       * and saves metadata to a local database for easy retrieval
       * aimed at improving app performance as well as reduce
       * storage consumption
       *
       */
      const rar = Effect.fnUntraced(function* (filePath: string) {
        const { files, meta } = yield* createRarExtractor(filePath);

        const issueTitle = yield* Effect.sync(() =>
          parseFileNameFromPath(filePath),
        );

        const savePath = path.join(process.env.cache_dir!, issueTitle);

        const thumbnailUrl = yield* Effect.sync(() =>
          convertToImageUrl(files[0].data || files[1].data || files[1].data!),
        );

        const newIssue = yield* saveIssue(issueTitle, thumbnailUrl, savePath);

        yield* parseXML(meta, newIssue.id).pipe(
          Effect.fork,
          Effect.catchAll(Effect.logFatal),
        );

        yield* Fs.makeDirectory(savePath).pipe(
          Effect.catchTag("FSError", (e) =>
            Effect.gen(function* () {
              yield* Effect.logFatal(e.message);
              yield* dump.writeToDump({
                id: v4(),
                error: String(e.message),
                date: new Date(),
              });
            }),
          ),
        );

        yield* Effect.forEach(files, (file) =>
          Fs.writeFile(
            path.join(savePath, file.name),
            Buffer.from(file.data!).toString("base64"),
            {
              encoding: "base64",
            },
          ).pipe(Effect.catchTag("FSError", (e) => Effect.logFatal(e.message))),
        );

        yield* Effect.sync(() =>
          parserChannel.postMessage({
            state: "SUCCESS",
            isCompleted: true,
            error: null,
            issue: issueTitle,
          }),
        );
      });

      /**
       *
       * Extracts .CBZ files to a predefined cache directory
       * and saves metadata to a local database for easy retrieval
       * aimed at improving app performance as well as reduce
       * storage consumption
       *
       */
      const zip = Effect.fnUntraced(function* (filePath: string) {
        const { files, meta } = yield* createZipExtractor(filePath);

        const issueTitle = yield* Effect.sync(() =>
          parseFileNameFromPath(filePath),
        );

        const savePath = path.join(process.env.cache_dir!, issueTitle);

        const thumbnailUrl = yield* Effect.sync(() =>
          convertToImageUrl(files[0].data || files[1].data || files[2].data),
        );

        const newIssue = yield* saveIssue(issueTitle, thumbnailUrl, savePath);

        yield* parseXML(meta, newIssue.id).pipe(
          Effect.fork,
          Effect.catchAll(Effect.logFatal),
        );

        yield* Fs.makeDirectory(savePath).pipe(
          Effect.catchTag("FSError", (e) => Effect.log(e)),
        );

        yield* Effect.forEach(files, (file, idx) =>
          Fs.writeFile(
            path.join(savePath, file.name),
            Buffer.from(file.data!).toString("base64"),
            {
              encoding: "base64",
            },
          ).pipe(
            Effect.catchTag("FSError", (e) =>
              Effect.logFatal(`${e.cause}::${e.message}`),
            ),
          ),
        );

        yield* Effect.sync(() =>
          parserChannel.postMessage({
            state: "SUCCESS",
            isCompleted: true,
            error: null,
            issue: issueTitle,
          }),
        );
      });

      return { rar, zip } as const;
    }),
  },
) {}
