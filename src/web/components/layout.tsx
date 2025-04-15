import { computed } from "@legendapp/state";
import { Show, useObservable, useObserveEffect } from "@legendapp/state/react";
import { Button, Flex, Text, Tooltip } from "@radix-ui/themes";
import t from "@shared/config";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { capitalize } from "effect/String";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Home,
  Library,
  Maximize2,
  Minus,
  Plus,
  RefreshCw,
  Settings,
  Sidebar,
  Trash2,
  X,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect } from "react";
import { globalState$, settingsState$ } from "../state";
import SettingsMenu from "./settings";
import Spinner from "./spinner";
import ThemeButton from "./theme-button";

type LayoutProps = {
  children?: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const qC = useQueryClient();
  const utils = t.useUtils();
  const navigation = useRouter();
  const routerState = useRouterState();

  const isNotHome = computed(() => routerState.location.pathname !== "/").get();
  const isFullscreen = globalState$.isFullscreen.get();
  const isUpdating = useObservable(false);
  const sidebar = useObservable(false);

  const { mutate: createSourceDir } =
    t.library.createLibraryFolder.useMutation();

  const { mutate: minimizeWindow } = t.window.minimize.useMutation();
  const { mutate: maximizeWindow } = t.window.maximize.useMutation();
  const { mutate: closeWindow } = t.window.closeWindow.useMutation();

  const { mutate: startFileWatcher } =
    t.library.startLibraryWatcher.useMutation();

  const refreshLibrary = useCallback(() => {}, []);

  t.library.additions.useSubscription(undefined, {
    onData: (data) => {
      isUpdating.set(true);
      if (data.isCompleted && data.state === "SUCCESS") {
        console.log("success");
        isUpdating.set(false);
        utils.library.getLibrary.invalidate();
      }
      if (data.isCompleted && data.state === "ERROR") {
        console.log("error");
        isUpdating.set(false);
        console.log(data.error);
      }
    },
  });

  t.library.deletions.useSubscription(undefined, {
    onData: (data) => {
      if (data.isDone) {
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

    if (globalState$.firstLaunch.get()) {
      createSourceDir();
      navigation.navigate({
        to: "/first-launch",
      });
    }
  }, [startFileWatcher, createSourceDir, navigation]);

  return (
    <Flex
      width="100%"
      grow="1"
      className="transition bg-white dark:bg-moonlightBase relative"
    >
      <AnimatePresence mode="wait" initial={false}>
        {!isFullscreen && (
          <motion.div
            initial={{
              transform: "translateY(-50px)",
            }}
            animate={{
              transform: "translateY(0px)",
            }}
            exit={{
              transform: "translateY(-50px)",
            }}
            className="w-full absolute top-0 shadow-sm shadow-black/5 dark:shadow-none left-0 z-10"
          >
            <Flex
              align="center"
              justify="between"
              className="border-b-1 bg-white dark:bg-moonlightInterface w-full"
            >
              <Flex align="center" justify="start" gap="3">
                <Text
                  className="ml-3 font-[Title] text-moonlightOrange"
                  weight="medium"
                >
                  Vision
                </Text>
                <Flex gap="1">
                  <button
                    onClick={() => sidebar.set(!sidebar.get())}
                    className="px-2 py-1 rounded-md dark:text-moonlightText cursor-pointer hover:bg-neutral-400/10 dark:hover:bg-neutral-400/5"
                  >
                    <Sidebar size={12} />
                  </button>
                  <Tooltip content="Add Issue To Library">
                    <AddButton />
                  </Tooltip>
                </Flex>
              </Flex>
              <Flex grow="1" gap="1" align="center" justify="center">
                <Flex grow="1" id="drag-region" p="2" />
                <Flex>
                  <button
                    disabled={!isNotHome}
                    className="px-2 py-2 rounded-md dark:text-moonlightText cursor-pointer hover:bg-neutral-400/10 dark:hover:bg-neutral-400/5"
                    onClick={() => navigation.history.back()}
                  >
                    <ArrowLeft size={12} />
                  </button>
                  <button
                    className="px-2 py-2 rounded-md dark:text-moonlightText cursor-pointer hover:bg-neutral-400/10 dark:hover:bg-neutral-400/5"
                    onClick={() => navigation.history.forward()}
                  >
                    <ArrowRight size={12} />
                  </button>
                </Flex>
                <Flex
                  align="center"
                  justify="center"
                  grow="1"
                  gap="2"
                  className="p-1 rounded-lg w-2/6 bg-neutral-100/50 dark:bg-neutral-100/4 border-1 border-solid border-neutral-100 dark:border-neutral-100/5"
                >
                  <Text size="1" className="text-moonlightSlight">
                    {capitalize(
                      routerState.location.pathname === "/"
                        ? "Home"
                        : routerState.location.pathname === "/library"
                          ? "Library"
                          : "Exploring",
                    )}
                  </Text>
                </Flex>
                <ThemeButton />
                <Flex grow="1" id="drag-region" p="2" />
              </Flex>
              <Flex align="center" justify="end">
                <button
                  className="p-3 hover:bg-neutral-400/10 dark:text-moonlightText dark:hover:bg-neutral-400/5"
                  onClick={() => minimizeWindow()}
                  type="button"
                >
                  <Minus size={12} />
                </button>
                <button
                  className="p-3 hover:bg-neutral-400/10 dark:text-moonlightText dark:hover:bg-neutral-400/5"
                  onClick={() => maximizeWindow()}
                  type="button"
                >
                  <Maximize2 size={12} />
                </button>
                <button
                  className="p-3 hover:bg-red-500 dark:text-moonlightText hover:text-white"
                  onClick={() => closeWindow()}
                  type="button"
                >
                  <X size={12} />
                </button>
              </Flex>
            </Flex>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence initial={false}>
        <Flex width="100%" height="100%">
          <AnimatePresence>
            {sidebar.get() && (
              <motion.div
                className="bg-light-1 dark:bg-moonlightFocusLow flex flex-col"
                initial={{ width: 0, display: "none", opacity: 0 }}
                animate={{ width: "20%", display: "flex", opacity: 1 }}
                exit={{ width: 0, display: "none", opacity: 0 }}
              >
                <Flex
                  grow="1"
                  gap="2"
                  direction="column"
                  className="pt-13 px-3"
                >
                  <Link
                    className="text-black space-x-2 hover:bg-neutral-400/6 px-2 py-2 rounded-md text-moonlightSlight"
                    to="/"
                  >
                    <Flex align="center" justify="start" gap="2">
                      <Home size={14} />
                      <Text weight="medium" size="2">
                        Home
                      </Text>
                    </Flex>
                  </Link>
                  <Link
                    className="text-black space-x-2 hover:bg-neutral-400/6 px-2 py-2 rounded-md text-moonlightSlight"
                    to="/library"
                  >
                    <Flex align="center" justify="start" gap="2">
                      <Library size={14} />
                      <Text weight="medium" size="2">
                        Library
                      </Text>
                    </Flex>
                  </Link>
                </Flex>
                <Flex
                  align="center"
                  justify="start"
                  gap="2"
                  className="h-14 bg-white dark:bg-moonlightOverlay border-t-solid border-t-1 border-t-neutral-100 dark:border-t-moonlightSlight/10 px-3"
                >
                  <SettingsButton />
                  <button
                    onClick={() => refreshLibrary()}
                    className="px-2 py-2 rounded-md dark:text-moonlightText cursor-pointer hover:bg-neutral-400/10 dark:hover:bg-neutral-400/5"
                  >
                    <RefreshCw size={12} />
                  </button>
                </Flex>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div animate={{ width: sidebar.get() ? "80%" : "100%" }}>
            {children}
          </motion.div>
        </Flex>
      </AnimatePresence>
      <AnimatePresence>
        {isUpdating.get() && (
          <motion.div
            initial={{
              transform: "translateY(50px)",
            }}
            animate={{ transform: "translateY(0px)" }}
            exit={{ transform: "translateY(50px)" }}
            className="p-2 flex items-center justify-center space-x-2 rounded-full bg-moonlightOrange/5 text-moonlightOrange absolute z-10 bottom-4 left-[46%] border-1 border-solid border-moonlightOrange/10"
          >
            <Spinner className="border-moonlightOrange" size={13} />
            <Text size="1">Adding Issue To Library</Text>
          </motion.div>
        )}
      </AnimatePresence>
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
      className="p-2 rounded-md cursor-pointer dark:text-moonlightText hover:bg-neutral-400/8 dark:hover:bg-neutral-400/5"
      disabled={isLoading}
      onClick={() => addIssueToLibrary()}
    >
      {isLoading ? <Spinner /> : <Plus size={13} />}
    </button>
  );
}

function SettingsButton() {
  const { mutate: addSourceDir } = t.library.addSourceDirectory.useMutation({
    onSuccess: (data) => {
      console.log(data);
      if (!data.complete || !data.filePaths) return;

      for (const dir of data.filePaths) {
        globalState$.sourceDirectories.push(dir);
      }
    },
  });

  const settingsVisible = useObservable(false);

  return (
    <>
      <button
        onClick={() => settingsVisible.set(!settingsVisible.get())}
        className="p-2 rounded-md cursor-pointer dark:text-moonlightText hover:bg-neutral-400/10 dark:hover:bg-neutral-400/5"
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
              gap="1"
              className="bg-white dark:bg-moonlightOverlay p-2 border-1 w-3/6 h-3/6 rounded-md border-solid border-neutral-200 dark:border-neutral-800"
            >
              <Flex width="100%" align="center" justify="end">
                <button
                  className="p-2 rounded-md cursor-pointer text-red-500 hover:bg-red-400/10"
                  onClick={() => settingsVisible.set(false)}
                >
                  <X size={11} />
                </button>
              </Flex>
              <Flex mt="2" gap="1" direction="column">
                <Flex gap="3" direction="column">
                  <Flex direction="column">
                    <Text
                      size="2"
                      weight="medium"
                      className="text-moonlightOrange"
                    >
                      Comics Directory
                    </Text>
                    <Text weight="medium" size="1" color="gray">
                      Tell Vision where to look for your library
                    </Text>
                  </Flex>
                  {globalState$.sourceDirectories.get().map((value, idx) => (
                    <Flex
                      align="center"
                      justify="between"
                      key={`${value}-${idx}`}
                      className="p-1 rounded-md flex text-black bg-neutral-400/8 dark:text-neutral-400"
                    >
                      <Text size="1" className="ml-2">
                        Folder: {value}
                      </Text>
                      <button
                        onClick={() =>
                          globalState$.sourceDirectories.set([
                            ...globalState$.sourceDirectories
                              .get()
                              .filter((dir) => dir !== value),
                          ])
                        }
                        className="p-2 overflow-hidden space-x-2 rounded-md cursor-pointer text-red-500 hover:bg-red-400/10"
                      >
                        <Trash2 size={12} />
                      </button>
                    </Flex>
                  ))}
                </Flex>
                <Button
                  onClick={() => addSourceDir()}
                  variant="surface"
                  size="1"
                  className="cursor-pointer"
                >
                  <Text size="1">Add Source Directory</Text>
                </Button>
              </Flex>
            </Flex>
          </motion.div>
        </Show>
      </AnimatePresence>
    </>
  );
}
