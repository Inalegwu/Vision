import { NodeRuntime } from "@effect/platform-node";
import { Layer } from "effect";
import { ParserService } from "./parser/service";
import { WatcherService } from "./watcher/service";

const CoreLive = Layer.mergeAll(WatcherService, ParserService);

NodeRuntime.runMain(Layer.launch(CoreLive));
