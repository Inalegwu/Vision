import { Fs } from "@shared/fs";
import { issues, pages } from "@shared/schema";
import db from "@shared/storage";
import type { ParserChannel } from "@shared/types";
import {
  convertToImageUrl,
  parseFileNameFromPath,
  sortPages,
} from "@shared/utils";
import Zip from "adm-zip";
import { BroadcastChannel } from "broadcast-channel";
import { Array, Data, Effect, Schema } from "effect";
import { XMLParser } from "fast-xml-parser";
import { createExtractorFromData } from "node-unrar-js";
import { v4 } from "uuid";
import { MetadataSchema } from "./validations";

class ArchiveError extends Data.TaggedError("archive-error")<{
  cause: unknown;
}> {}

const parserChannel = new BroadcastChannel<ParserChannel>("parser-channel");

export namespace Archive {
  export function handleRar(path: string) {
    return Effect.gen(function* () {
      const xmlParser = new XMLParser();
      yield* Effect.log("loading wasm");
      const wasmBinary = yield* Fs.readFile(
        require.resolve("node-unrar-js/dist/js/unrar.wasm"),
      ).pipe(Effect.andThen((binary) => binary.buffer));

      yield* Effect.log("Attempting to extract");
      const files = yield* Fs.readFile(path).pipe(
        Effect.andThen((file) => file.buffer),
        Effect.andThen((data) =>
          Effect.tryPromise(
            async () =>
              await createExtractorFromData({
                data,
                wasmBinary,
              }),
          ),
        ),
        Effect.andThen((extractor) =>
          Effect.try(() =>
            extractor.extract({
              files: [...extractor.getFileList().fileHeaders].map(
                (header) => header.name,
              ),
            }),
          ),
        ),
        Effect.tap((extracted) =>
          Effect.gen(function* () {
            const xml = Array.fromIterable(extracted.files).find((file) =>
              file.fileHeader.name.includes("xml"),
            );

            if (!xml) return;

            const file = Buffer.from(xml.extraction?.buffer!).toString();

            yield* Effect.log(file);

            const contents = yield* Effect.sync(() => xmlParser.parse(file));

            yield* Effect.log(contents);

            const comicInfo = yield* Schema.decodeUnknown(MetadataSchema)(
              contents.ComicInfo,
              {
                onExcessProperty: "ignore",
              },
            );

            yield* Effect.logInfo(comicInfo);
          }),
        ),
        Effect.andThen((extracted) =>
          Array.fromIterable(extracted.files)
            .sort((a, b) => sortPages(a.fileHeader.name, b.fileHeader.name))
            .filter((files) => !files.fileHeader.name.includes("xml")),
        ),
      );

      if (files.length === 0) {
        return yield* Effect.sync(() =>
          parserChannel.postMessage({
            error: "File appears to be empty",
            isCompleted: false,
          }),
        );
      }

      yield* Effect.log("Attempting to save");

      const issueTitle = yield* Effect.sync(() =>
        parseFileNameFromPath(path),
      ).pipe(Effect.tap(Effect.log));

      // const thumbnailUrl = yield* Effect.sync(() =>
      //   convertToImageUrl(
      //     files[0]?.extraction?.buffer || files[1]?.extraction?.buffer!,
      //   ),
      // );

      const exists = yield* Effect.tryPromise(
        async () =>
          await db.query.issues.findFirst({
            where: (issue, { eq }) => eq(issue.issueTitle, issueTitle),
          }),
      );

      if (exists) {
        return yield* Effect.logError(new Error("Issue is already Saved"));
      }

      const newIssue = yield* Effect.tryPromise(async () =>
        (
          await db
            .insert(issues)
            .values({
              id: v4(),
              issueTitle,
              thumbnailUrl,
            })
            .returning()
        ).at(0),
      );

      yield* Effect.log(newIssue);

      if (!newIssue) {
        parserChannel.postMessage({
          isCompleted: false,
          error: "Issue Already Exists",
        });
        return yield* Effect.logError("Issue Already Exists");
      }

      yield* Effect.forEach(files, (file, index) =>
        Effect.gen(function* () {
          const pageContent = yield* Effect.sync(() =>
            convertToImageUrl(file?.extraction?.buffer!),
          );

          yield* Effect.log(file.fileHeader.name);

          yield* Effect.tryPromise(
            async () =>
              await db.insert(pages).values({
                id: v4(),
                pageContent,
                issueId: newIssue.id,
              }),
          );

          yield* Effect.sync(() =>
            parserChannel.postMessage({
              completed: index,
              total: files.length,
              error: null,
              isCompleted: false,
            }),
          );
        }),
      );

      yield* Effect.sync(() =>
        parserChannel.postMessage({
          isCompleted: true,
          error: null,
        }),
      );
    }).pipe(
      Effect.orDie,
      Effect.annotateLogs({
        file: path,
        handler: "cbr",
      }),
      Effect.runPromise,
    );
  }

