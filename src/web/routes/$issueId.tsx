import { useObservable } from "@legendapp/state/react";
import { Flex } from "@radix-ui/themes";
import t from "@shared/config";
import { createFileRoute } from "@tanstack/react-router";
import { motion, useMotionValue } from "framer-motion";
import { useMemo } from "react";
import { useInterval, useKeyPress, useTimeout } from "../hooks";
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

  const readingState = readingState$.currentlyReading.get();
  const doneReading = readingState$.doneReading.get();

  const exists = readingState.has(issueId);

  const contentLength = data?.pages.length || 0;
  const itemIndex = useObservable(
    exists ? readingState.get(issueId)?.pageNumber : 0,
  );
  const itemIndexValue = itemIndex.get();
  const dragX = useMotionValue(0);
  const width = useMemo(
    () => (itemIndexValue / contentLength - 1) * 100,
    [contentLength, itemIndexValue],
  );

  console.log({ width });

  useInterval(() => {
    if (itemIndexValue < contentLength - 1) {
      console.log("saving to currently reading");
      readingState.set(data?.id!, {
        issueId: issueId,
        thumbnailUrl: data?.thumbnailUrl || "",
        issueTitle: data?.issueTitle || "",
        totalPages: contentLength - 1,
        pageNumber: itemIndexValue,
      });
      return;
    }

    if (itemIndexValue === contentLength - 1) {
      readingState.delete(issueId);
      doneReading.set(data?.id!, {
        issueId: issueId,
        thumbnailUrl: data?.thumbnailUrl || "",
        issueTitle: data?.issueTitle || "",
        dateFinished: new Date().toISOString(),
      });
      return;
    }
  }, 3_000);

  useTimeout(() => {
    isEnabled.set(true);
  }, 3_000);

  useKeyPress((e) => {
    if (e.keyCode === 93 && itemIndexValue < contentLength - 1) {
      itemIndex.set(itemIndexValue + 1);
    } else if (e.keyCode === 91 && itemIndexValue > 0) {
      itemIndex.set(itemIndexValue - 1);
    }
  });

  const onDragEnd = () => {
    const x = dragX.get();

    if (x <= DRAG_BUFFER && itemIndexValue < contentLength - 1) {
      itemIndex.set(itemIndexValue + 1);
    } else if (x >= DRAG_BUFFER && itemIndexValue > 0) {
      itemIndex.set(itemIndexValue - 1);
    }
  };

  return (
    <Flex className="min-h-screen overflow-hidden">
      {/* page viewer */}
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
      <Flex
        className="absolute z-20 bottom-10 left-0 w-full"
        align="center"
        justify="center"
      >
        <div className="w-[98%] bg-zinc-400/20 backdrop-blur-3xl rounded-full">
          <div
            style={{ width: `${width}%` }}
            className="rounded-full p-1 bg-white/20"
          />
        </div>
      </Flex>
    </Flex>
  );
}
