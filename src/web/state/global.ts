import { observable } from "@legendapp/state";
import {
  configureObservablePersistence,
  persistObservable,
} from "@legendapp/state/persist";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
import type { GlobalState, ReadingState } from "@shared/types";

configureObservablePersistence({
  pluginLocal: ObservablePersistLocalStorage,
});

export const globalState$ = observable<GlobalState>({
  colorMode: "light",
  firstLaunch: true,
  sourceDir: null,
  user: null,
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
  currentlyReading: null,
  doneReading: null,
});

persistObservable(globalState$, {
  local: "global_state",
});

persistObservable(fullScreenState$, {
  local: "fullscreen_state",
});

persistObservable(readingState$, {
  local: "reading_state",
});
