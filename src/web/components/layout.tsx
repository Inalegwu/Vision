import { computed } from "@legendapp/state";
import { useObserveEffect } from "@legendapp/state/react";
import { Flex, Text, Tooltip } from "@radix-ui/themes";
import t from "@shared/config";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import type React from "react";
import { useEffect } from "react";
import { globalState$ } from "../state";
import Spinner from "./spinner";
import { HomeFilled, LibraryFilled, GridFilled, TextAlignJustifyFilled } from "@fluentui/react-icons"


type LayoutProps = {
  children?: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const navigation = useRouter();
  const routerState = useRouterState();

  const isNotHome = computed(() => routerState.location.pathname !== "/").get();

  const { mutate: startFileWatcher } =
    t.library.startLibraryWatcher.useMutation();

  const themeChanged = t.os.onThemeChanged.useSubscription();

  const { mutate: prefetchLibrary } = t.library.prefetchLibrary.useMutation();

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
    prefetchLibrary({
      queryKey: "issues",
    });
  }, [startFileWatcher, prefetchLibrary]);

  return (
    <Flex className="w-full h-screen bg-transparent" align="center">
      <Flex direction="column" className="w-1/6 h-full">
        <div className="w-full flex items-center justify-between px-1">
          <button className="px-2 py-2 flex items-center justify-start hover:bg-zinc-200/3 rounded-md text-zinc-400">
            <TextAlignJustifyFilled fontSize={15} />
          </button>
          <button className="px-2 py-2 hover:bg-zinc-200/3 rounded-md text-zinc-400 flex items-center justify-center">
            <GridFilled fontSize={15} />
          </button>
        </div>
        <Link to="/" className="text-zinc-400 mt-2 flex items-center justify-start space-x-1 hover:bg-zinc-200/3 py-3 px-2 transition">
          <HomeFilled fontSize={15} />
          <Text weight="light" size="2">Home</Text>
        </Link>
        <Link to="/library" className="text-zinc-400 flex items-center justify-start space-x-1 hover:bg-zinc-200/3 py-3 px-2 transition">
          <LibraryFilled fontSize={15} />
          <Text weight="light" size="2">Library</Text>
        </Link>
      </Flex>
      <Flex className="w-5/6 bg-neutral-900 h-full rounded-tl-xl px-2 py-1 border-1.7 border-solid border-zinc-800">
        {children}
      </Flex>
    </Flex>
  );
}

function AddButton() {
  const { mutate: addIssueToLibrary, isLoading } =
    t.issue.addIssue.useMutation();

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
