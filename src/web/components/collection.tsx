import { ContextMenu, Flex, Text } from "@radix-ui/themes";
import type { Collection as CollectionType } from "@shared/types";

type Props = {
  collection: CollectionType;
};

export default function Collection({ collection }: Props) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <Flex className="w-[200px] h-[320px] mb-14" direction="column" gap="1">
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
    </ContextMenu.Root>
  );
}
