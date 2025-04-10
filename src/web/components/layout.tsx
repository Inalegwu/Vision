import { computed } from "@legendapp/state";
import { Show, useObservable, useObserveEffect } from "@legendapp/state/react";
import { Flex, Text, Tooltip } from "@radix-ui/themes";
import t from "@shared/config";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Home,
  Library,
  Maximize2,
  Minus,
  Plus,
  Settings,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect } from "react";
import { globalState$, settingsState$ } from "../state";
import SettingsMenu from "./settings";
import Spinner from "./spinner";
import ThemeButton from "./theme-button";

type LayoutProps = {
  children?: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const utils = t.useUtils();
  const navigation = useRouter();
  const routerState = useRouterState();

  const isNotHome = computed(() => routerState.location.pathname !== "/").get();
  const isFullscreen = globalState$.isFullscreen.get();
  const isUpdating = useObservable(false);
  const isUpdatingValue = isUpdating.get();

  const { mutate: createSourceDir } =
    t.library.createLibraryFolder.useMutation();

  const { mutate: minimizeWindow } = t.window.minimize.useMutation();
  const { mutate: maximizeWindow } = t.window.maximize.useMutation();
  const { mutate: closeWindow } = t.window.closeWindow.useMutation();

  const { mutate: startFileWatcher } =
    t.library.startLibraryWatcher.useMutation();

  t.library.additions.useSubscription(undefined, {
    onData: (data) => {
      console.log(data);
      if (data.state === "SUCCESS") {
        console.log("success");
      }
      if (data.error !== null && data.state === "ERROR") {
        console.log(data.error);
      }
      if (data.isCompleted) {
        isUpdating.set(false);
        utils.library.getLibrary.invalidate();
      }
    },
  });

  t.library.deletions.useSubscription(undefined, {
    onData: (data) => {
      if (data.isDone) {
        console.log(data);
        utils.library.invalidate();
      }
    },
  });

  useObserveEffect(() => {
    if (globalState$.colorMode.get() === "dark") {
      document.body.classList.add("dark");
      globalState$.colorMode.set("dark");
    } else {
      document.body.classList.remove("dark");
      globalState$.colorMode.set("light");
    }
  });

  useEffect(() => {
    startFileWatcher();

    (() => {
      console.log(globalState$.firstLaunch.get());
      if (globalState$.firstLaunch.get()) {
        createSourceDir();
        // navigation.navigate({
        //   to: "/first-launch",
        // });
        // TODO: stop from being first launch
      }
    })();
  }, [startFileWatcher, createSourceDir]);

  return (
    <Flex
      width="100%"
      direction="column"
      grow="1"
      className="transition bg-light-1 dark:bg-dark-6"
    >
      <AnimatePresence mode="wait" initial={false}>
        {!isFullscreen && (
          <motion.div
            initial={{ display: "none", opacity: 0, height: 0 }}
            animate={{ display: "flex", opacity: 1, height: 34 }}
            exit={{ display: "none", opacity: 0, height: 0 }}
            style={{ width: "100%" }}
          >
            <Flex
              align="center"
              justify="between"
              className="border-b-1 w-full border-b-solid border-b-zinc-100 dark:border-b-zinc-800"
            >
              <Flex align="center" justify="start" gap="3">
                <Text
                  className="ml-2.5 font-[Title] text-yellow-500"
                  weight="medium"
                >
                  Vision
                </Text>
                <Flex>
                  <button
                    disabled={!isNotHome}
                    onClick={() => navigation.history.back()}
                    className="cursor-pointer dark:text-zinc-400 px-3 py-2"
                  >
                    <ArrowLeft size={10} />
                  </button>
                  <button
                    onClick={() => navigation.history.forward()}
                    className="cursor-pointer dark:text-zinc-400 px-3 py-2"
                  >
                    <ArrowRight size={10} />
                  </button>
                  <SettingsButton />
                  <Tooltip content="Add Issue To Library">
                    <AddButton />
                  </Tooltip>
                </Flex>
              </Flex>
              <Flex grow="1" align="center" justify="center">
                <Flex grow="1" id="drag-region" p="2" />
                <button
                  type="button"
                  className="cursor-pointer dark:text-zinc-400 px-3 py-2"
                  onClick={() =>
                    navigation.navigate({
                      to: "/",
                      startTransition: true,
                    })
                  }
                >
                  <Home size={10.5} />
                </button>
                <button
                  type="button"
                  className="cursor-pointer dark:text-zinc-400 px-3 py-2"
                  onClick={() =>
                    navigation.navigate({
                      to: "/library",
                      startTransition: true,
                    })
                  }
                >
                  <Library size={10.5} />
                </button>
                <Flex grow="1" id="drag-region" p="2" />
              </Flex>
              <Flex align="center" justify="end">
                <ThemeButton />
                <button
                  className="px-3 py-2 text-zinc-400 cursor-pointer hover:dark:bg-zinc-100/5"
                  onClick={() => minimizeWindow()}
                  type="button"
                >
                  <Minus size={9} />
                </button>
                <button
                  className="px-3 py-2 text-zinc-400 cursor-pointer hover:dark:bg-zinc-100/5"
                  onClick={() => maximizeWindow()}
                  type="button"
                >
                  <Maximize2 size={9} />
                </button>
                <button
                  className="px-3 py-2 text-red-600 cursor-pointer"
                  onClick={() => closeWindow()}
                  type="button"
                >
                  <X size={9} />
                </button>
              </Flex>
            </Flex>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence initial={false}>{children}</AnimatePresence>
      <AnimatePresence>
        {settingsState$.visible.get() && <SettingsMenu />}
      </AnimatePresence>
    </Flex>
  );
}

function AddButton() {
  const utils = t.useUtils();
  const { mutate: addIssueToLibrary, isLoading } = t.issue.addIssue.useMutation(
    {
      onSuccess: () => utils.library.invalidate(),
    },
  );

  return (
    <button
      disabled={isLoading}
      onClick={() => addIssueToLibrary()}
      className="cursor-pointer dark:text-zinc-400 px-3 py-2"
    >
      {isLoading ? <Spinner /> : <Plus size={10} />}
    </button>
  );
}

function SettingsButton() {
  const settingsVisible = useObservable(false);

  return (
    <>
      <button
        onClick={() => settingsVisible.set(!settingsVisible.get())}
        className="cursor-pointer dark:text-zinc-400 px-3 py-2"
      >
        <Settings size={10} />
      </button>
      <AnimatePresence>
        <Show if={settingsVisible}>
          <motion.div
            initial={{ opacity: 0, scale: 0, display: "none" }}
            animate={{
              opacity: 1,
              scale: 1,
              display: "flex",
            }}
            exit={{ opacity: 0, scale: 0, display: "none" }}
            transition={{
              duration: 0.2,
            }}
            className="w-full h-full top-0 left-0 flex items-center justify-center absolute z-20"
          >
            <Flex
              direction="column"
              className="bg-white-100 dark:bg-neutral-800 border-1 w-3/6 h-3/6 rounded-md border-solid border-neutral-200 dark:border-neutral-600"
            >
              <Flex width="100%" align="center" justify="end">
                <button
                  className="px-3 py-3 text-red-400"
                  onClick={() => settingsVisible.set(false)}
                >
                  <X size={11} />
                </button>
              </Flex>
            </Flex>
          </motion.div>
        </Show>
      </AnimatePresence>
    </>
  );
}
