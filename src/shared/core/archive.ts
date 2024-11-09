import type { RunResult } from "better-sqlite3";
import { ResultAsync } from "neverthrow";
import { createExtractorFromData } from "node-unrar-js";
import { v4 } from "uuid";
import { Fs } from "../fs";
import { issues, pages } from "../schema";
import db from "../storage";
import { convertToImageUrl, parseFileNameFromPath } from "../utils";

export namespace Archive {
  export function handleRar(path: string) {
    return ResultAsync.fromThrowable(
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
        ).asyncAndThen((extractor) => {
          const files = Array.from(extractor.files);

          const thumbnailUrl = convertToImageUrl(
            files[0].extraction?.buffer || files[1].extraction?.buffer!,
          );
          const issueTitle = parseFileNameFromPath(path)._unsafeUnwrap();

          return ResultAsync.fromPromise(
            db
              .insert(issues)
              .values({ id: v4(), thumbnailUrl, issueTitle })
              .returning()
              .execute()
              .then((res) => res.at(0)),
            (error) => `Error creating new issue ${error}`,
          ).andThen((issue) => {
            const filePromises: ResultAsync<RunResult, string>[] = [];

            if (!issue) {
              throw new Error("ERROR Creating New Issue");
            }

            for (const file of extractor.files) {
              const fileResult = ResultAsync.fromPromise(
                db
                  .insert(pages)
                  .values({
                    id: v4(),
                    pageContent: convertToImageUrl(file.extraction?.buffer!),
                    issueId: issue.id,
                  })
                  .execute()
                  .then((result) => result),
                (error) => `Error handing files in extractor ${error}`,
              );
              filePromises.push(fileResult);
            }
            return ResultAsync.combine(filePromises);
          });
        });
      },
      (error) => `Error processing RAR file ${error}`,
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
}
