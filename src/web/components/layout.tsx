import { computed } from "@legendapp/state";
import { Show, useObservable, useObserveEffect } from "@legendapp/state/react";
import { Flex, Text, Tooltip } from "@radix-ui/themes";
import t from "@shared/config";
import icon from "@src/assets/images/win.png";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { capitalize } from "effect/String";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useEffect } from "react";
import { v4 } from "uuid";
import { useInterval } from "../hooks";
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
  const { mutate: launchWatcher } = t.library.launchWatcher.useMutation();

  const isNotHome = computed(() => routerState.location.pathname !== "/").get();
  const isFullscreen = globalState$.isFullscreen.get();

  t.library.additions.useSubscription(undefined, {
    onData: (data) => {
      if (!data.isCompleted && data.state === "SUCCESS") {
        toast.loading(`Adding ${data.issue || "issue"} To Library`);
      }

      if (data.isCompleted && data.state === "SUCCESS") {
        toast.success(`Added ${data.issue || "issue"} to library`);
        utils.library.getLibrary.invalidate();
      }

      if (data.isCompleted && data.state === "ERROR") {
        console.log(data.error);
        toast.error(data.error || "Something went wrong");
      }

      if (!data.isCompleted && data.state === "ERROR") {
        toast.error(data.error || "Unknown Error Occurred");
      }

      return;
    },
  });

  t.library.deletions.useSubscription(undefined, {
    onData: (data) => {
      if (!data.isDone) {
        toast.info(`Removing ${data.title} from Library`);
      }

      if (!data.isDone && data.error) {
        toast.error(data.error);
      }

      if (data.isDone) {
        toast.success(`Successfully Removed ${data.title}`);
        utils.library.invalidate();
        toast.dismiss();
      }
    },
  });

  useInterval(() => {
    if (toast.showing) toast.dismiss();
  }, 2_500);

  useObserveEffect(() => {
    if (globalState$.colorMode.get() === "dark") {
      document.body.classList.add("dark");
      globalState$.colorMode.set("dark");
    } else {
      document.body.classList.remove("dark");
      globalState$.colorMode.set("light");
    }
  });

  const goToSettings = () =>
    navigation.navigate({
      to: "/settings",
    });

  useEffect(() => {
    launchWatcher();
    if (globalState$.isFullscreen.get()) globalState$.isFullscreen.set(false);
    if (globalState$.firstLaunch.get()) {
      navigation.navigate({
        to: "/first-launch",
      });
    }
    if (globalState$.appId.get() === null) {
      globalState$.appId.set(v4());
    }
  }, [navigation, launchWatcher]);

  return (
    <Flex
      width="100%"
      grow="1"
      className="transition bg-white dark:bg-moonlightBase relative"
    >
      {/* title bar */}
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
                {/* <Text
                  className="ml-3 font-[Title] text-moonlightOrange"
                  weight="medium"
                >
                  Vision
                </Text> */}
                <img src={icon} alt="app__icon" className="w-6 h-6 ml-2" />
                <Flex gap="1">
                  <Tooltip content="Add Issue To Library">
                    <AddButton />
                  </Tooltip>
                  <Tooltip content="View Reading History">
                    <Link
                      to="/history"
                      className="px-2 py-1 flex items-center justify-center rounded-md dark:text-moonlightText cursor-pointer hover:bg-neutral-400/10 dark:hover:bg-neutral-400/5"
                    >
                      <Icon name="History" size={12} />
                    </Link>
                  </Tooltip>
                </Flex>
              </Flex>
              <Flex grow="1" gap="1" align="center" justify="center">
                <Flex grow="1" id="drag-region" p="2" />
                <Flex>
                  <button
                    disabled={!isNotHome}
                    className="px-2 py-2 rounded-md dark:text-moonlightText cursor-pointer hover:bg-neutral-400/10 dark:hover:bg-neutral-400/5 disabled:text-neutral-600"
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
                        : routerState.location.pathname === "/history"
                          ? "History"
                          : routerState.location.pathname.includes(
                                "/collection/",
                              )
                            ? "Collection"
                            : routerState.location.pathname.includes("read")
                              ? "Reading"
                              : routerState.location.pathname === "/settings"
                                ? "Settings"
                                : "Exploring",
                    )}
                  </Text>
                </Flex>
                <ThemeButton />
                <button
                  onClick={goToSettings}
                  className="p-2 rounded-md cursor-pointer dark:text-moonlightSlight hover:bg-neutral-400/10 dark:hover:bg-neutral-400/5"
                >
                  <Icon name="Settings2" size={12} />
                </button>
                {/* <BrowserButton /> */}
                <Flex grow="1" id="drag-region" p="2" />
              </Flex>
              <Flex align="center" justify="end">
                {/* <button
                  className="p-3 hover:bg-neutral-400/10 cursor-pointer dark:text-moonlightText dark:hover:bg-neutral-400/5"
                  onClick={goToSettings}
                  type="button"
                >
                  <Icon name="Settings2" size={12} />
                </button> */}
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
      {/* actual page */}
      <Flex width="100%" height="100%">
        {children}
      </Flex>
      {/* toast notifications */}
      <Toast />
    </Flex>
  );
}

function AddButton() {
  const utils = t.useUtils();
  const { mutate: addIssueToLibrary, isLoading } = t.issue.addIssue.useMutation(
    {
      onSuccess: () => utils.library.getLibrary.invalidate(),
    },
  );

  return (
    <button
      className="p-2 rounded-md cursor-pointer dark:text-moonlightText hover:bg-neutral-400/8 dark:hover:bg-neutral-400/5"
      disabled={isLoading}
      onClick={() => addIssueToLibrary()}
    >
      {isLoading ? <Spinner /> : <Icon name="Plus" size={12} />}
    </button>
  );
}

function NotificationButton() {
  return (
    <Link
      to="/notifications"
      className="p-2 rounded-md cursor-pointer dark:text-moonlightSlight hover:bg-neutral-400/10 dark:hover:bg-neutral-400/5"
    >
      <Icon name="Bell" size={12} />
    </Link>
  );
}

function BrowserButton() {
  const overlay$ = useObservable(false);

  const searchTerm = useObservable("");

  const doSearch = () => {
    console.log(searchTerm.get());
  };

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
            className="absolute z-20 top-0 left-0 w-full h-[100vh] bg-black/4 flex items-center justify-center"
          >
            <Flex
              direction="column"
              className="bg-white dark:bg-moonlightFocusLow w-4/6 h-4/6 border-1 border-solid border-neutral-200/40 rounded-md dark:border-neutral-400/10"
            >
              <Flex
                align="center"
                justify="between"
                className="bg-neutral-200/10 dark:bg-neutral-700/10 rounded-tr-md rounded-tl-md"
              >
                <input
                  placeholder="Find a Comic"
                  onChange={(value) =>
                    searchTerm.set(value.currentTarget.value)
                  }
                  onSubmit={doSearch}
                  onBlur={doSearch}
                  className="bg-transparent border-none font-medium dark:text-neutral-300 py-3 px-3 flex-1 outline-none"
                />
                <button
                  onClick={() => overlay$.set(false)}
                  className="px-3 py-3 text-neutral-500 cursor-pointer"
                >
                  <Icon name="ChevronLeft" size={13} />
                </button>
                <button
                  onClick={() => overlay$.set(false)}
                  className="px-3 py-3 text-neutral-500 cursor-pointer"
                >
                  <Icon name="ChevronRight" size={13} />
                </button>
                <button
                  onClick={() => overlay$.set(false)}
                  className="px-3 py-3 text-red-500 cursor-pointer"
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
