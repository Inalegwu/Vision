import { useObservable } from "@legendapp/state/react";
import { Flex } from "@radix-ui/themes";
import t from "@shared/config";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import { Bookmark, ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { memo, useCallback, useEffect, useMemo } from "react";
import { Spinner } from "../components";
import { useInterval, useKeyPress, useTimeout } from "../hooks";
import { globalState$, readingState$ } from "../state";

const DRAG_BUFFER = 50;

export const Route = createFileRoute("/$issueId")({
  component: memo(Component),
});

function Component() {
  const { issueId } = Route.useParams();

  const isEnabled = useObservable(false);
  const isVisible = useObservable(false);

  const doneReading = readingState$.doneReading.get();
  const currentlyReading = readingState$.currentlyReading.get();
  const isSaved = readingState$.currentlyReading.has(issueId);
  const isFullscreen = globalState$.isFullscreen.get();

  const { data, isLoading } = t.issue.getPages.useQuery(
    {
      issueId,
    },
    {
      enabled: isEnabled.get(),
    },
  );

  const contentLength = data?.pages.length || 0;
  const itemIndex = useObservable(
    isSaved ? currentlyReading.get(issueId)?.currentPage : 0,
  );
  const itemIndexValue = itemIndex.get();
  const dragX = useMotionValue(0);
  const width = useMemo(
    () => Math.floor((itemIndexValue / contentLength) * 100),
    [contentLength, itemIndexValue],
  );

  // save reading state to store every few seconds
  // while reading
  useInterval(() => {
    if (itemIndexValue < contentLength - 1) {
      console.log("saving to currently reading");
      currentlyReading.set(issueId, {
        id: issueId,
        title: data?.issueTitle || "",
        thumbnailUrl: data?.thumbnailUrl || "",
        currentPage: itemIndexValue,
        totalPages: contentLength - 1,
      });
      return;
    }

    if (itemIndexValue === contentLength - 1) {
      currentlyReading.delete(issueId);
      doneReading.set(issueId, {
        id: issueId,
        title: data?.issueTitle || "",
        thumbnailUrl: data?.thumbnailUrl || "",
        dateFinished: new Date().toISOString(),
      });
      return;
    }
  }, 3_000);

  useTimeout(() => {
    isEnabled.set(true);
  }, 3_000);

  const goRight = useCallback(() => {
    itemIndex.set(itemIndexValue + 1);
  }, [itemIndex, itemIndexValue]);

  const goLeft = useCallback(() => {
    itemIndex.set(itemIndexValue - 1);
  }, [itemIndex, itemIndexValue]);

  useKeyPress((e) => {
    if (e.keyCode === 93 && itemIndexValue < contentLength - 1) {
      goRight();
    } else if (e.keyCode === 91 && itemIndexValue > 0) {
      goLeft();
    }
  });

  useTimeout(() => {
    isVisible.set(false);
  }, 3_000);

  useEffect(() => {
    window.addEventListener("mousemove", () => isVisible.set(true));

    return () =>
      window.removeEventListener("mousemove", () => isVisible.set(true));
  }, [isVisible]);

  const onDragEnd = () => {
    const x = dragX.get();

    if (x <= DRAG_BUFFER && itemIndexValue < contentLength - 1) {
      itemIndex.set(itemIndexValue + 1);
    } else if (x >= DRAG_BUFFER && itemIndexValue > 0) {
      itemIndex.set(itemIndexValue - 1);
    }
  };

  return (
    <Flex className="h-screen w-full overflow-hidden">
      <Flex className="w-full h-full relative">
        {isLoading && (
          <Flex
            className="absolute z-20 w-full h-screen"
            align="center"
            justify="center"
          >
            <div>
              <Spinner size={40} />
            </div>
          </Flex>
        )}
        <div className="absolute z-0 h-[10%]">
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
                  className="h-full w-[50%] object-contain"
                />
              </div>
            ))}
          </motion.div>
        </div>
        {/* controls */}
        <AnimatePresence>
          {isVisible && (
            <motion.div>
              <Flex
                align="center"
                justify="between"
                gap="3"
                className="fixed z-10 bg-gray-100/20 dark:bg-gray-100/5 bottom-0 left-0 w-full"
              >
                <Flex align="center" justify="start">
                  <button
                    onClick={() => goLeft()}
                    className="text-neutral-700 px-5 py-5 hover:bg-neutral-400/8 dark:hover:bg-neutral-200/3 dark:text-neutral-300"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => goRight()}
                    className="text-neutral-700 px-5 py-5 hover:bg-neutral-400/8 dark:hover:bg-neutral-200/3 dark:text-neutral-300"
                  >
                    <ChevronRight size={18} />
                  </button>
                </Flex>
                <motion.div className="rounded-full bg-gray-100/40 dark:bg-gray-100/8 flex-1">
                  <motion.div
                    animate={{ width: `${width}%` }}
                    className="p-1 bg-neutral-900 rounded-full dark:bg-neutral-100"
                  />
                </motion.div>
                <Flex align="center" justify="end">
                  <button
                    onClick={() => globalState$.isFullscreen.set(!isFullscreen)}
                    className="text-neutral-700 dark:text-neutral-300 hover:bg-neutral-400/8 dark:hover:bg-neutral-200/3 px-5 py-5"
                  >
                    <Expand size={18} />
                  </button>
                  <button className="text-neutral-700 dark:text-neutral-300 hover:bg-neutral-400/8 dark:hover:bg-neutral-200/3 px-5 py-5">
                    <Bookmark size={18} />
                  </button>
                </Flex>
              </Flex>
            </motion.div>
          )}
        </AnimatePresence>
      </Flex>
    </Flex>
  );
}
