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
  fullscreen: false,
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
