import { computed } from "@legendapp/state";
import { Show, useObservable, useObserveEffect } from "@legendapp/state/react";
import { Flex, Text, Tooltip } from "@radix-ui/themes";
import t from "@shared/config";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { capitalize } from "effect/String";
import { Home, Sidebar } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useCallback, useEffect } from "react";
import { globalState$ } from "../state";
import Icon from "./icon";
import Spinner from "./spinner";
import ThemeButton from "./theme-button";
import Toast, { toast } from "./toast";

type LayoutProps = {
  children?: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const utils = t.useUtils();
  const navigation = useRouter();
  const routerState = useRouterState();

  const { mutate: minimizeWindow } = t.window.minimize.useMutation();
  const { mutate: maximizeWindow } = t.window.maximize.useMutation();
  const { mutate: closeWindow } = t.window.closeWindow.useMutation();

  const isNotHome = computed(() => routerState.location.pathname !== "/").get();
  const isFullscreen = globalState$.isFullscreen.get();
  const isUpdating = useObservable(false);
  const sidebar = useObservable(false);

  const refreshLibrary = useCallback(() => utils.library.invalidate(), [utils]);

  t.library.additions.useSubscription(undefined, {
    onData: (data) => {
      toast.loading("Adding Issue To Library");

      if (data.isCompleted && data.state === "SUCCESS") {
        toast.dismiss();
        utils.library.getLibrary.invalidate();
      }

      if (data.isCompleted && data.state === "ERROR") {
        toast.error(data.error || "Something went wrong");
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
    if (globalState$.firstLaunch.get()) {
      navigation.navigate({
        to: "/first-launch",
      });
    }
  }, [navigation]);

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
            transition={{
              ease: "easeInOut",
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
                    <Icon name="ArrowLeft" size={12} />
                  </button>
                  <button
                    className="px-2 py-2 rounded-md dark:text-moonlightText cursor-pointer hover:bg-neutral-400/10 dark:hover:bg-neutral-400/5"
                    onClick={() => navigation.history.forward()}
                  >
                    <Icon name="ArrowRight" size={12} />
                  </button>
                </Flex>
                <Flex
                  align="center"
                  justify="center"
                  grow="1"
                  gap="2"
                  className="p-1 rounded-md w-2/6 bg-neutral-100/50 dark:bg-neutral-100/4 border-1 border-solid border-neutral-100 dark:border-neutral-100/5"
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
                {/* <BrowserButton /> */}
                <Flex grow="1" id="drag-region" p="2" />
              </Flex>
              <Flex align="center" justify="end">
                <button
                  className="p-3 hover:bg-neutral-400/10 dark:text-moonlightText dark:hover:bg-neutral-400/5"
                  onClick={() => minimizeWindow()}
                  type="button"
                >
                  <Icon name="Minus" size={12} />
                </button>
                <button
                  className="p-3 hover:bg-neutral-400/10 dark:text-moonlightText dark:hover:bg-neutral-400/5"
                  onClick={() => maximizeWindow()}
                  type="button"
                >
                  <Icon name="Maximize2" size={12} />
                </button>
                <button
                  className="p-3 hover:bg-red-500 dark:text-moonlightText hover:text-white"
                  onClick={() => closeWindow()}
                  type="button"
                >
                  <Icon name="X" size={12} />
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
                className="bg-light-1 dark:bg-moonlightFocusLow flex flex-col space-y-1"
                initial={{ width: 0, display: "none", opacity: 0 }}
                animate={{ width: "20%", display: "flex", opacity: 1 }}
                exit={{ width: 0, display: "none", opacity: 0 }}
              >
                <Flex
                  grow="1"
                  gap="2"
                  direction="column"
                  className="px-3 pt-13"
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
                      <Icon name="Library" size={14} />
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
                  <button
                    onClick={() => refreshLibrary()}
                    className="px-2 py-2 rounded-md dark:text-moonlightText cursor-pointer hover:bg-neutral-400/10 dark:hover:bg-neutral-400/5"
                  >
                    <Icon name="RefreshCw" size={12} />
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
      <Toast />
    </Flex>
  );
}

function AddButton() {
  const { mutate: addIssueToLibrary, isLoading } =
    t.issue.addIssue.useMutation();

  return (
    <button
      className="p-2 rounded-md cursor-pointer dark:text-moonlightText hover:bg-neutral-400/8 dark:hover:bg-neutral-400/5"
      disabled={isLoading}
      onClick={() => addIssueToLibrary()}
    >
      {isLoading ? <Spinner /> : <Icon name="Plus" size={13} />}
    </button>
  );
}

function BrowserButton() {
  const overlay$ = useObservable(false);

  return (
    <>
      <button
        onClick={() => overlay$.set(!overlay$.get())}
        className="p-2 rounded-md cursor-pointer dark:text-moonlightSlight hover:bg-neutral-400/8 dark:hover:bg-neutral-400/5"
      >
        <Icon name="Globe" size={13} />
      </button>
      <AnimatePresence>
        <Show if={overlay$}>
          <motion.div
            initial={{
              opacity: 0,
              scale: 0,
              display: "none",
            }}
            animate={{
              opacity: 1,
              scale: 1,
              display: "flex",
            }}
            exit={{ opacity: 0, scale: 0, display: "none" }}
            className="absolute z-20 top-0 left-0 w-full h-[100vh] bg-black/10 flex items-center justify-center"
          >
            <Flex
              direction="column"
              className="dark:bg-moonlightFocusLow w-4/6 h-4/6 border-1 border-solid border-neutral-100 rounded-md dark:border-neutral-400/10"
            >
              <Flex align="center" justify="between" className="py-1 px-1">
                <Flex
                  align="center"
                  justify="center"
                  grow="1"
                  className="p-1.4 rounded-md w-4/6 bg-neutral-100/50 dark:bg-neutral-100/4 border-1 border-solid border-neutral-100 dark:border-neutral-100/5"
                >
                  <Text size="2" className="text-moonlightSlight">
                    search bar
                  </Text>
                </Flex>
                <button
                  onClick={() => overlay$.set(false)}
                  className="p-2.7 rounded-md cursor-pointer dark:text-moonlightSlight hover:bg-neutral-400/8 dark:hover:bg-neutral-400/5"
                >
                  <Icon name="X" size={13} />
                </button>
              </Flex>
              webview
            </Flex>
          </motion.div>
        </Show>
      </AnimatePresence>
    </>
  );
}
