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
import { Result, ResultAsync } from "neverthrow";
import { createExtractorFromData } from "node-unrar-js";
import { v4 } from "uuid";

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
                  completed: index,
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

              for (const file of extractor.slice(1, extractor.length - 1)) {
                if (file.isDir) {
                  continue;
                }
                await db.insert(pages).values({
                  id: v4(),
                  pageContent: convertToImageUrl(file.data.buffer),
                  issueId: newIssue[0].id,
                });
              }
            },
            (error) => `Error saving ZIP ${error}`,
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
}
