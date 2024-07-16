import Zip from "adm-zip";
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

port.on("message", async (v) => {
  const message = parsePathSchema.safeParse(v);

  if (!message.success) {
    port.postMessage({
      completed: false,
      message: "Invalid message data sent",
    });
    return;
  }

  switch (message.data.action) {
    case "LINK": {
      if (message.data.parsePath.includes("cbr")) {
        const result = await handleRar(message.data.parsePath);
        port.postMessage(result);
      }

      if (message.data.parsePath.includes("cbz")) {
        const result = handleZip(message.data.parsePath);

        port.postMessage(result);
      }

      return;
    }

    case "UNLINK": {
      const result = await unlinkIssue(message.data.parsePath);

      port.postMessage(result);

      return;
    }

    default: {
      port.postMessage({
        completed: false,
        message: "File extenstion isn't a comic file",
      });
      return;
    }
  }
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
    const sortedWithoutMeta = sortedFiles.filter(
      (v) => !v.fileHeader.name.includes("xml"),
    );

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
    return {
      message: "Error Occured while handling DB",
      completed: false,
    };
  }
}

async function unlinkIssue(
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

  return {
    completed: true,
    message: null,
  };
}

async function handleZip(
  filePath: string,
): Promise<z.infer<typeof parseWorkerResponse>> {
  try {
    const fileName = filePath
      .replace(/^.*[\\\/]/, "")
      .replace(/\.[^/.]+$/, "")
      .replace(/(\d+)$/, "")
      .replace("-", "");

    const exists = await db.query.issues.findFirst({
      where: (issues, { eq }) => eq(issues.issueTitle, fileName),
    });

    if (exists) {
      return {
        completed: true,
        message: "Issue already saved",
      };
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

    return {
      completed: true,
      message: null,
    };
  } catch (e) {
    console.log({ e });
    return {
      completed: false,
      message: "Error handling .cbz",
    };
  }
}
