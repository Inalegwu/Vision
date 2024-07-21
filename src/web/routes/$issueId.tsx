import { useObservable } from "@legendapp/state/react";
import { Flex } from "@radix-ui/themes";
import t from "@shared/config";
import { createFileRoute } from "@tanstack/react-router";
import { motion, useMotionValue } from "framer-motion";
import { useInterval, useTimeout } from "../hooks";
import { readingState$ } from "../state";

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
  const readingState = readingState$.currentlyReading.get();

  useInterval(() => {
    console.log({ itemIndexValue });
    if (itemIndexValue < contentLength - 1) {
      console.log("saving to currently reading");
      readingState.set(data?.id!, {
        issueId: issueId,
        thumbnailUrl: data?.thumbnailUrl || "",
        issueTitle: data?.issueTitle || "",
        totalPages: contentLength - 1,
        pageNumber: itemIndexValue,
      });
    }
  }, 3_000);

  useTimeout(() => {
    isEnabled.set(true);
  }, 3_000);

  console.log({ data });

  const onDragStart = () => {
    console.log("drag start");
  };

  const onDragEnd = () => {
    console.log("drag end");

    const x = dragX.get();
    console.log({ itemIndexValue });

    if (x <= DRAG_BUFFER && itemIndexValue < contentLength - 1) {
      console.log({ x });
      itemIndex.set(itemIndexValue + 1);
    } else if (x >= DRAG_BUFFER && itemIndexValue > 0) {
      console.log({ otherX: x });
      itemIndex.set(itemIndexValue - 1);
    }
  };

  return (
    <Flex className="relative min-h-screen overflow-hidden">
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        style={{ x: dragX }}
        animate={{
          translateX: `-${itemIndexValue * 100}%`,
        }}
        transition={{
          bounceDamping: 10,
        }}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
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
