import { observable } from "@legendapp/state";
import {
  configureObservablePersistence,
  persistObservable,
} from "@legendapp/state/persist";
import {
  ObservablePersistLocalStorage,
  ObservablePersistSessionStorage,
} from "@legendapp/state/persist-plugins/local-storage";

configureObservablePersistence({
  pluginLocal: ObservablePersistLocalStorage,
});

export const globalState$ = observable<GlobalState>({
  colorMode: "light",
  firstLaunch: true,
  isFullscreen: false,
  libraryView: "issues",
  sourceDirectory: null,
});

export const fullScreenState$ = observable<{ isFullscreen: boolean }>({
  isFullscreen: false,
});

export const readingState$ = observable<ReadingState>({
  doneReading: new Map<string, DoneReading>(),
  currentlyReading: new Map<string, CurrentlyReading>(),
});

persistObservable(globalState$, {
  local: "global_state",
});

persistObservable(readingState$, {
  local: "reading_state",
  pluginLocal: ObservablePersistSessionStorage,
});
