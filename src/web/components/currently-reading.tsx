import { ContextMenu, Flex, Text } from "@radix-ui/themes";
import type { Issue } from "@src/shared/types";
import { useRouter } from "@tanstack/react-router";
import { Check } from "lucide-react";

type Props = {
  issue: Issue;
};

export default function CurrentlyReading({ issue }: Props) {
  const navigation = useRouter();

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <Flex
          onClick={() =>
            navigation.navigate({
              to: "/$issueId",
              params: {
                issueId: issue.id,
              },
            })
          }
          className="relative w-[600px] cursor-pointer h-[340px] border-1 border-solid border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden"
        >
          <img
            src={issue.thumbnailUrl}
            alt={issue.issueTitle}
            className="absolute z-0 w-full h-full"
          />
          <Flex
            className="absolute z-1 w-full h-full bg-black/20 dark:bg-black/30 px-3 py-4"
            align="start"
            justify="end"
            direction="column"
            gap="2"
          >
            <Text size="4" weight="bold" className="tracking-wide">
              {issue.issueTitle}
            </Text>
            <Flex className="bg-zinc-400/50 dark:bg-zinc-400/20 w-full rounded-full">
              <div className="w-2/6 rounded-full bg-white p-[2px]" />
            </Flex>
          </Flex>
        </Flex>
      </ContextMenu.Trigger>
      <ContextMenu.Content size="1" variant="soft">
        <ContextMenu.Item className="cursor-pointer">
          <Flex align="center" gap="2" justify="start">
            <Check size={10} />
            <Text size="1">Mark as Done Reading</Text>
          </Flex>
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
}
