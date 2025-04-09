import { ContextMenu, Flex, Text } from "@radix-ui/themes";
import type { DoneReading as DoneReadingType } from "@src/shared/types";
import { Minus } from "lucide-react";

type Props = {
  issue: DoneReadingType;
};

export default function DoneReading({ issue }: Props) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <Flex className="w-2/6 cursor-pointer rounded-md border-1 border-solid border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden">
          <img
            src={issue.thumbnailUrl}
            alt={issue.title}
            className="w-2/6 h-full border-r-1 border-r-solid dark:border-r-zinc-800 border-r-zinc-200"
          />
          <Flex
            className="px-2 py-2 bg-light-5 dark:bg-dark-9"
            align="start"
            justify="end"
            grow="1"
            gap="1"
            direction="column"
          >
            <Text
              size="1"
              weight="bold"
              className="tracking-wider"
              color="gray"
            >
              {issue.title}
            </Text>
            {/* TODO install moment and give a proper value */}
            {/* <Text className="text-[11.5px]" weight="regular" color="gray">
              {issue.dateFinished?.toString()}
            </Text> */}
          </Flex>
        </Flex>
      </ContextMenu.Trigger>
      <ContextMenu.Content size="1" variant="soft">
        <ContextMenu.Item className="cursor-pointer">
          <Flex align="center" justify="start" gap="1">
            <Minus size={10} />
            <Text>Remove from Done Reading</Text>
          </Flex>
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
}
