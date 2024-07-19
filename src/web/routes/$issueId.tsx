import { useObservable } from "@legendapp/state/react";
import { Flex } from "@radix-ui/themes";
import t from "@shared/config";
import { createFileRoute } from "@tanstack/react-router";
import { motion, useMotionValue } from "framer-motion";
import { useInterval, useTimeout } from "../hooks";

const DRAG_BUFFER = 50;

export const Route = createFileRoute("/$issueId")({
  component: Component,
});

function Component() {
  const { issueId } = Route.useParams();

  const isEnabled = useObservable(false);

  const { data, isLoading } = t.issue.getPages.useQuery(
    {
      issueId,
    },
    {
      enabled: isEnabled.get(),
    },
  );

  const contentLength = data?.pages.length || 0;
  const itemIndex = useObservable(0);
  const itemIndexValue = itemIndex.get();
  const dragX = useMotionValue(0);

  useInterval(() => {
    console.log("to save reading state");
  }, 10_000);

  useTimeout(() => {
    isEnabled.set(true);
  }, 3_000);

  console.log({ data });

  return (
    <Flex className="relative min-h-screen overflow-hidden">
      <motion.div
        drag="x"
        dragConstraints={{ right: 0 }}
        className="flex cursor-grab active:cursor-grabbing items-center"
      >
        {data?.pages.map((v) => (
          <div
            className="w-full h-screen flex items-center justify-center shrink-0"
            key={v.id}
          >
            <img
              src={v.pageContent}
              alt="page"
              className="aspect-[9/16] h-full w-[45%] object-contain"
            />
          </div>
        ))}
      </motion.div>
      {/* <Flex
        align="center"
        justify="start"
        gap="2"
        className="absolute z-20 w-5/6 overflow-x-scroll bottom-10 bg-transparent backdrop-blur-lg border-1 border-solid border-zinc-200 dark:border-zinc-800 rounded-lg p-2"
      >
        {isLoading &&
          Array(10)
            .fill(0)
            .map((_, index) => (
              <Skeleton
                key={index}
                className="w-[100px] h-[95px] rounded-md border-1 border-solid border-zinc-200 dark:border-zinc-800 bg-zinc-400/10"
              />
            ))}
        {data?.pages.map((v) => {
          return (
            <img
              className="w-[100px] h-[95px] rounded-md border-1 border-solid border-zinc-200 dark:border-zinc-800 cursor-pointer"
              key={v.id}
              alt={`page_${v.id}`}
              src={v.pageContent}
            />
          );
        })}
      </Flex> */}
    </Flex>
  );
}
