import { computed } from "@legendapp/state";
import { useObservable, useObserveEffect } from "@legendapp/state/react";
import { Flex, Text, Tooltip } from "@radix-ui/themes";
import t from "@shared/config";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Home,
  Library,
  Maximize2,
  Minus,
  Plus,
  X,
} from "lucide-react";
import type React from "react";
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

  const { mutate: minimizeWindow } = t.window.minimize.useMutation();
  const { mutate: maximizeWindow } = t.window.maximize.useMutation();
  const { mutate: closeWindow } = t.window.closeWindow.useMutation();

  t.library.additions.useSubscription(undefined, {
    onData: (data) => {
      console.log(data);
      if (data.isCompleted) {
        isUpdating.set(false);
      }
      if (data.isCompleted) {
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

  return (
    <Flex
      width="100%"
      direction="column"
      grow="1"
      className="transition bg-light-5 dark:bg-dark-9"
    >
      {!isFullscreen && (
        <Flex
          align="center"
          justify="between"
          className="border-b-1 border-b-solid border-b-zinc-200 dark:border-b-zinc-800"
        >
          <Flex align="center" justify="start" gap="3">
            <Text
              className="ml-2.5 text-zinc-600 text-[12.5px] font-[Title] tracking-wide"
              weight="medium"
            >
              Vision
            </Text>
            <Flex>
              <button
                disabled={!isNotHome}
                onClick={() => navigation.history.back()}
                className="cursor-pointer dark:text-zinc-400 hover:bg-zinc-400/8 px-3 py-2"
              >
                <ArrowLeft size={10} />
              </button>
              <button
                onClick={() => navigation.history.forward()}
                className="cursor-pointer dark:text-zinc-400 hover:bg-zinc-400/8 px-3 py-2"
              >
                <ArrowRight size={10} />
              </button>
              <Tooltip content="Add Issue To Library">
                <AddButton />
              </Tooltip>
            </Flex>
          </Flex>
          <Flex grow="1" align="center" justify="center">
            <Flex grow="1" id="drag-region" p="2" />
            <button
              type="button"
              className="cursor-pointer dark:text-zinc-400 hover:bg-zinc-400/8 px-3 py-2"
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
              className="cursor-pointer dark:text-zinc-400 hover:bg-zinc-400/8 px-3 py-2"
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
              className="px-3 py-2 text-zinc-400 cursor-pointer hover:bg-zinc-400/20 hover:dark:bg-zinc-100/5"
              onClick={() => minimizeWindow()}
              type="button"
            >
              <Minus size={9} />
            </button>
            <button
              className="px-3 py-2 text-zinc-400 cursor-pointer hover:bg-zinc-400/20 hover:dark:bg-zinc-100/5"
              onClick={() => maximizeWindow()}
              type="button"
            >
              <Maximize2 size={9} />
            </button>
            <button
              className="px-3 py-2 text-red-600 cursor-pointer hover:bg-red-600/20"
              onClick={() => closeWindow()}
              type="button"
            >
              <X size={9} />
            </button>
          </Flex>
        </Flex>
      )}
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
      className="cursor-pointer dark:text-zinc-400 hover:bg-zinc-400/8 px-3 py-2"
    >
      {isLoading ? <Spinner /> : <Plus size={10} />}
    </button>
  );
}
