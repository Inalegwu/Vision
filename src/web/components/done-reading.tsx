import { ContextMenu, Flex, Text } from "@radix-ui/themes";
import type { Issue } from "@src/shared/types";
import { Minus } from "lucide-react";

type Props = {
  issue: Issue;
};

export default function DoneReading({ issue }: Props) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <Flex className="w-2/6 cursor-pointer h-3/6 rounded-md border-1 border-solid border-zinc-200 dark:border-zinc-800 rounded-md">
          <div className="w-2/6 h-full border-r-1 border-r-solid dark:border-r-zinc-800 border-r-zinc-200" />
          <Flex
            className="px-3 py-2"
            align="start"
            justify="center"
            direction="column"
          >
            <Text size="2" color="gray">
              {issue.issueTitle}
            </Text>
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