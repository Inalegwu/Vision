import { ContextMenu, Flex, Text } from "@radix-ui/themes";
import type { Collection as CollectionType, Issue } from "@shared/types";
import { useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";

type Props = {
  collection: CollectionType & {
    issues: Array<Issue>;
  };
};

// TODO work on shared element transitions
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
          gap="2"
        >
          <Flex className="w-full h-full relative rounded-md ">
            {collection.issues.map((issue, idx) => (
              <motion.img
                src={issue.thumbnailUrl}
                alt={issue.issueTitle}
                key={issue.id}
                className={`w-full h-full absolute z-${idx} rounded-lg border-1 border-solid border-zinc-200 dark:border-zinc-800`}
                style={{
                  transform: `rotateZ(${
                    idx === 0 ? -1.5 : idx % 2 === 0 ? -idx * 1 : idx * 1
                  }deg)`,
                }}
              />
            ))}
          </Flex>
          <Flex direction="column" gap="1" align="start">
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
