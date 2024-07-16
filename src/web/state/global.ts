import { observable } from "@legendapp/state";
import {
  configureObservablePersistence,
  persistObservable,
} from "@legendapp/state/persist";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
import type { GlobalState } from "@shared/types";

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

persistObservable(globalState$, {
  local: "global_state",
});

persistObservable(fullScreenState$, {
  local: "fullscreen_state",
});
