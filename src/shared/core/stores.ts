import { createSessionPersister } from "tinybase/persisters/persister-browser";
import { createWsSynchronizer } from "tinybase/synchronizers/synchronizer-ws-client";
import { createMergeableStore } from "tinybase/with-schemas";
import { WebSocket } from "ws";

export const readingStateStore = createMergeableStore().setTablesSchema({
  doneReading: {
    issueId: {
      type: "string",
    },
    issueTitle: {
      type: "string",
    },
    dateCompleted: {
      type: "string",
    },
    thumbnailUrl: {
      type: "string",
    },
  },
  currentlyReading: {
    issueId: {
      type: "string",
    },
    issueTitle: {
      type: "string",
    },
    pageNumber: {
      type: "number",
    },
    totalPages: {
      type: "number",
    },
    thumbnailUr: {
      type: "string",
    },
  },
});

const persister = createSessionPersister(
  readingStateStore,
  "readingStateStore",
);

persister.save();
persister.startAutoSave();
persister.startAutoLoad();

(async () => {
  const synchronizer = await createWsSynchronizer(
    readingStateStore,
    new WebSocket("ws://localhost:8048"),
  );

  await synchronizer.startSync();
})();
