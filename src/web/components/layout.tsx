import { useObservable, useObserveEffect } from "@legendapp/state/react";
import { Flex, Text, Tooltip } from "@radix-ui/themes";
import t from "@shared/config";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import type React from "react";
import { useEffect } from "react";
import { globalState$ } from "../state";
import Spinner from "./spinner";
import { HomeFilled, LibraryFilled, GridFilled, TextAlignJustifyFilled, ChevronLeftFilled, ChevronRightFilled, SettingsFilled } from "@fluentui/react-icons"
import { motion } from "framer-motion";


type LayoutProps = {
  children?: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const navigation = useRouter();
  const routerState = useRouterState();

  const sidebarExpanded = useObservable<boolean>(true);

  const { mutate: startFileWatcher } =
    t.library.startLibraryWatcher.useMutation();

  console.log({ expanded: sidebarExpanded.get() })

 
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
  }, [startFileWatcher]);

  return (
    <Flex className="w-full h-screen bg-transparent" align="center">
      <motion.div className="flex flex-col flex-1 h-full" animate={{ width: sidebarExpanded.get() ? "40px" : "10px" }} transition={{ duration: 0.2 }}>
        <Flex direction="column" className="w-full h-full">
          <div className="w-full mt-1 flex items-center justify-between px-1">
            <Flex align="center" justify="start" gap="2">
              <Tooltip content="Show/Hide Menu">
                <button onClick={() => sidebarExpanded.set(!sidebarExpanded.get())} className="px-2 transition py-2 flex items-center justify-center hover:bg-zinc-200/3 rounded-md text-zinc-400">
                  <TextAlignJustifyFilled fontSize={15} />
                </button>
              </Tooltip>
              <Tooltip content="Go Back">
                <button onClick={() => navigation.history.back()} className="px-2 py-2 transition flex items-center justify-center hover:bg-zinc-200/3 rounded-md text-zinc-400">
                  <ChevronLeftFilled fontSize={15} />
                </button>
              </Tooltip>
              <Tooltip content="Go Forward">
                <button onClick={() => navigation.history.forward()} className="px-2 py-2 transition flex items-center justify-center hover:bg-zinc-200/3 rounded-md text-zinc-400">
                  <ChevronRightFilled fontSize={15} />
                </button>
              </Tooltip>
            </Flex>
            <Tooltip content="Change Menu Layout">
              <button className="px-2 py-2 transition hover:bg-zinc-200/3 rounded-md text-zinc-400 flex items-center justify-center">
                <GridFilled fontSize={15} />
              </button>
            </Tooltip>
          </div>
          <Flex direction="column" grow="1">
            <Link to="/" className={`text-zinc-400 mt-2 flex items-center justify-start space-x-2 hover:bg-zinc-200/3 py-3 px-2 transition ${routerState.location.pathname === "/" ? "bg-zinc-200/3" : ""}`}>
              <HomeFilled fontSize={16} />
              <Text size="2">Home</Text>
            </Link>
            <Link to="/library" className={`text-zinc-400 flex items-center justify-start space-x-2 hover:bg-zinc-200/3 py-3 px-2 transition ${routerState.location.pathname === "/library" ? "bg-zinc-200/3" : ""}`}>
              <LibraryFilled fontSize={16} />
              <Text size="2">Library</Text>
            </Link>
          </Flex>
          <Flex className="px-2 py-2" align="center" justify="end">
            <button className="px-2 py-2 rounded-md text-zinc-400 flex items-center justify-center hover:bg-zinc-200/3">
              <SettingsFilled />
            </button>
          </Flex>
        </Flex>
      </motion.div>
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
      {isLoading ? <Spinner /> : <PlusFilled size={10} />}
    </button>
  );
}
