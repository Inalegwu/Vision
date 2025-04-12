import { Flex, Heading, Text } from "@radix-ui/themes";
import { Link, createLazyFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { useDebounce, useKeyPress } from "../hooks";
import { globalState$ } from "../state";

export const Route = createLazyFileRoute("/first-launch")({
  component: memo(Component),
});

const DRAG_BUFFER = 50;

const welcomeMessages = [
  {
    id: 0,
    title: "Welcome To Vision",
    subtitle: "Your Comic Book Reader from The Future 🔮",
  },
  {
    id: 1,
    title: "Sleek and Modern",
    subtitle: "Designed to be Beautiful 💅🏾",
  },
  {
    id: 2,
    title: "Fast",
    subtitle: "Speed !!! This is Speed 🏃🏾‍♂️‍➡️",
  },
];

function Component() {
  const dragX = useMotionValue(0);
  const [itemIndex, setItemIndex] = useState<number>(0);

  const onDragEnd = () => {
    const x = dragX.get();

    if (x <= DRAG_BUFFER && itemIndex < welcomeMessages.length - 1) {
      setItemIndex((index) => index + 1);
    } else if (x >= DRAG_BUFFER && itemIndex > 0) {
      setItemIndex((index) => index - 1);
    }
  };

  const debounceKeyPress = useDebounce((e: KeyboardEvent) => {
    if (e.keyCode === 93 && itemIndex < welcomeMessages.length - 1) {
      setItemIndex((index) => index + 1);
    } else if (e.keyCode === 91 && itemIndex > 0) {
      setItemIndex((index) => index - 1);
    }
  }, 50);

  useEffect(() => {
    globalState$.isFullscreen.set(true);
  }, []);

  useKeyPress(debounceKeyPress);

  return (
    <Flex className="w-full h-screen bg-white dark:bg-moonlightBase relative">
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-92 h-92 rounded-full bg-yellow-400/50 blur-3xl"
      />
      <Flex className="w-full h-full absolute z-10 bg-transparent backdrop-blur-9xl">
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
              bounceDamping: 10,
            }}
            className="flex cursor-grab w-full h-full active:cursor-grabbing items-center"
          >
            {welcomeMessages.map((message) => (
              <Flex
                align="center"
                justify="center"
                direction="column"
                key={message.id}
                gap="1"
                className="w-full h-full shrink-0"
              >
                <Heading size="8" className="text-yellow-500">
                  {message.title}
                </Heading>
                <Text size="4" color="gray">
                  {message.subtitle}
                </Text>
              </Flex>
            ))}
          </motion.div>
        </AnimatePresence>
      </Flex>
      <Flex
        align="center"
        justify="center"
        gap="2"
        className="absolute z-10 bottom-[3%] left-[50%]"
      >
        {welcomeMessages.map((m, idx) => (
          <div
            className={`w-4 h-4 rounded-full ${
              itemIndex === idx
                ? "bg-yellow-400"
                : "bg-neutral-200 dark:bg-neutral-800"
            }`}
            key={m.id}
          />
        ))}
        <AnimatePresence>
          {itemIndex === welcomeMessages.length - 1 && (
            <motion.div
              initial={{ opacity: 0, display: "none", scale: 0 }}
              animate={{ opacity: 1, display: "flex", scale: 1 }}
              exit={{ opacity: 0, display: "none", scale: 0 }}
              className="p-1"
            >
              <Link
                to="/"
                onClick={() => {
                  globalState$.isFullscreen.set(false);
                  globalState$.firstLaunch.set(false);
                }}
                className="flex items-center justify-center bg-yellow-400 cursor-pointer rounded-full w-4 h-4 text-white"
              >
                <ChevronRight size={14} />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </Flex>
    </Flex>
  );
}
