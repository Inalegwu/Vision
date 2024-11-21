import { NodeRuntime } from "@effect/platform-node";
import { Layer } from "effect";
import { parentPort } from "node:worker_threads";
import { ParserService } from "./parser/service";
import { WatcherService } from "./watcher/service";

const port = parentPort;

if (!port) throw new Error("Parse Process Port is Missing");

const CoreLive = Layer.mergeAll(WatcherService, ParserService);

port.on("message", () => NodeRuntime.runMain(Layer.launch(CoreLive)));
