import Zip from "adm-zip";
import { createExtractorFromData } from "node-unrar-js";
import { readFileSync } from "node:fs";
import { parentPort } from "node:worker_threads";
import { v4 } from "uuid";
import type { z } from "zod";
import { issues, pages } from "../../schema";
import db from "../../storage";
import {
  convertToImageUrl,
  parseFileNameFromPath,
  parseWorkerMessageWithSchema,
  sortPages,
} from "../../utils";
import watcherIndex from "../indexer";
import { parsePathSchema, type parseWorkerResponse } from "../validations";
import { okAsync, err, ok } from "neverthrow";

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
    const fileName = parseFileNameFromPath(filePath);

    const exists = await db.query.issues.findFirst({
      where: (issue, { eq }) => eq(issue.issueTitle, fileName),
    });

    if (exists) {
      return okAsync({
        message: "already saved",
        completed: true,
      });
    }

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

    const thumbnailUrl = convertToImageUrl(
      sortedFiles[0]?.extraction?.buffer ||
      sortedFiles[1].extraction?.buffer ||
      sortedFiles[2].extraction?.buffer!,
    );

    const newIssue = await db
      .insert(issues)
      .values({
        id: v4(),
        thumbnailUrl,
        issueTitle: fileName,
      })
      .returning();

    for (const file of sortedFiles) {
      if (file.fileHeader.flags.directory) {
        continue;
      }

      await db.insert(pages).values({
        id: v4(),
        pageContent: convertToImageUrl(file.extraction?.buffer!),
        issueId: newIssue[0].id,
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
      message: "Error Occured while handling DB",
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

    const exists = await db.query.issues.findFirst({
      where: (issues, { eq }) => eq(issues.issueTitle, fileName),
    });

    if (exists) {
      return ok({
        completed: true,
        message: "Issue already saved",
      });
    }

    const files = new Zip(readFileSync(filePath))
      .getEntries()
      .sort((a, b) => sortPages(a.name, b.name))
      .map((v) => ({ name: v.name, data: v.getData(), isDir: v.isDirectory }));

    const filesWithoutMetadata = files.filter((v) => !v.name.includes("xml"));

    const thumbnailUrl = convertToImageUrl(
      files[0].data || files[1].data || files[2].data!,
    );

    const newIssue = await db
      .insert(issues)
      .values({
        id: v4(),
        issueTitle: fileName,
        thumbnailUrl,
      })
      .returning();

    for (const file of filesWithoutMetadata) {
      if (file.isDir) {
        continue;
      }

      await db.insert(pages).values({
        id: v4(),
        issueId: newIssue[0].id,
        pageContent: convertToImageUrl(file.data),
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
      completed: false,
      message: "Error handling .cbz",
    });
  }
}
