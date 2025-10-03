import { parserChannel } from "@src/shared/channels";
import { Fs } from "@src/shared/fs";
import { convertToImageUrl, parseFileNameFromPath } from "@src/shared/utils";
import { Console, Context, Effect } from "effect";
import type { UnknownException } from "effect/Cause";
import path from "node:path";
import { v4 } from "uuid";
import type { FSError } from "../utils/errors";
import {
  createRarExtractor,
  createZipExtractor,
  parseXML,
  saveIssue,
} from "../utils/functions";

export type IArchiveService = {
  rar: (filePath: string) => Effect.Effect<void, FSError | UnknownException>;
  zip: (filePath: string) => Effect.Effect<void, FSError | UnknownException>;
};

export class ArchiveService extends Context.Tag(
  "@vision/Core/Services/Archive",
)<ArchiveService, IArchiveService>() {}

export const databaseArchiveService = {
  rar: Effect.fnUntraced(function* (filePath: string) {
    const { files, meta } = yield* createRarExtractor(filePath);

    const issueTitle = yield* Effect.sync(() =>
      parseFileNameFromPath(filePath),
    );

    const savePath = path.join(process.env.cache_dir!, issueTitle);

    const thumbnailUrl = yield* Effect.sync(() =>
      convertToImageUrl(files[0].data || files[1].data || files[2].data!),
    );

    const newIssue = yield* saveIssue(issueTitle, thumbnailUrl, savePath);

    yield* parseXML(meta, newIssue.id).pipe(
      Effect.fork,
      Effect.catchAll(Effect.logFatal),
    );

    yield* Fs.makeDirectory(savePath).pipe(
      Effect.catchTag("FSError", Console.log),
    );

    yield* Effect.forEach(files, (file) =>
      Fs.writeFile(
        path.join(savePath, file.name),
        Buffer.from(file.data!).toString("base64"),
        {
          encoding: "base64",
        },
      ).pipe(Effect.catchTag("FSError", Console.log)),
    );

    yield* Effect.sync(() =>
      parserChannel.postMessage({
        state: "SUCCESS",
        isCompleted: true,
        error: null,
        issue: issueTitle,
      }),
    );
  }),
  zip: Effect.fnUntraced(function* (filePath: string) {
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
      ).pipe(Effect.catchTag("FSError", Console.log)),
    );

    yield* Effect.sync(() =>
      parserChannel.postMessage({
        state: "SUCCESS",
        isCompleted: true,
        error: null,
        issue: issueTitle,
      }),
    );
  }),
};

export const fileSystemArchiveService = {
  rar: Effect.fnUntraced(function* (filePath: string) {
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
      path: savePath,
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

    yield* Fs.makeDirectory(savePath).pipe(Effect.catchAll(Effect.logFatal));

    yield* Effect.forEach(files, (file) =>
      Fs.writeFile(
        path.join(savePath, file.name),
        Buffer.from(file.data!).toString("base64"),
        {
          encoding: "base64",
        },
      ).pipe(Effect.catchAll(Effect.logFatal)),
    );

    yield* Effect.sync(() =>
      parserChannel.postMessage({
        state: "SUCCESS",
        isCompleted: true,
        error: null,
        issue: issueTitle,
      }),
    );
  }),
  zip: Effect.fnUntraced(function* (filePath: string) {
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
      path: savePath,
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

    yield* Fs.makeDirectory(savePath).pipe(Effect.catchAll(Effect.logFatal));

    yield* Effect.forEach(files, (file) =>
      Fs.writeFile(
        path.join(savePath, file.name),
        Buffer.from(file.data!).toString("base64"),
        {
          encoding: "base64",
        },
      ).pipe(Effect.catchAll(Effect.logFatal)),
    );

    yield* Effect.sync(() =>
      parserChannel.postMessage({
        state: "SUCCESS",
        isCompleted: true,
        error: null,
        issue: issueTitle,
      }),
    );
  }),
};
