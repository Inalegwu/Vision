import { Flex, Text } from "@radix-ui/themes";
import type { Issue } from "@src/shared/types";

type Props = {
  issue: Issue;
};

export default function CurrentlyReading({ issue }: Props) {
  return (
    <Flex className="relative w-[600px] cursor-pointer h-[340px] border-1 border-solid border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden">
      <Flex className="absolute z-0 w-full h-full" />
      <Flex
        className="absolute z-1 w-full h-full bg-black/30 px-3 py-4"
        align="start"
        justify="end"
        direction="column"
        gap="2"
      >
        <Text size="4" weight="bold" className="tracking-wide">
          {issue.issueTitle}
        </Text>
        <Flex className="bg-zinc-400/20 w-full rounded-full">
          <div className="w-2/6 rounded-full bg-white p-[2px]" />
        </Flex>
      </Flex>
    </Flex>
  );
}
