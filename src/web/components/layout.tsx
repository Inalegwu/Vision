import { computed } from "@legendapp/state";
import { Flex, Text, Tooltip } from "@radix-ui/themes";
import t from "@src/shared/config";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Library,
  Maximize,
  Minus,
  Plus,
  Settings,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect } from "react";
import { globalState$ } from "../state";

type LayoutProps = {
  children?: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const router = useRouterState();
  const navigation = useNavigate();

  const isNotHome = computed(() => router.location.pathname !== "/").get();

  const { mutate: minimizeWindow } = t.window.minimize.useMutation();
  const { mutate: maximizeWindow } = t.window.maximize.useMutation();
  const { mutate: closeWindow } = t.window.closeWindow.useMutation();
  const { mutate: addIssueToLibrary } = t.issue.addIssue.useMutation();

  useEffect(() => {
    if (globalState$.colorMode.get() === "dark") {
      document.body.classList.add("dark");
      globalState$.colorMode.set("dark");
    } else {
      document.body.classList.remove("dark");
      globalState$.colorMode.set("light");
    }
  }, []);

  return (
    <Flex
      width="100%"
      direction="column"
      grow="1"
      className="transition bg-light-4 dark:bg-dark-9"
    >
      <Flex
        align="center"
        justify="between"
        className="border-b-1 border-b-solid border-b-zinc-200 dark:border-b-zinc-800"
      >
        <Flex align="center" justify="start" gap="3">
          <Text className="ml-2.5 text-zinc-600 text-[12.5px]" weight="medium">
            Vision
          </Text>
          <Tooltip content="Add Issue To Library">
            <button
              type="button"
              onClick={() => addIssueToLibrary()}
              className="cursor-pointer dark:text-zinc-400 hover:bg-zinc-400/8 px-3 py-2"
            >
              <Plus size={10} />
            </button>
          </Tooltip>
        </Flex>
        <Flex grow="1" align="center" justify="center">
          <Flex grow="1" id="drag-region" p="2" />
          <button
            type="button"
            className="cursor-pointer dark:text-zinc-400 hover:bg-zinc-400/8 px-3 py-2"
            onClick={() => console.log("todo home.")}
          >
            <Home size={10.5} />
          </button>
          <button
            type="button"
            className="cursor-pointer dark:text-zinc-400 hover:bg-zinc-400/8 px-3 py-2"
            onClick={() => console.log("todo lib.")}
          >
            <Library size={10.5} />
          </button>
          <Flex grow="1" id="drag-region" p="2" />
        </Flex>
        <Flex align="center" justify="end">
          <button
            type="button"
            className="cursor-pointer text-zinc-400 hover:bg-zinc-400/20 hover:dark:bg-zinc-100/5 px-3 py-2"
          >
            <Settings size={10} />
          </button>
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
            <Maximize size={9} />
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
      {children}
      {/* <Flex className="z-20 absolute bottom-10 right-2 bg-transparent backdrop-blur-3xl p-1">
        <Button className="cursor-pointer" variant="surface">
          1
        </Button>
      </Flex> */}
    </Flex>
  );
}