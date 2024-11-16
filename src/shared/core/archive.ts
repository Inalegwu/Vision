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
import { Data, Micro } from "effect";
import { Result, ResultAsync } from "neverthrow";
import { createExtractorFromData } from "node-unrar-js";
import { v4 } from "uuid";

class ArchiveError extends Data.TaggedError("archive-error")<{
  cause: unknown;
}> {}

const parserChannel = new BroadcastChannel<ParserChannel>("parser-channel");

export namespace Archive {
  export async function handleRar(path: string) {
    return await ResultAsync.fromThrowable(
      async () => {
        const file = Fs.readFile(path);
        const wasmBinary = Fs.readFile(
          require.resolve("node-unrar-js/dist/js/unrar.wasm"),
        );

        if (!file.isOk() || !wasmBinary.isOk()) {
          throw new Error("FILE ERROR");
        }

        return (
          await createRarExtractor(file.value.buffer, wasmBinary.value.buffer)
        ).andThen((extractor) => {
          const files = Array.from(extractor.files)
            .sort((a, b) => sortPages(a.fileHeader.name, b.fileHeader.name))
            .filter((file) => !file.fileHeader.name.includes("xml"));

          const thumbnailUrl = convertToImageUrl(
            files[0].extraction?.buffer || files[1].extraction?.buffer!,
          );
          const issueTitle = parseFileNameFromPath(path)._unsafeUnwrap();

          return Result.fromThrowable(
            async () => {
              const exists = await db.query.issues.findFirst({
                where: (issue, { eq }) => eq(issue.issueTitle, issueTitle),
              });

              if (exists) {
                throw new Error("This Issue is Already Saved");
              }

              const newIssue = await db
                .insert(issues)
                .values({
                  id: v4(),
                  issueTitle,
                  thumbnailUrl,
                })
                .returning()
                .execute();

              for (const [index, value] of files.entries()) {
                parserChannel.postMessage({
                  completed: index + 1,
                  total: files.length,
                  error: null,
                });
                await db.insert(pages).values({
                  id: v4(),
                  pageContent: convertToImageUrl(value.extraction?.buffer!),
                  issueId: newIssue[0].id,
                });
              }

              parserChannel.postMessage({
                isCompleted: true,
                error: null,
              });
            },
            (error) => {
              parserChannel.postMessage({
                isCompleted: false,
                error: error,
              });
              return `Error saving rar content to DB ${error}`;
            },
          )();
        });
      },
      (error) => `Error processing RAR file ${error}`,
    )();
  }

  export async function handleZip(path: string) {
    return await ResultAsync.fromThrowable(
      async () => {
        const file = Fs.readFile(path);

        if (!file.isOk()) {
          throw new Error("ZIP ARCHIVE ERROR");
        }

        return createZipExtractor(file.value.buffer).andThen((extractor) => {
          const fileName = parseFileNameFromPath(path)._unsafeUnwrap();

          return Result.fromThrowable(
            async () => {
              const exists = await db.query.issues.findFirst({
                where: (issue, { eq }) => eq(issue.issueTitle, fileName),
              });

              if (exists) {
                throw new Error("This Issue is Already Saved");
              }

              const thumbnailUrl = convertToImageUrl(extractor[1].data.buffer);

              const newIssue = await db
                .insert(issues)
                .values({
                  id: v4(),
                  issueTitle: fileName,
                  thumbnailUrl,
                })
                .returning()
                .execute();

              for (const [index, file] of extractor
                .slice(1, extractor.length - 1)
                .entries()) {
                if (file.isDir) {
                  continue;
                }
                parserChannel.postMessage({
                  completed: index + 1,
                  total: extractor.slice(1, extractor.length - 1).length,
                  error: null,
                });
                await db.insert(pages).values({
                  id: v4(),
                  pageContent: convertToImageUrl(file.data.buffer),
                  issueId: newIssue[0].id,
                });
              }

              parserChannel.postMessage({
                isCompleted: true,
                error: null,
              });
            },
            (error) => {
              parserChannel.postMessage({
                isCompleted: false,
                error: error,
              });
              return `Error saving zip content to DB ${error}`;
            },
          )();
        });
      },
      (error) => `Error handling .cbz file ${error}`,
    )();
  }

