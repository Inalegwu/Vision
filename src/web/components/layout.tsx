import { useObservable, useObserveEffect } from "@legendapp/state/react";
import { Flex, Text } from "@radix-ui/themes";
import t from "@shared/config";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { globalState$ } from "../state";
import { computed } from "@legendapp/state";
import { Sidebar, X, Maximize2, Minus, Moon } from "lucide-react";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

type LayoutProps = {
  children?: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const navigation = useRouter();
  const routerState = useRouterState();
  const sidebarActive = useObservable(true);
  const sidebarActiveValue = sidebarActive.get();

  const isReader = computed(
    () => routerState.location.pathname === "/$issueId",
  ).get();

  const { mutate: startFileWatcher } =
    t.library.startLibraryWatcher.useMutation();

  t.os.onThemeChanged.useSubscription(undefined, {
    onData: (d) => {
      console.log(d);
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
  }, [startFileWatcher]);

  return (
    <Flex>
      <AnimatePresence presenceAffectsLayout>
        <motion.div
          animate={{
            width: sidebarActiveValue ? "25%" : "0%",
            display: sidebarActiveValue ? "block" : "none",
          }}
        >
          <Flex
            direction="column"
            align="start"
            justify="between"
            className="w-full h-full bg-zinc-100/40 border-r-zinc-100 border-r-solid border-r-1"
          >
            <Flex
              grow="1"
              direction="column"
              align="start"
              className="px-2 py-2"
              width="100%"
            >
              <Flex align="center" justify="start">
                <Text size="3">Vision</Text>
              </Flex>{" "}
            </Flex>
            <Flex className="px-2 py-2" align="center" width="100%">
              <button>
                <Moon size={10} />
              </button>
            </Flex>
          </Flex>
        </motion.div>
      </AnimatePresence>
      <Flex
        direction="column"
        className="w-full h-screen bg-zinc-100 dark:bg-neutral-900"
      >
        {!isReader && (
          <Flex
            className="border-b-zinc-200 border-b-1 border-b-solid"
            align="center"
            justify="between"
          >
            <Flex align="center" justify="start" gap="2">
              <button
                onClick={() => sidebarActive.set(!sidebarActive.get())}
                className="px-3 py-2 hover:bg-zinc-200/40 text-zinc-500"
              >
                <Sidebar size={10} />
              </button>
            </Flex>
            <Flex align="center" justify="end" gap="2">
              <button className="px-2 py-2 text-red-500 flex items-center justify-center">
                <X size={13} />
              </button>
            </Flex>
          </Flex>
        )}
        {children}
      </Flex>
    </Flex>
  );
}
