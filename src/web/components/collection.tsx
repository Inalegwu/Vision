import { ContextMenu, Flex, Text } from "@radix-ui/themes";
import type { Collection as CollectionType } from "@shared/types";
import { useRouter } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";

type Props = {
  collection: CollectionType;
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
          <div className="w-full h-full rounded-md border-1 border-solid border-zinc-200 dark:border-zinc-800" />
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
            <Text size="2">Delete</Text>
            <Trash2 size={10} />
          </Flex>
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
}
