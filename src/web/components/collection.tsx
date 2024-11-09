import { ContextMenu, Flex, Text } from "@radix-ui/themes";
import type { Collection as CollectionType, Issue } from "@shared/types";
import { useRouter } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";

type Props = {
  collection: CollectionType & {
    issues: Array<Issue>;
  };
};

export default function Collection({ collection }: Props) {
  const navigation = useRouter();

  const go = () =>
    navigation.navigate({
      to: "/collection/$collectionId",
      params: {
        collectionId: collection.id,
      },
    });

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <Flex
          onClick={go}
          className="w-[200px] h-[320px] mb-14 cursor-pointer"
          direction="column"
          gap="1"
        >
          <Flex className="w-full h-full overflow-hidden relative rounded-md border-1 border-solid border-zinc-200 dark:border-zinc-800">
            {collection.issues.slice(0, 2).map((issue, idx) => (
              <img
                key={issue.id}
                src={issue.thumbnailUrl}
                alt={issue.issueTitle}
                className={`z-${idx * 10} w-full h-full absolute`}
                style={{
                  transform: `rotateX(${idx * 10}deg)`,
                }}
              />
            ))}
          </Flex>
          <Flex direction="column" gap="1" align="start">
            {/* <span className="px-3 py-1 rounded-full cursor-pointer bg-zinc-400/20 text-xs">
              collection
            </span> */}
            <Text size="1" className="text-gray-600 dark:text-zinc-400">
              {collection.collectionName}
            </Text>
          </Flex>
        </Flex>
      </ContextMenu.Trigger>
      <ContextMenu.Content size="1" variant="soft">
        <ContextMenu.Item color="tomato" className="cursor-pointer">
          <Flex align="center" justify="start" gap="1">
            <Trash2 size={10} />
            <Text size="2">Delete Collection</Text>
          </Flex>
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
}
