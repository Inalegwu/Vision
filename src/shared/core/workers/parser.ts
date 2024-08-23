import Zip from "adm-zip";
import { createExtractorFromData } from "node-unrar-js";
import { readFileSync } from "node:fs";
import { parentPort } from "node:worker_threads";
import {
  convertToImageUrl,
  parseFileNameFromPath,
  parseWorkerMessageWithSchema,
  sortPages,
} from "../../utils";
import watcherIndex from "../indexer";
import { parsePathSchema } from "../validations";
import { okAsync, err, ok } from "neverthrow";
import db from "@src/shared/storage";
import { v4 } from "uuid";


const port = parentPort;

if (!port) throw new Error("Illegal State");

port.on("message", (message) => parseWorkerMessageWithSchema(parsePathSchema, message).match(async ({ data }) => {
  console.log({ message: "match success" });
  switch (data.action) {
    case "LINK": {
      if (data.parsePath.includes("cbr")) {
        const result = await handleRar(data.parsePath)

        result.match((res) => {
          console.log({ res });
        }, (err) => {
          console.error({ err })
        })
        return;
      }
      
      if (data.parsePath.includes("cbz")) {
        const result = await handleZip(data.parsePath);
  
        result.match((res) => {
          console.log({ res })
        }, (err) => {
          console.error({ err })
        })
        return
      }

    }
    case "UNLINK": {
      // TODO
      console.log({ message: "todo" })
    }
  }

}, ({ message }) => {
  console.error({ message });
}))

async function handleRar(
  filePath: string,
) {
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

    const buf = sortedFiles[0]?.extraction?.buffer || sortedFiles[1].extraction?.buffer || sortedFiles[2].extraction?.buffer!
    const thumbnailBlob = new Blob([buf], { type: "image/png" });

    console.log({ thumbnailBlob })

    const res = await db.put({
      id: v4(),
      title,
      dateAdded: new Date().toISOString(),
    });

    await db.putAttachment(res.id, "thumbnail-url", res.rev, thumbnailBlob, "image/png")

    for (const file of sortedFiles) {
      const fileBlob = new Blob([file.extraction?.buffer!], { type: "image/png" });
      await db.putAttachment(res.id, `${file.fileHeader.name}`, res.rev, fileBlob, "image/png").then((res) => {
        console.log({ res })
      });
    }

    console.log({
      duration: Date.now() - start,
    });

    return okAsync({
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

async function handleZip(
  filePath: string,
) {
  try {
    const start = Date.now();

    const fileName = parseFileNameFromPath(filePath);

   

    

    const files = new Zip(readFileSync(filePath))
      .getEntries()
      .sort((a, b) => sortPages(a.name, b.name))
      .map((v) => ({ name: v.name, data: v.getData(), isDir: v.isDirectory }));

    const filesWithoutMetadata = files.filter((v) => !v.name.includes("xml"));

    const thumbnailUrl = convertToImageUrl(
      files[0].data || files[1].data || files[2].data!,
    );

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
