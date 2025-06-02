import { Icon, LoadingSkeleton } from "@components";
import { Switch, useObservable } from "@legendapp/state/react";
import { Flex, Heading, Text, Tooltip } from "@radix-ui/themes";
import t from "@shared/config";
import { createFileRoute } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AnimatePresence, motion } from "motion/react";
import React, { memo, Suspense, useRef } from "react";
import { toast } from "../components/toast";
import { useTimeout } from "../hooks";
import { globalState$ } from "../state";

const Collection = React.lazy(() => import("../components/collection"));
const Issue = React.lazy(() => import("../components/issue"));

export const Route = createFileRoute("/")({
  component: memo(Component),
});

function Component() {
  const isEnabled = useObservable(false);

  const view = globalState$.libraryView.get();

  const { data } = t.library.getLibrary.useQuery(undefined, {
    enabled: isEnabled.get(),
    onError: (error) => toast.error(error.message),
  });

  useTimeout(() => isEnabled.set(true), 500);

  return (
    <Flex direction="column" className="w-full h-screen pt-8">
      <Flex align="center" justify="between" className="w-full px-3 py-4">
        <Flex grow="1" align="center" justify="start">
          <Flex
            gap="1"
            className="bg-neutral-100 rounded-lg p-0.6 relative dark:bg-moonlightFocusMedium"
          >
            <motion.div
              animate={{
                transform:
                  view === "collections"
                    ? "translateX(0px)"
                    : "translateX(28px)",
              }}
              className="absolute z-0 w-[45%] h-[89%] rounded-lg bg-white dark:bg-moonlightFocusLow"
            />
            <Tooltip content="My Collections">
              <button
                onClick={() => globalState$.libraryView.set("collections")}
                className={`p-1.6 cursor-pointer ${
                  view === "collections"
                    ? " text-moonlightOrange"
                    : "text-neutral-600"
                }`}
              >
                <Icon name="Library" size={13} />
              </button>
            </Tooltip>
            <Tooltip content="My Issues">
              <button
                onClick={() => globalState$.libraryView.set("issues")}
                className={`p-1.6 cursor-pointer ${
                  view === "issues"
                    ? " text-moonlightOrange"
                    : "text-neutral-600"
                }`}
              >
                <Icon name="Book" size={13} />
              </button>
            </Tooltip>
          </Flex>
        </Flex>
      </Flex>
      <Flex grow="1" className="px-3">
        <AnimatePresence>
          <Switch value={view}>
            {{
              issues: () => <RenderIssues issues={data?.issues || []} />,
              collections: () => (
                <RenderCollections collections={data?.collections || []} />
              ),
              default: () => null,
              undefined: () => null,
            }}
          </Switch>
        </AnimatePresence>
      </Flex>
    </Flex>
  );
}

const RenderIssues = memo(({ issues }: { issues: Issue[] }) => {
  const parentView = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: issues.length,
    estimateSize: () => 50,
    getScrollElement: () => parentView.current,
  });

  if (issues.length === 0) {
    return (
      <Flex
        direction="column"
        className="w-full h-full"
        align="center"
        justify="center"
      >
        <Heading className="text-moonlightOrange" size="8">
          No Issues
        </Heading>
        <Text size="3" className="text-moonlightSlight">
          add some issues to see them in your library
        </Text>
      </Flex>
    );
  }

  return (
    <Flex width="100%" wrap="wrap" gap="1" className="overflow-y-scroll pb-17">
      <Suspense fallback={<LoadingSkeleton />}>
        {issues.map((issue) => (
          <Issue issue={issue} key={issue.id} />
        ))}
      </Suspense>
    </Flex>
  );

  // return (
  //   <Flex
  //     ref={parentView}
  //     style={{
  //       height: "700px",
  //       overflow: "auto",
  //     }}
  //     className="w-full"
  //   >
  //     <Flex
  //       style={{
  //         width: "100%",
  //         position: "relative",
  //         height: `${virtualizer.getTotalSize()}px`,
  //       }}
  //       gap="2"
  //       wrap="wrap"
  //     >
  //       <Suspense
  //         fallback={
  //           <Flex
  //             className="w-full h-full bg-transparent"
  //             align="center"
  //             justify="center"
  //           >
  //             <Spinner className="border-2 border-moonlightOrange" size={35} />
  //           </Flex>
  //         }
  //       >
  //         {virtualizer.getVirtualItems().map((virtual) => (
  //           <Issue key={virtual.key} issue={issues[virtual.index]} />
  //         ))}
  //       </Suspense>
  //     </Flex>
  //   </Flex>
  // );
});

const RenderCollections = memo(
  ({
    collections,
  }: {
    collections: Array<
      Collection & {
        issues: Issue[];
      }
    >;
  }) => {
    const parentView = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
      count: collections.length,
      estimateSize: () => 35,
      getScrollElement: () => parentView.current,
    });

    if (collections.length === 0) {
      return (
        <Flex
          direction="column"
          className="w-full h-full"
          align="center"
          justify="center"
        >
          <Heading className="text-moonlightOrange" size="8">
            No Collections
          </Heading>
          <Text size="3" className="text-moonlightSlight">
            create some collections to organize your library
          </Text>
        </Flex>
      );
    }

    return (
      <Flex width="100%" gap="5" wrap="wrap">
        <Suspense fallback={<LoadingSkeleton />}>
          {collections.map((collection) => (
            <Collection key={collection.id} collection={collection} />
          ))}
        </Suspense>
      </Flex>
    );
    // return (
    //   <Flex
    //     ref={parentView}
    //     style={{
    //       height: "700px",
    //       overflow: "auto",
    //     }}
    //     className="w-full"
    //   >
    //     <Flex
    //       style={{
    //         width: "100%",
    //         position: "relative",
    //         height: `${virtualizer.getTotalSize()}px`,
    //       }}
    //       gap="4"
    //     >
    //       <Suspense
    //         fallback={
    //           <Flex
    //             className="w-full h-[700px] bg-transparent"
    //             align="center"
    //             justify="center"
    //           >
    //             <Spinner
    //               className="border-2 border-moonlightOrange"
    //               size={35}
    //             />
    //           </Flex>
    //         }
    //       >
    //         {virtualizer.getVirtualItems().map((virtual) => (
    //           <Collection
    //             key={virtual.key}
    //             collection={collections[virtual.index]}
    //           />
    //         ))}
    //       </Suspense>
    //     </Flex>
    //   </Flex>
    // );
  },
);
