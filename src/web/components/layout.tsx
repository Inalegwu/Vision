import { computed } from "@legendapp/state";
import { Show, useObservable, useObserveEffect } from "@legendapp/state/react";
import { Button, Flex, Text, Tooltip } from "@radix-ui/themes";
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
  Sidebar,
  Trash2,
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
  const sidebar = useObservable(false);

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

    console.log(globalState$.firstLaunch.get());
    if (globalState$.firstLaunch.get()) {
      createSourceDir();
      // navigation.navigate({
      //   to: "/first-launch",
      // });
      // TODO: stop from being first launch
    }
  }, [startFileWatcher, createSourceDir]);

  return (
    <Flex
      width="100%"
      grow="1"
      className="transition bg-white dark:bg-dark-8 relative"
    >
      <AnimatePresence mode="wait" initial={false}>
        {!isFullscreen && (
          <motion.div
            initial={{
              opacity: 0,
              transform: "translateY(-50px)",
            }}
            animate={{
              opacity: 1,
              transform: "translateY(0px)",
            }}
            exit={{
              opacity: 0,
              transform: "translateY(-50px)",
            }}
            className="w-full absolute top-0 shadow-sm shadow-black/5 left-0 z-10"
          >
            <Flex
              align="center"
              justify="between"
              className="border-b-1 bg-white dark:bg-dark-7 w-full border-b-solid border-b-zinc-100 dark:border-b-zinc-800"
            >
              <Flex align="center" justify="start" gap="3">
                <Text
                  className="ml-3 font-[Title] text-yellow-500"
                  weight="medium"
                >
                  Vision
                </Text>
                <Flex gap="1">
                  <button
                    onClick={() => sidebar.set(!sidebar.get())}
                    className="px-2 py-1 rounded-md dark:text-neutral-400 cursor-pointer hover:bg-neutral-400/10 dark:hover:bg-neutral-400/5"
                  >
                    <Sidebar size={12} />
                  </button>
                  <Flex>
                    <button
                      disabled={!isNotHome}
                      className="px-2 py-1 rounded-md dark:text-neutral-400 cursor-pointer hover:bg-neutral-400/10 dark:hover:bg-neutral-400/5"
                      onClick={() => navigation.history.back()}
                    >
                      <ArrowLeft size={12} />
                    </button>
                    <button
                      className="px-2 py-1 rounded-md dark:text-neutral-400 cursor-pointer hover:bg-neutral-400/10 dark:hover:bg-neutral-400/5"
                      onClick={() => navigation.history.forward()}
                    >
                      <ArrowRight size={12} />
                    </button>
                  </Flex>
                  <Tooltip content="Add Issue To Library">
                    <AddButton />
                  </Tooltip>
                </Flex>
              </Flex>
              <Flex grow="1" gap="1" align="center" justify="center">
                <Flex grow="1" id="drag-region" p="2" />
                <button
                  className="p-2 rounded-md cursor-pointer dark:text-neutral-400 hover:bg-neutral-400/10 dark:hover:bg-neutral-400/5"
                  onClick={() =>
                    navigation.navigate({
                      to: "/",
                      startTransition: true,
                    })
                  }
                >
                  <Home size={12} />
                </button>
                <button
                  className="p-2 rounded-md cursor-pointer dark:text-neutral-400 hover:bg-neutral-400/10 dark:hover:bg-neutral-400/5"
                  onClick={() =>
                    navigation.navigate({
                      to: "/library",
                      startTransition: true,
                    })
                  }
                >
                  <Library size={12} />
                </button>
                <Flex grow="1" id="drag-region" p="2" />
              </Flex>
              <Flex align="center" justify="end">
                <ThemeButton />
                <button
                  className="p-3 hover:bg-neutral-400/10 dark:text-neutral-400 dark:hover:bg-neutral-400/5"
                  onClick={() => minimizeWindow()}
                  type="button"
                >
                  <Minus size={12} />
                </button>
                <button
                  className="p-3 hover:bg-neutral-400/10 dark:text-neutral-400 dark:hover:bg-neutral-400/5"
                  onClick={() => maximizeWindow()}
                  type="button"
                >
                  <Maximize2 size={12} />
                </button>
                <button
                  className="p-3 hover:bg-red-500 dark:text-neutral-400 hover:text-white"
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
                className="bg-light-1 dark:bg-dark-9 flex flex-col border-r-1 border-r-solid border-r-neutral-100 dark:border-r-neutral-800"
                initial={{ width: 0, display: "none", opacity: 0 }}
                animate={{ width: "19%", display: "flex", opacity: 1 }}
                exit={{ width: 0, display: "none", opacity: 0 }}
              >
                <Flex grow="1" direction="column" className="pt-10 px-3">
                  body
                </Flex>
                <Flex
                  align="center"
                  justify="between"
                  className="h-14 border-t-1 bg-white dark:bg-dark-8 border-t-solid border-t-neutral-100 dark:border-t-neutral-800 px-3"
                >
                  {/* <button className="p-2 rounded-md cursor-pointer dark:text-neutral-400 hover:bg-neutral-400/10 dark:hover:bg-neutral-400/5">
                    <Settings size={12} />
                  </button> */}
                  <SettingsButton />
                </Flex>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div animate={{ width: sidebar.get() ? "81%" : "100%" }}>
            {children}
          </motion.div>
        </Flex>
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
      className="p-2 rounded-md cursor-pointer dark:text-neutral-400 hover:bg-neutral-400/10 dark:hover:bg-neutral-400/5"
      disabled={isLoading}
      onClick={() => addIssueToLibrary()}
    >
      {isLoading ? <Spinner /> : <Plus size={13} />}
    </button>
  );
}

function SettingsButton() {
  const settingsVisible = useObservable(false);

  return (
    <>
      <button
        onClick={() => settingsVisible.set(!settingsVisible.get())}
        className="p-2 rounded-md cursor-pointer dark:text-neutral-400 hover:bg-neutral-400/10 dark:hover:bg-neutral-400/5"
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
              className="bg-white dark:bg-neutral-800 p-2 border-1 w-3/6 h-3/6 rounded-md border-solid border-neutral-200 dark:border-neutral-600"
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
                    <Text size="2" weight="medium" className="text-yellow-500">
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
                      className="p-1 rounded-md flex text-black bg-neutral-400/10 dark:text-neutral-400"
                    >
                      <Text size="1" className="ml-2">
                        Folder: {value}
                      </Text>
                      <button className="p-2 overflow-hidden space-x-2 rounded-md cursor-pointer text-red-500 hover:bg-red-400/10">
                        <Trash2 size={12} />
                      </button>
                    </Flex>
                  ))}
                </Flex>
                <Button variant="surface" className="w-full">
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
