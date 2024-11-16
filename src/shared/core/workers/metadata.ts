import {
  type MetadataSchema,
  metadataWorkerSchema,
} from "@shared/core/validations";
import { parseWorkerMessageWithSchema } from "@src/shared/utils";
import { Data, Micro } from "effect";
import { parentPort } from "node:worker_threads";

const port = parentPort;

if (!port) throw new Error("Illegal State");

class MetadataError extends Data.TaggedError("metadata-error")<{
  cause: unknown;
}> {}

type Metadata = Readonly<{
  name: string;
  description: string;
  writer: string;
  artist: string;
  publisher: "DC" | "MARVEL" | "IMAGE" | "DARK HORSE" | "OTHER";
}>;

function getAndSaveIssueMetadata({ issueName }: MetadataSchema) {
  return Micro.tryPromise({
    try: async () => {
      const issueMetadata = (await fetch(
        `https://localhost:7000/issue/${issueName}`,
      ).then((res) => res.json())) as Metadata;

      console.log({ issueMetadata });
    },
    catch: (cause) => new MetadataError({ cause }),
  }).pipe(Micro.tapError((error) => Micro.sync(() => console.log(error))));
}

port.on("message", (message) =>
  parseWorkerMessageWithSchema(metadataWorkerSchema, message).match(
    (data) =>
      Micro.runPromise(getAndSaveIssueMetadata({ issueName: data.issueName })),
    (message) => {
      console.log({ message });
    },
  ),
);
