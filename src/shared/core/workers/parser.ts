import { parentPort } from "node:worker_threads";
import { parseWorkerMessageWithSchema } from "../../utils";
import { parsePathSchema } from "../validations";
import { Archive } from "../modules/archive";

const port = parentPort;

if (!port) throw new Error("Illegal State");

console.log({ message: "starting parser worker" });

port.on("message", (message) =>
  parseWorkerMessageWithSchema(parsePathSchema, message).match(
    async ({ data }) => {
      switch (data.action) {
        case "LINK": {
          if (data.parsePath.includes("cbr")) {
            const result = await Archive.handleRar(data.parsePath);

            result.match(
              (res) => {
                console.log({ res });
              },
              (err) => {
                console.error({ err });
              },
            );
            return;
          }

          if (data.parsePath.includes("cbz")) {
            const result = await Archive.handleZip(data.parsePath);

            result.match(
              (res) => {
                console.log({ res });
              },
              (err) => {
                console.error({ err });
              },
            );
            return;
          }
          return;
        }
        case "UNLINK": {
          // TODO
          console.log({ message: "todo" });
          return;
        }
      }
    },
    ({ message }) => {
      console.error({ message });
    },
  ),
);
