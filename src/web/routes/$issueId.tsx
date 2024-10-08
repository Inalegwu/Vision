import { useObservable } from "@legendapp/state/react";
import { Flex } from "@radix-ui/themes";
import t from "@shared/config";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import { useEffect, useMemo } from "react";
import { useInterval, useKeyPress, useTimeout } from "../hooks";

const DRAG_BUFFER = 50;

export const Route = createFileRoute("/$issueId")({
  component: Component,
});

function Component() {
  const { issueId } = Route.useParams();

  const isEnabled = useObservable(false);
  const isVisible = useObservable(false);


  const { data, isLoading } = t.issue.getIssue.useQuery(
    {
      issueId,
    },
    {
      enabled: isEnabled.get(),
    },
  );

  const contentLength = data?.issue?.attachments.length||0;
  const itemIndex = useObservable(
    0
  );
  const itemIndexValue = itemIndex.get();
  const dragX = useMotionValue(0);
  const width = useMemo(
    () => Math.floor((itemIndexValue / contentLength) * 100),
    [contentLength, itemIndexValue],
  );

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

      </motion.div>
      {/* progress indicator */}
      <AnimatePresence>
        {isVisible.get() && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Flex
              className="absolute z-20 bottom-10 left-0 w-full"
              align="center"
              justify="center"
            >
              <div className="w-[98%] bg-zinc-400/20 backdrop-blur-3xl rounded-full">
                <motion.div
                  animate={{ width: `${width}%` }}
                  className="rounded-full p-1 bg-zinc-800/40 dark:bg-white/20"
                />
              </div>
            </Flex>
          </motion.div>
        )}
      </AnimatePresence>
    </Flex>
  );
}



// {
//   data?.pages.map((v) => (
//     <div
//       className="w-full h-screen flex items-center justify-center shrink-0"
//       key={v.id}
//     >
//       <img
//         src={v.pageContent}
//         alt="page"
//         className="aspect-[9/16] h-full w-[45%] object-contain"
//       />
//     </div>
//   ))
// }