import { AlignCenterHorizontal16Filled } from "@fluentui/react-icons";
import { useObservable, useObserveEffect } from "@legendapp/state/react";
import { Flex } from "@radix-ui/themes";
import t from "@shared/config";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type React from "react";
import { useEffect } from "react";
import { globalState$ } from "../state";

type LayoutProps = {
  children?: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const navigation = useRouter();
  const routerState = useRouterState();

  const sidebarExpanded = useObservable<boolean>(true);

  const { mutate: startFileWatcher } =
    t.library.startLibraryWatcher.useMutation();

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
      <motion.div
        initial={{ width: "25%" }}
        className="h-full flex-1"
        animate={{ width: sidebarExpanded.get() ? "25%" : "0%" }}
      >
        <Flex
          className="h-full"
          direction="column"
          align="start"
          justify="center"
        >
          <Flex className="w-full px-2 py-3" align="center" justify="between">
            <button>
              <AlignCenterHorizontal16Filled fontSize={12} />
            </button>
          </Flex>
          <Flex grow="1" className="w-full">
            body
          </Flex>
          <Flex className="w-full px-2 py-3">bottom</Flex>
        </Flex>
      </motion.div>
      <motion.div
        initial={{ width: "75%" }}
        animate={{ width: sidebarExpanded.get() ? "75%" : "100%" }}
      >
        <Flex className="h-full w-full bg-zinc-100 dark:bg-zinc-900 rounded-tl-lg border-1 border-zinc-800 border-solid">
          {children}
        </Flex>
      </motion.div>
    </Flex>
  );
}
