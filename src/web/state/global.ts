import { observable } from "@legendapp/state";
import {
  configureObservablePersistence,
  persistObservable,
} from "@legendapp/state/persist";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
import type {
  DoneIssue,
  GlobalState,
  ReadingIssue,
  ReadingState,
} from "@shared/types";

configureObservablePersistence({
  pluginLocal: ObservablePersistLocalStorage,
});

export const globalState$ = observable<GlobalState>({
  colorMode: "light",
  firstLaunch: true,
});

export const fullScreenState$ = observable<{ isFullscreen: boolean }>({
  isFullscreen: false,
});

export const settingsState$ = observable<{
  visible: boolean;
}>({
  visible: false,
});

export const readingState$ = observable<ReadingState>({
  currentlyReading: new Map<string, ReadingIssue>(),
  doneReading: new Map<string, DoneIssue>(),
});

persistObservable(globalState$, {
  local: "global_state",
});

persistObservable(readingState$, {
  local: "reading_state",
});
