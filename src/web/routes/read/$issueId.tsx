import { Switch, useObservable } from "@legendapp/state/react";
import { Flex } from "@radix-ui/themes";
import t from "@shared/config";
import { toast } from "@src/web/components/toast";
import { createFileRoute } from "@tanstack/react-router";
import { useGesture } from "@use-gesture/react";
import { Bookmark, ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { AnimatePresence, motion, useMotionValue } from "motion/react";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Spinner } from "../../components";
import { useDebounce, useKeyPress, useTimeout, useWindow } from "../../hooks";
import { globalState$, readingState$ } from "../../state";

const DRAG_BUFFER = 50;

export const Route = createFileRoute("/read/$issueId")({
  component: memo(Component),
});

function Component() {
  const { issueId } = Route.useParams();

  const isEnabled = useObservable(false);
  const isVisible = useObservable(true);

  const [crop, setCrop] = useState({
    scale: 1,
    x: 0,
    y: 0,
  });

  const targetRef = useRef<HTMLImageElement>(null);

  useGesture(
    {
      onPinch: ({ offset: [d] }) =>
        setCrop((crop) => ({ ...crop, scale: 1 + d / 50 })),
      onDrag: ({ offset: [dx, dy] }) =>
        setCrop((crop) => ({ ...crop, x: dx, y: dy })),
    },
    {
      target: targetRef,
      eventOptions: {
        passive: false,
      },
    },
  );

  const doneReading = readingState$.doneReading.get();
  const currentlyReading = readingState$.currentlyReading.get();
  const isFullScreen = globalState$.isFullscreen.get();

  const { data, isLoading } = t.issue.getPages.useQuery(
    {
      issueId,
    },
    {
      enabled: isEnabled.get(),
      onError: (error) => {
        console.error(error);
        toast.error(error.message);
      },
    },
  );

  const contentLength = data?.pages.length || 0;
  const [itemIndex, setItemIndex] = useState(
    currentlyReading.get(issueId)?.currentPage || 0,
  );

  const width = useMemo(
    () => Math.floor((itemIndex / contentLength) * 100),
    [contentLength, itemIndex],
  );

  useTimeout(() => isEnabled.set(true), 2_000);

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
          <Switch value={globalState$.reader.direction.get()}>
            {{
              horizontal: () => (
                <HorizontalReader
                  pages={data?.pages || []}
                  itemIndex={itemIndex}
                  setItemIndex={setItemIndex}
                  contentLength={contentLength}
                />
              ),
              vertical: () => (
                <VerticalReader
                  pages={data?.pages || []}
                  itemIndex={itemIndex}
                  setItemIndex={setItemIndex}
                  contentLength={contentLength}
                />
              ),
            }}
          </Switch>
          {/* <AnimatePresence mode="wait">
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
              {data?.pages.map((v, idx) => (
                <div
                  className="w-full h-screen flex items-center justify-center shrink-0"
                  key={v.id}
                >
                  <motion.img
                    animate={{
                      x: crop.x,
                      y: crop.y,
                      transform: `scale(${crop.scale})`,
                    }}
                    style={{
                      touchAction: "none",
                    }}
                    ref={targetRef}
                    src={v.data}
                    alt="page"
                    className="h-full w-[50%] object-contain"
                  />
                </div>
              ))}
            </motion.div>
          </AnimatePresence> */}
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
                    className="p-1.2 bg-neutral-900 rounded-full dark:bg-neutral-100"
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

const HorizontalReader = React.memo(
  ({
    pages,
    contentLength,
    itemIndex,
    setItemIndex,
  }: {
    pages: Array<{ id: string; data: string }>;
    contentLength: number;
    itemIndex: number;
    setItemIndex: React.Dispatch<React.SetStateAction<number>>;
  }) => {
    const dragX = useMotionValue(0);

    const onDragEnd = () => {
      const x = dragX.get();

      if (x <= DRAG_BUFFER && itemIndex < contentLength - 1) {
        setItemIndex((index) => index + 1);
      } else if (x >= DRAG_BUFFER && itemIndex > 0) {
        setItemIndex((index) => index - 1);
      }
    };

    return (
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
          {pages.map((v, idx) => (
            <div
              className="w-full h-screen flex items-center justify-center shrink-0"
              key={v.id}
            >
              <motion.img
                src={v.data}
                alt="page"
                className="h-full w-[50%] object-contain"
              />
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    );
  },
);

const VerticalReader = React.memo(
  ({
    pages,
    contentLength,
    itemIndex,
    setItemIndex,
  }: {
    pages: Array<{ id: string; data: string }>;
    contentLength: number;
    itemIndex: number;
    setItemIndex: React.Dispatch<React.SetStateAction<number>>;
  }) => {
    const dragY = useMotionValue(0);

    const onDragEnd = () => {
      const x = dragY.get();

      if (x <= DRAG_BUFFER && itemIndex < contentLength - 1) {
        setItemIndex((index) => index + 1);
      } else if (x >= DRAG_BUFFER && itemIndex > 0) {
        setItemIndex((index) => index - 1);
      }
    };

    return (
      <AnimatePresence mode="wait">
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          style={{ y: dragY }}
          initial={{ translateY: 0 }}
          animate={{
            translateY: `-${itemIndex * 100}%`,
          }}
          exit={{ translateX: 0 }}
          onDragEnd={onDragEnd}
          transition={{
            bounceDamping: 4,
          }}
          className="flex cursor-grab active:cursor-grabbing items-center"
        >
          {pages.map((v, idx) => (
            <div
              className="w-full h-screen flex items-center justify-center shrink-0"
              key={v.id}
            >
              <motion.img
                src={v.data}
                alt={`${v.id}_page`}
                className="h-full w-[50%] object-contain"
              />
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
    );
  },
);
