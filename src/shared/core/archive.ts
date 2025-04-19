import { Fs } from "@shared/fs";
import { issues, metadata, pages } from "@shared/schema";
import db from "@shared/storage";
import {
  convertToImageUrl,
  parseFileNameFromPath,
  sortPages,
} from "@shared/utils";
import Zip from "adm-zip";
import { BroadcastChannel } from "broadcast-channel";
import { Array, Effect, Schema } from "effect";
import { XMLParser } from "fast-xml-parser";
import { createExtractorFromData } from "node-unrar-js";
import { v4 } from "uuid";
import { MetadataSchema } from "./validations";

const parserChannel = new BroadcastChannel<ParserChannel>("parser-channel");

export namespace Archive {
  export const handleRar = (path: string) =>
    Effect.gen(function* () {
      yield* Effect.log("loading wasm");
      const wasmBinary = yield* Fs.readFile(
        require.resolve("node-unrar-js/dist/js/unrar.wasm"),
      ).pipe(Effect.andThen((binary) => binary.buffer));

      parserChannel.postMessage({
        isCompleted: false,
        state: "SUCCESS",
        error: null,
      });

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
        Effect.andThen((extracted) =>
          Array.fromIterable(extracted.files)
            .sort((a, b) => sortPages(a.fileHeader.name, b.fileHeader.name))
            .filter((file) => !file.fileHeader.flags.directory),
        ),
        Effect.tap(() =>
          Effect.sync(() =>
            parserChannel.postMessage({
              isCompleted: false,
              state: "SUCCESS",
              error: null,
            }),
          ),
        ),
      );

      if (files.length === 0) {
        return yield* Effect.sync(() =>
          parserChannel.postMessage({
            error: "File appears to be empty",
            isCompleted: false,
            state: "ERROR",
          }),
        );
      }

      yield* Effect.log("Attempting to save");

      parserChannel.postMessage({
        isCompleted: false,
        state: "SUCCESS",
        error: null,
      });

      const issueTitle = yield* Effect.sync(() => parseFileNameFromPath(path));

      parserChannel.postMessage({
        isCompleted: false,
        state: "SUCCESS",
        error: null,
      });

      const _files = files.filter(
        (file) => !file.fileHeader.name.includes("xml"),
      );

      const thumbnailUrl = yield* Effect.sync(() =>
        convertToImageUrl(
          _files[0]?.extraction?.buffer || _files[1]?.extraction?.buffer!,
        ),
      );

      parserChannel.postMessage({
        isCompleted: false,
        state: "SUCCESS",
        error: null,
      });

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
        parserChannel.postMessage({
          isCompleted: false,
          error: "Issue Already Exists",
          state: "SUCCESS",
        });
        return yield* Effect.logError("Issue Already Exists");
      }

      yield* Effect.fork(
        parseXML(
          files.find((file) => file.fileHeader.name.includes("xml"))?.extraction
            ?.buffer,
          newIssue.id,
        ),
      );

      parserChannel.postMessage({
        isCompleted: false,
        state: "SUCCESS",
        error: null,
      });

      yield* Effect.forEach(_files, (file, index) =>
        Effect.gen(function* () {
          parserChannel.postMessage({
            isCompleted: false,
            state: "SUCCESS",
            error: null,
          });

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
              total: _files.length,
              error: null,
              isCompleted: false,
              state: "SUCCESS",
            }),
          );
        }),
      );

      yield* Effect.sync(() =>
        parserChannel.postMessage({
          isCompleted: true,
          error: null,
          state: "SUCCESS",
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

  export const handleZip = (path: string) =>
    Effect.gen(function* () {
      parserChannel.postMessage({
        isCompleted: false,
        state: "SUCCESS",
        error: null,
      });
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
        Effect.tap(() =>
          Effect.sync(() =>
            parserChannel.postMessage({
              isCompleted: false,
              state: "SUCCESS",
              error: null,
            }),
          ),
        ),
      );

      const _files = files.filter((file) => !file.name.includes("xml"));

      const issueTitle = yield* Effect.sync(() => parseFileNameFromPath(path));
      const thumbnailUrl = yield* Effect.sync(() =>
        convertToImageUrl(
          _files[0].data.buffer ||
            _files[1].data.buffer ||
            _files[1].data.buffer,
        ),
      );

      parserChannel.postMessage({
        isCompleted: false,
        state: "SUCCESS",
        error: null,
      });

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

      yield* Effect.fork(
        parseXML(
          files.find((file) => file.name.includes("xml"))?.data.buffer,
          newIssue.id,
        ),
      );

      parserChannel.postMessage({
        isCompleted: false,
        state: "SUCCESS",
        error: null,
      });

      yield* Effect.forEach(_files, (file, index) =>
        Effect.gen(function* () {
          parserChannel.postMessage({
            isCompleted: false,
            state: "SUCCESS",
            error: null,
          });

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
            total: _files.length,
            error: null,
            isCompleted: false,
            state: "SUCCESS",
          });
        }),
      );

      parserChannel.postMessage({
        isCompleted: true,
        error: null,
        state: "SUCCESS",
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

const parseXML = (buffer: ArrayBufferLike | undefined, issueId: string) =>
  Effect.gen(function* () {
    const xmlParser = new XMLParser();

    if (!buffer) return;

    const file = Buffer.from(buffer).toString();

    const contents = yield* Effect.sync(() => xmlParser.parse(file));

    const comicInfo = yield* Schema.decodeUnknown(MetadataSchema)(
      contents.ComicInfo,
      {
        onExcessProperty: "ignore",
        exact: false,
      },
    );

    yield* Effect.tryPromise(
      async () =>
        await db.insert(metadata).values({
          id: v4(),
          issueId,
          ...comicInfo,
        }),
    );
  }).pipe(Effect.orDie);
