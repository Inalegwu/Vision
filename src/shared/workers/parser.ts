import { createExtractorFromData } from "node-unrar-js";
import { readFileSync } from "node:fs";
import { parentPort } from "node:worker_threads";
import type { z } from "zod";
import { sortPages } from "../utils";
import { parsePathSchema, type parseWorkerResponse } from "../validations";

const port = parentPort;

if (!port) throw new Error("Illegal State");

console.log("parser started...");

port.on("message", async (v) => {
  const data = parsePathSchema.safeParse(v);

  if (!data.success) {
    port.postMessage({
      completed: false,
      message: "Invalid message data sent",
    });
    return;
  }

  if (data.data.parsePath.includes("cbz")) {
    return;
  }

  if (data.data.parsePath.includes("cbr")) {
    return handleRar(data.data.parsePath);
  }

  port.postMessage({
    completed: false,
    message: "File extenstion isn't a comic file",
  });
});

async function handleRar(
  filePath: string,
): Promise<z.infer<typeof parseWorkerResponse>> {
  const fileName = filePath
    .replace(/^.*[\\\/]/, "")
    .replace(/\.[^/.]+$/, "")
    .replace(/(\d+)$/, "")
    .replace("-", "");

  //   const exists = await db.query.issues.findFirst({
  //     where: (issue, { eq }) => eq(issue.issueTitle, fileName),
  //   });

  //   if (exists) {
  //     return {
  //       message: "already saved",
  //       completed: true,
  //     };
  //   }

  console.log(fileName);

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

  console.log({ metaDataFile, sortedWithoutMeta });

  return {
    completed: true,
    message: null,
  };
}
