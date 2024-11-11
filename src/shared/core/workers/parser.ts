import { parentPort } from "node:worker_threads";
import { parseWorkerMessageWithSchema } from "../../utils";
import { Archive } from "../archive";
import { parsePathSchema } from "../validations";

const port = parentPort;

if (!port) throw new Error("Illegal State");

class ParserError {
  readonly _tag = "ParserError";
  constructor(readonly message: string) {}
}

port.on("message", (message) =>
  parseWorkerMessageWithSchema(parsePathSchema, message).match(
    async ({ data }) => {
      switch (data.action) {
        case "LINK": {
          if (data.parsePath.includes("cbr")) {
            return await Archive.handleRar(data.parsePath);
          }

          if (data.parsePath.includes("cbz")) {
            // const result = await handleZip(data.parsePath);

            // result.match(
            //   (res) => {
            //     console.log({ res });
            //   },
            //   (err) => {
            //     console.error({ err });
            //   },
            // );
            return await Archive.handleZip(data.parsePath);
          }

          return;
        }
        case "UNLINK": {
        }
      }
    },
    ({ message }) => {
      console.error({ message });
    },
  ),
);