  export function handleZip(path: string) {
    return Effect.gen(function* () {
      const xmlParser = new XMLParser();

      const files = yield* Fs.readFile(path).pipe(
        Effect.andThen((buff) =>
          new Zip(Buffer.from(buff.buffer))
            .getEntries()
            .sort((a, b) => sortPages(a.name, b.name))
            .map((entry) => ({
              name: entry.name,
              data: entry.getData(),
              isDir: entry.isDirectory,
            }))
            .filter((file) => !file.isDir),
        ),
        Effect.tap((extracted) =>
          Effect.gen(function* () {
            const xml = Array.fromIterable(extracted).find((file) =>
              file.name.includes("xml"),
            );

            if (!xml) return;

            const file = Buffer.from(xml.data.buffer).toString();

            yield* Effect.log(file);

            const contents = yield* Effect.sync(() => xmlParser.parse(file));

            yield* Effect.logInfo(contents);

            const comicInfo = yield* Schema.decodeUnknown(MetadataSchema)(
              contents.ComicInfo,
            );

            yield* Effect.logInfo(comicInfo);
          }),
        ),
      );

      const issueTitle = yield* Effect.sync(() => parseFileNameFromPath(path));
      const thumbnailUrl = yield* Effect.sync(() =>
        convertToImageUrl(
          files[0].data.buffer || files[1].data.buffer || files[1].data.buffer,
        ),
      );

      const exists = yield* Effect.tryPromise(
        async () =>
          await db.query.issues.findFirst({
            where: (issue, { eq }) => eq(issue.issueTitle, issueTitle),
          }),
      );

      if (exists) {
        parserChannel.postMessage({
          isCompleted: false,
          error: "Issue Already Exists",
        });
        return yield* Effect.logError("Issue is already Saved");
      }

      const newIssue = yield* Effect.tryPromise(async () =>
        (
          await db
            .insert(issues)
            .values({
              id: v4(),
              issueTitle,
              thumbnailUrl,
            })
            .returning()
        ).at(0),
      );

      if (!newIssue) {
        return yield* Effect.logError("Unable to save Issue");
      }

      yield* Effect.forEach(files, (file, index) =>
        Effect.gen(function* () {
          if (file.isDir) {
            return yield* Effect.log("found and skipped directory");
          }

          const pageContent = yield* Effect.sync(() =>
            convertToImageUrl(file.data.buffer),
          );

          yield* Effect.tryPromise(
            async () =>
              await db.insert(pages).values({
                id: v4(),
                pageContent,
                issueId: newIssue.id,
              }),
          );

          parserChannel.postMessage({
            completed: index,
            total: files.length,
            error: null,
            isCompleted: false,
          });
        }),
      );

      parserChannel.postMessage({
        isCompleted: true,
        error: null,
      });
    }).pipe(
      Effect.orDie,
      Effect.annotateLogs({
        file: path,
        handler: "cbz",
      }),
      Effect.runPromise,
    );
  }
}
