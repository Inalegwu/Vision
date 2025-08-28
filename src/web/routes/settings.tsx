import { Flex, Tabs, Text, Tooltip } from "@radix-ui/themes";
import t from "@src/shared/config";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import React, { memo } from "react";
import { Icon } from "../components";
import { toast } from "../components/toast";
import { globalState$ } from "../state";

export const Route = createFileRoute("/settings")({
  component: memo(Component),
});

function Component() {
  console.log(globalState$.get());

  return (
    <Flex direction="column" className="w-full h-screen pt-9">
      <Tabs.Root defaultValue="storage">
        <Tabs.List defaultValue="storage" size="2">
          <Tabs.Trigger className="cursor-pointer" value="storage">
            <Text size="2">Storage</Text>
          </Tabs.Trigger>
          <Tabs.Trigger className="cursor-pointer" value="reader">
            <Text size="2">Reader</Text>
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="storage" className="w-full h-screen">
          <StorageView />
        </Tabs.Content>
        <Tabs.Content value="reader" className="w-full h-screen">
          <ReaderView />
        </Tabs.Content>
      </Tabs.Root>
    </Flex>
  );
}

const StorageView = React.memo(() => {
  const utils = t.useUtils();

  const { mutate: emptyCache } = t.library.emptyCache.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: () => utils.library.invalidate(),
  });

  return (
    <Flex className="w-full h-full px-2 py-2" gap="3" direction="column">
      <Flex align="center" justify="between" width="100%">
        <Flex direction="column">
          <Text weight="medium" size="2">
            Empty Cache
          </Text>
          <Text size="1" color="gray">
            Empty storage cache
          </Text>
        </Flex>
        <button
          onClick={() => emptyCache()}
          className="p-3 rounded-md cursor-pointer dark:text-moonlightSlight hover:bg-neutral-400/10 dark:hover:bg-neutral-400/5"
        >
          <Icon name="Recycle" size={14} />
        </button>
      </Flex>
    </Flex>
  );
});

const ReaderView = React.memo(() => {
  const direction = globalState$.reader.direction.get();

  return (
    <Flex className="w-full h-full px-2 py-2" direction="column" gap="3">
      <Flex width="100%" align="center" justify="between">
        <Flex direction="column">
          <Text weight="medium" size="2">
            Reader Direction
          </Text>
          <Text size="1" color="gray">
            change scroll direction of the reader view
          </Text>
        </Flex>
        <Flex
          gap="1"
          className="bg-neutral-100 rounded-lg p-0.6 relative dark:bg-moonlightFocusMedium"
        >
          <motion.div
            animate={{
              transform:
                direction === "horizontal"
                  ? "translateX(0px)"
                  : "translateX(28px)",
            }}
            className="absolute z-0 w-[45%] h-[89%] rounded-lg bg-white dark:bg-moonlightFocusLow"
          />
          <Tooltip content="Vertical">
            <button
              onClick={() => globalState$.reader.direction.set("vertical")}
              className={`p-1.6 cursor-pointer ${
                direction === "vertical"
                  ? " text-moonlightOrange"
                  : "text-neutral-600"
              }`}
            >
              <Icon name="MoveVertical" size={13} />
            </button>
          </Tooltip>
          <Tooltip content="Horizontal">
            <button
              onClick={() => globalState$.reader.direction.set("horizontal")}
              className={`p-1.6 cursor-pointer ${
                direction === "vertical"
                  ? " text-moonlightOrange"
                  : "text-neutral-600"
              }`}
            >
              <Icon name="MoveHorizontal" size={13} />
            </button>
          </Tooltip>
        </Flex>
      </Flex>
    </Flex>
  );
});
