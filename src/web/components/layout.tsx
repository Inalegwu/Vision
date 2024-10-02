import { useObserveEffect } from "@legendapp/state/react";
import { Flex } from "@radix-ui/themes";
import t from "@shared/config";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { globalState$ } from "../state";
import { computed } from "@legendapp/state";
import { Sidebar } from "lucide-react";
import { useEffect } from "react";

type LayoutProps = {
  children?: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const navigation = useRouter();
  const routerState = useRouterState();

  const isHome = computed(() => routerState.location.pathname === "/").get();

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
    <Flex
      direction="column"
      className="w-full h-screen bg-zinc-200 dark:bg-neutral-900"
    >
      {isHome && (
        <Flex align="center" justify="between">
          <button className="px-3 py-2">
            <Sidebar size={10} />
          </button>
        </Flex>
      )}
      {children}
    </Flex>
  );
}
