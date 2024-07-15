import { ContextMenu, Flex, Text } from "@radix-ui/themes";
import type { Issue as issue } from "@src/shared/types";
import { Edit, Trash2 } from "lucide-react";

type Props = {
  issue: issue;
};

export default function Issue({ issue }: Props) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <Flex
          className="w-[200px] h-[300px] cursor-pointer"
          gap="1"
          direction="column"
        >
          {/* TODO make image */}
          <div
            className="w-full p-2 h-full bg-zinc-200/5 rounded-md border-1 border-solid border-zinc-400 dark:border-zinc-800"
            // alt="issue_thumbnail"
          />
          <Flex direction="column" align="start">
            <Text size="2" className="text-gray-600 dark:text-zinc-400">
              {issue.issueTitle}
            </Text>
          </Flex>
        </Flex>
      </ContextMenu.Trigger>
      <ContextMenu.Content size="1" variant="soft">
        <ContextMenu.Item className="cursor-pointer">
          <Flex align="center" justify="start" gap="1">
            <Edit size={10} />
            <Text>Edit Issue</Text>
          </Flex>
        </ContextMenu.Item>
        <ContextMenu.Item className="cursor-pointer">
          <Flex align="center" justify="start" gap="1">
            <Trash2 size={10} />
            <Text>Delete Issue</Text>
          </Flex>
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
}