  function createRarExtractor(data: ArrayBuffer, wasmBinary: ArrayBuffer) {
    return ResultAsync.fromPromise(
      createExtractorFromData({
        data,
        wasmBinary,
      }).then((extractor) =>
        extractor.extract({
          files: [...extractor.getFileList().fileHeaders].map(
            (header) => header.name,
          ),
        }),
      ),
      (error) => `Error creating rar extractor ${error}`,
    );
  }

  function createZipExtractor(data: ArrayBuffer) {
    return Result.fromThrowable(
      () =>
        new Zip(Buffer.from(data))
          .getEntries()
          .sort((a, b) => sortPages(a.name, b.name))
          .map((entry) => ({
            name: entry.name,
            data: entry.getData(),
            isDir: entry.isDirectory,
          })),
      (error) => `Error creating zip extractor ${error}`,
    )();
  }

  function microHandleZip(path: string) {
    return Micro.gen(function* () {
      const file = yield* Fs.microReadFile(path);

      const wasmBinary = yield* Fs.microReadFile(
        require.resolve("node_modules/node-unrar-js/dist/js/unrar.wasm"),
      );

      const fileName = yield* Micro.sync(() =>
        path
          .replace(/^.*[\\\/]/, "")
          .replace(/\.[^/.]+$/, "")
          .replace(/(\d+)$/, "")
          .replace("-", ""),
      );

      // safely ensure that an issue with this name does
      // not exist anywhere
      const exists = yield* Micro.promise(
        async () =>
          await db.query.issues.findFirst({
            where: (issues, { eq }) => eq(issues.issueTitle, fileName),
          }),
      );

      if (!exists) {
        // Kill the entire process if the issue
        // already exists to ensure no reduntdant work is done
        yield* Micro.die(
          new ArchiveError({ cause: "This issue already exists" }),
        );
      }

      // get the files, as an array, extracted and sorted safely
      // within a micro
      const files = yield* Micro.promise(() =>
        createExtractorFromData({
          data: file.buffer,
          wasmBinary: wasmBinary.buffer,
        })
          .then((extractor) =>
            extractor.extract({
              files: [...extractor.getFileList().fileHeaders].map(
                (header) => header.name,
              ),
            }),
          )
          .then((files) => Array.from(files.files))
          .then((files) =>
            files
              .sort((a, b) => sortPages(a.fileHeader.name, b.fileHeader.name))
              .filter((file) => !file.fileHeader.name.includes("xml")),
          ),
      );

      // construct the thumbnail url
      const thumbnailUrl = yield* Micro.sync(() =>
        convertToImageUrl(
          files[0].extraction?.buffer || files[1].extraction?.buffer!,
        ),
      );

      // create the new issue within a micro promise
      // so that errors can be traced and handled without
      // crashing the entire app
      const newIssue = yield* Micro.promise(
        async () =>
          await db
            .insert(issues)
            .values({
              id: v4(),
              issueTitle: fileName,
              thumbnailUrl,
            })
            .returning()
            .execute(),
      );

      if (!newIssue) {
        // kill the entire parsing process to prevent more unnecesary work
        // from being done
        yield* Micro.die(new ArchiveError({ cause: "Error creating issue" }));
      }

      for (const file of files) {
        // create a micro fiber handle
        // to use the Effect ecosystem
        // green threads to give us the
        // benefit of false concurrency
        const fiber = yield* Micro.fork(
          Micro.promise(
            async () =>
              await db.insert(pages).values({
                id: v4(),
                issueId: newIssue[0].id,
                pageContent: convertToImageUrl(file.extraction?.buffer!),
              }),
          ),
        );

        // await the fiber handle to complete
        // before exiting the entire Micro scope
        yield* fiber.await;
      }
    }).pipe(
      // extract the errors detected within the Micro and log them out
      // this also creates a way for future error logging to external
      // services to be handled
      Micro.tapError((error) => Micro.sync(() => console.log(error))),
    );
  }
}
