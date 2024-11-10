import { Result, ResultAsync } from "neverthrow";
import { createExtractorFromData } from "node-unrar-js";
import { v4 } from "uuid";
import { Fs } from "../fs";
import { issues, pages } from "../schema";
import db from "../storage";
import { convertToImageUrl, parseFileNameFromPath, sortPages } from "../utils";

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
          const files = Array.from(extractor.files).sort((a, b) =>
            sortPages(a.fileHeader.name, b.fileHeader.name),
          );

          const thumbnailUrl = convertToImageUrl(
            files[0].extraction?.buffer || files[1].extraction?.buffer!,
          );
          const issueTitle = parseFileNameFromPath(path)._unsafeUnwrap();

          return Result.fromThrowable(
            async () => {
              const newIssue = await db
                .insert(issues)
                .values({
                  id: v4(),
                  issueTitle,
                  thumbnailUrl,
                })
                .returning()
                .execute();

              for (const file of files) {
                await db.insert(pages).values({
                  id: v4(),
                  pageContent: convertToImageUrl(file.extraction?.buffer!),
                  issueId: newIssue[0].id,
                });
              }
            },
            (error) => `Error saving rar content to DB ${error}`,
          )();
        });
      },
      (error) => `Error processing RAR file ${error}`,
    )();
  }

  export function handleZip(path: string) {}

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
}
