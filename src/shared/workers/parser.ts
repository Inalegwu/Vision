import { eq } from "drizzle-orm";
import { createExtractorFromData } from "node-unrar-js";
import { readFileSync } from "node:fs";
import { parentPort } from "node:worker_threads";
import { v4 } from "uuid";
import type { z } from "zod";
import { issues, pages } from "../schema";
import db from "../storage";
import { convertToImageUrl, sortPages } from "../utils";
import { parsePathSchema, type parseWorkerResponse } from "../validations";

const port = parentPort;

if (!port) throw new Error("Illegal State");

console.log("parser started...");

port.on("message", async (v) => {
  const message = parsePathSchema.safeParse(v);

  if (!message.success) {
    port.postMessage({
      completed: false,
      message: "Invalid message data sent",
    });
    return;
  }

  if (message.data.parsePath.includes("cbz")) {
    return;
  }

  if (message.data.parsePath.includes("cbr")) {
    switch (message.data.action) {
      case "LINK": {
        const result = await handleRar(message.data.parsePath);

        port.postMessage(result);

        return;
      }

      case "UNLINK": {
        const result = await unlinkRar(message.data.parsePath);

        port.postMessage(result);

        return;
      }

      default: {
        return;
      }
    }
  }

  port.postMessage({
    completed: false,
    message: "File extenstion isn't a comic file",
  });
});

async function handleRar(
  filePath: string,
): Promise<z.infer<typeof parseWorkerResponse>> {
  try {
    const fileName = filePath
      .replace(/^.*[\\\/]/, "")
      .replace(/\.[^/.]+$/, "")
      .replace(/(\d+)$/, "")
      .replace("-", "");

    const exists = await db.query.issues.findFirst({
      where: (issue, { eq }) => eq(issue.issueTitle, fileName),
    });

    if (exists) {
      return {
        message: "already saved",
        completed: true,
      };
    }

    console.log({ fileName });

    const extractor = await createExtractorFromData({
      data: Uint8Array.from(readFileSync(filePath)).buffer,
      wasmBinary: readFileSync(
        require.resolve("node-unrar-js/dist/js/unrar.wasm"),
      ),
    });

    const extracted = extractor.extract({
      files: [...extractor.getFileList().fileHeaders].map((v) => v.name),
    });

    const sortedFiles = [...extracted.files].sort((a, b) =>
      sortPages(a.fileHeader.name, b.fileHeader.name),
    );
    const metaDataFile = sortedFiles.find((v) =>
      v.fileHeader.name.includes("xml"),
    );
    const sortedWithoutMeta = sortedFiles.filter(
      (v) => !v.fileHeader.name.includes("xml"),
    );

    const thumbnailUrl = convertToImageUrl(
      sortedFiles[0]?.extraction?.buffer || sortedFiles[1].extraction?.buffer!,
    );

    const newIssue = await db
      .insert(issues)
      .values({
        id: v4(),
        thumbnailUrl,
        issueTitle: fileName,
      })
      .returning();

    console.log(newIssue);

    for (const file of sortedWithoutMeta) {
      if (file.fileHeader.flags.directory) {
        continue;
      }

      await db.insert(pages).values({
        id: v4(),
        pageContent: convertToImageUrl(file.extraction?.buffer!),
        issueId: newIssue[0].id,
      });
    }

    return {
      completed: true,
      message: null,
    };
  } catch (e) {
    console.log({ e });
    return {
      message: "Error Occured while handling DB",
      completed: false,
    };
  }
}

async function unlinkRar(
  filePath: string,
): Promise<z.infer<typeof parseWorkerResponse>> {
  const fileName = filePath
    .replace(/^.*[\\\/]/, "")
    .replace(/\.[^/.]+$/, "")
    .replace(/(\d+)$/, "")
    .replace("-", "");

  const exists = await db.query.issues.findFirst({
    where: (issues, { eq }) => eq(issues.issueTitle, fileName),
  });

  if (!exists) {
    return {
      completed: true,
      message: "File doesn't exist",
    };
  }

  const finalized = db.delete(issues).where(eq(issues.id, exists.id)).returning;

  console.log(finalized);

  return {
    completed: true,
    message: null,
  };
}
