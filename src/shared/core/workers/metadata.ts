import { parseWorkerMessageWithSchema } from "@src/shared/utils";
import { Micro } from "effect";
import { parentPort } from "node:worker_threads";
import { metadataWorkerSchema } from "../validations";

const port = parentPort;

if (!port) throw new Error("Illegal State");

class MetadataError {
  readonly _tag = "MetadataError";
  constructor(readonly cause: unknown) {}
}

type Metadata = {
  name: string;
  description: string;
  writer: string;
  artist: string;
  publisher: "DC" | "MARVEL" | "IMAGE" | "DARK HORSE" | "OTHER";
};

function getAndSaveIssueMetadata(issueName: string) {
  return Micro.tryPromise({
    try: async () => {
      const issueMetadata = (await fetch(
        `https://localhost:7000/issue/${issueName}`,
      ).then((res) => res.json())) as Metadata;

      console.log({ issueMetadata });
    },
    catch: (cause) => new MetadataError({ cause }),
  });
}

port.on("message", (message) =>
  parseWorkerMessageWithSchema(metadataWorkerSchema, message).match(
    ({ data }) => Micro.runPromise(getAndSaveIssueMetadata(data.issueName)),
    (message) => {
      console.log({ message });
    },
  ),
);
