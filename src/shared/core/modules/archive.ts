import watcherIndex from "../indexer";
import { createExtractorFromData } from "node-unrar-js";
import { parseFileNameFromPath, sortPages } from "@shared/utils";
import { readFileSync } from "node:fs";
import db from "@shared/storage";
import { err, ok } from "neverthrow";
import { v4 } from "uuid";
import Zip from "adm-zip";
import { attachments, issues } from "@shared/schema";

export namespace Archive {
  export async function handleRar(filePath: string) {
    try {
      const start = Date.now();
      const title = parseFileNameFromPath(filePath);

      const sortedFiles = await createExtractorFromData({
        data: Uint8Array.from(readFileSync(filePath)).buffer,
        wasmBinary: readFileSync(
          require.resolve("node-unrar-js/dist/js/unrar.wasm"),
        ),
      })
        .then((v) =>
          v.extract({
            files: [...v.getFileList().fileHeaders].map((v) => v.name),
          }),
        )
        .then((v) =>
          [...v.files].sort((a, b) =>
            sortPages(a.fileHeader.name, b.fileHeader.name),
          ),
        )
        .then((v) => v.filter((v) => !v.fileHeader.name.includes("xml")));

      // const thumbnailUrl = convertToImageUrl(
      //   sortedFiles[0]?.extraction?.buffer ||
      //   sortedFiles[1].extraction?.buffer ||
      //   sortedFiles[2].extraction?.buffer!,
      // );

      const result = db
        .insert(issues)
        .values({
          id: v4(),
          title,
          dateCreated: new Date(),
        })
        .returning({
          id: issues.id,
        }).get();

      for (const file of sortedFiles) {
        if (!file.extraction) continue;
        const blob = new Blob([file.extraction.buffer]);
        await db.insert(attachments).values({
          blob,
          issueId: result.id,
          id: v4(),
        });
      }

      console.log({
        duration: Date.now() - start,
      });

      return ok({
        completed: true,
        message: null,
      });
    } catch (e) {
      console.log({ e });
      watcherIndex.removeFromIndex(filePath);
      return err({
        message: "error occurred in worker",
        completed: false,
      });
    }
  }
  export async function handleZip(filePath: string) {
    try {
      const start = Date.now();

      const fileName = parseFileNameFromPath(filePath);

      const files = new Zip(readFileSync(filePath))
        .getEntries()
        .sort((a, b) => sortPages(a.name, b.name))
        .map((v) => ({
          name: v.name,
          data: v.getData(),
          isDir: v.isDirectory,
        }));

      const filesWithoutMetadata = files.filter((v) => !v.name.includes("xml"));

      console.log({
        duration: Date.now() - start,
      });

      return ok({
        completed: true,
        message: null,
      });
    } catch (e) {
      console.log({ e });
      watcherIndex.removeFromIndex(filePath);
      return err({
        completed: false,
        message: "Error handling .cbz",
      });
    }
  }
}
