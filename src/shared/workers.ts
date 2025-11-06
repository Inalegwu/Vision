import { Worker } from "node:worker_threads";
import parseWorker from "./core/workers/parser?modulePath";
import watchWorker from "./core/workers/watcher?modulePath";
import deleteWorker from "./core/workers/deletion?modulePath";
import cacheWorker from "./core/workers/cache?modulePath";

export const parser = new Worker(parseWorker, {
  name: "parse-worker"
});

export const watcher = new Worker(watchWorker, {
  name: "watch-worker"
});

export const cache = new Worker(cacheWorker, {
  name: "cache-worker"
})

export const deleter = new Worker(deleteWorker, {
  name: "deletion-worker"
});
