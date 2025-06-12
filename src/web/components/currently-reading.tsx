import { ContextMenu, Flex, Text } from "@radix-ui/themes";
import { useRouter } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { memo, useMemo } from "react";

type Props = {
  issue: CurrentlyReading;
};

const CurrentlyReading = ({ issue }: Props) => {
  const navigation = useRouter();

  const width = useMemo(
    () => (issue.currentPage / issue.totalPages) * 100,
    [issue],
  );

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <Flex
          onClick={() =>
            navigation.navigate({
              to: "/read/$issueId",
              params: {
                issueId: issue.id,
              },
            })
          }
          className="relative w-[245px] cursor-pointer h-[370px] border-1 border-solid border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden"
        >
          <img
            src={issue.thumbnailUrl}
            alt={issue.title}
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
              {issue.title}
            </Text>
            <Flex className="bg-zinc-400/50 dark:bg-zinc-400/20 w-full rounded-full">
              <div
                className="rounded-full bg-moonlightOrange p-[2.3px]"
                style={{ width: `${width}%` }}
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
};

export default memo(CurrentlyReading);
