import { useObservable } from "@legendapp/state/react";
import { Flex } from "@radix-ui/themes";
import t from "@shared/config";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import { Bookmark, ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { memo, useEffect, useMemo, useState } from "react";
import { Spinner } from "../components";
import {
  useDebounce,
  useInterval,
  useKeyPress,
  useTimeout,
  useWindow,
} from "../hooks";
import { globalState$, readingState$ } from "../state";

const DRAG_BUFFER = 50;

export const Route = createFileRoute("/$issueId")({
  component: memo(Component),
});

function Component() {
  const { issueId } = Route.useParams();

  const isEnabled = useObservable(false);
  const isVisible = useObservable(true);

  const doneReading = readingState$.doneReading.get();
  const currentlyReading = readingState$.currentlyReading.get();
  const isFullScreen = globalState$.isFullscreen.get();

  const { data, isLoading } = t.issue.getPages.useQuery(
    {
      issueId,
    },
    {
      enabled: isEnabled.get(),
    },
  );

  const contentLength = data?.pages.length || 0;
  const [itemIndex, setItemIndex] = useState(
    currentlyReading.get(issueId)?.currentPage || 0,
  );

  const dragX = useMotionValue(0);
  const width = useMemo(
    () => Math.floor((itemIndex / contentLength) * 100),
    [contentLength, itemIndex],
  );

  // save reading state to store every few seconds
  // while reading
  useInterval(() => {
    if (itemIndex < contentLength - 1) {
      currentlyReading.set(issueId, {
        id: issueId,
        title: data?.issueTitle || "",
        thumbnailUrl: data?.thumbnailUrl || "",
        currentPage: itemIndex,
        totalPages: contentLength - 1,
      });
      return;
    }

    if (itemIndex === contentLength - 1) {
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

  useTimeout(() => isEnabled.set(true), 3_000);

  const goRight = useDebounce(() => setItemIndex((index) => index - 1), 1500);

  const goLeft = useDebounce(() => setItemIndex((index) => index - 1), 1500);

  const debounceKeyPress = useDebounce((e: KeyboardEvent) => {
    if (e.keyCode === 93 && itemIndex < contentLength - 1) {
      setItemIndex((index) => index + 1);
    } else if (e.keyCode === 91 && itemIndex > 0) {
      setItemIndex((index) => index - 1);
    }
  }, 50);

  const mouseHandle = useDebounce((_: MouseEvent) => isVisible.set(true), 100);

  useKeyPress(debounceKeyPress);

  useTimeout(() => isVisible.set(false), 2_500);

  useWindow("mousemove", mouseHandle);

  useEffect(() => {
    globalState$.isFullscreen.set(false);
  }, []);

  const onDragEnd = () => {
    const x = dragX.get();

    if (x <= DRAG_BUFFER && itemIndex < contentLength - 1) {
      setItemIndex((index) => index + 1);
    } else if (x >= DRAG_BUFFER && itemIndex > 0) {
      setItemIndex((index) => index - 1);
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
              <Spinner size={40} className="border-2 border-moonlightOrange" />
            </div>
          </Flex>
        )}
        <div className="absolute z-0 h-[10%]">
          <AnimatePresence mode="wait">
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              style={{ x: dragX }}
              initial={{ translateX: 0 }}
              animate={{
                translateX: `-${itemIndex * 100}%`,
              }}
              exit={{ translateX: 0 }}
              onDragEnd={onDragEnd}
              transition={{
                bounceDamping: 4,
              }}
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
          </AnimatePresence>
        </div>
        {/* controls */}
        <AnimatePresence mode="wait">
          {isVisible.get() && (
            <motion.div
              initial={{ transform: "translateY(50px)" }}
              animate={{
                transform: "translateY(0px)",
              }}
              exit={{ transform: "translateY(50px)" }}
              className="w-full"
            >
              <Flex
                align="center"
                justify="between"
                gap="3"
                className="fixed z-10 bg-gray-100/20 dark:bg-gray-100/5 bottom-0 left-0 w-full"
              >
                <Flex align="center" justify="start">
                  <button
                    onClick={() => setItemIndex((index) => index - 1)}
                    className="text-neutral-700 px-5 py-5 cursor-pointer hover:bg-neutral-400/8 dark:hover:bg-neutral-200/3 dark:text-neutral-300"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setItemIndex((index) => index + 1)}
                    className="text-neutral-700 px-5 cursor-pointer py-5 hover:bg-neutral-400/8 dark:hover:bg-neutral-200/3 dark:text-neutral-300"
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
                    onClick={() => globalState$.isFullscreen.set(!isFullScreen)}
                    className="text-neutral-700 cursor-pointer dark:text-neutral-300 hover:bg-neutral-400/8 dark:hover:bg-neutral-200/3 px-5 py-5"
                  >
                    <Expand size={18} />
                  </button>
                  <button className="text-neutral-700 cursor-pointer dark:text-neutral-300 hover:bg-neutral-400/8 dark:hover:bg-neutral-200/3 px-5 py-5">
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
