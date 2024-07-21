import { ContextMenu, Flex, Text } from "@radix-ui/themes";
import type { ReadingIssue } from "@src/shared/types";
import { useRouter } from "@tanstack/react-router";
import { Check } from "lucide-react";

type Props = {
  issue: ReadingIssue;
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
                issueId: issue.issueId,
              },
            })
          }
          className="relative w-[245px] cursor-pointer h-[370px] border-1 border-solid border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden"
        >
          <img
            src={issue.thumbnailUrl}
            alt={issue.issueTitle}
            className="absolute z-0 w-full h-full object-cover"
          />
          <Flex
            className="absolute z-1 w-full h-full bg-black/50 dark:bg-black/60 px-3 py-4"
            align="start"
            justify="end"
            direction="column"
            gap="2"
          >
            <Text size="2" weight="bold" className="text-white">
              {issue.issueTitle}
            </Text>
            <Flex className="bg-zinc-400/50 dark:bg-zinc-400/20 w-full rounded-full">
              <div
                className={`w-[${
                  (issue.pageNumber / issue.totalPages) * 100
                }%] rounded-full bg-white p-[2px]`}
              />
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
