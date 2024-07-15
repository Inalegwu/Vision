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
  colorMode: "dark",
  sourceFolder: null,
});

export const settingsState$ = observable<{
  visible: boolean;
}>({
  visible: false,
});

persistObservable(globalState$, {
  local: "global_state",
});
