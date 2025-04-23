import { Icon } from "@components";
import { ContextMenu, Flex, Text, Tooltip } from "@radix-ui/themes";
import t from "@shared/config";
import { useRouter } from "@tanstack/react-router";
import * as A from "effect/Array";
import { motion } from "framer-motion";
import React from "react";

type Props = {
  collection: Collection & {
    issues: Array<Issue>;
  };
};

const Collection = React.memo(({ collection }: Props) => {
  const utils = t.useUtils();
  const navigation = useRouter();

  const { mutate: deleteCollection } =
    t.collection.deleteCollection.useMutation({
      onSuccess: () => utils.library.invalidate(),
    });

  const go = () =>
    navigation.navigate({
      to: "/collection/$collectionId",
      params: {
        collectionId: collection.id,
      },
    });

  const images = A.drop(collection.issues.length - 3)(collection.issues);

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <Flex
          onClick={go}
          className="w-[200px] h-[320px] cursor-pointer mt-6"
          direction="column"
          gap="2"
        >
          <Flex className="w-full h-full relative rounded-md ">
            {images.map((issue, idx) => (
              <motion.img
                src={issue.thumbnailUrl}
                alt={issue.issueTitle}
                key={issue.id}
                className={`w-full h-full absolute z-${
                  idx * 10
                } rounded-lg border-1 border-solid border-zinc-200 dark:border-zinc-800`}
                style={{
                  transform: `rotateZ(${
                    idx === 0 ? -1.5 : idx % 2 === 0 ? -idx * 1 : idx * 1
                  }deg)`,
                }}
              />
            ))}
          </Flex>
          <Flex direction="column" align="start">
            <Text
              size="1"
              weight="medium"
              className="text-black dark:text-white"
            >
              {collection.collectionName}
            </Text>
            <Text size="1" className="text-moonlightSlight">
              {collection.issues.length} Issues
            </Text>
          </Flex>
        </Flex>
      </ContextMenu.Trigger>
      <ContextMenu.Content size="1" variant="soft">
        <Flex align="center" justify="start" width="100%">
          <Tooltip content="See Collection">
            <button
              onClick={() =>
                navigation.navigate({
                  to: "/collection/$collectionId",
                  params: {
                    collectionId: collection.id,
                  },
                })
              }
              className="p-2 rounded-md cursor-pointer dark:text-moonlightSlight hover:bg-neutral-400/10 dark:hover:bg-neutral-400/5"
            >
              <Icon name="ChevronRight" size={12} />
            </button>
          </Tooltip>
          <Tooltip content="Delete Collection">
            <button
              onClick={() =>
                deleteCollection({
                  collectionId: collection.id,
                })
              }
              className="p-2 rounded-md cursor-pointer text-red-500 hover:bg-red-500/10"
            >
              <Icon name="Trash" size={12} />
            </button>
          </Tooltip>
        </Flex>
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
});

export default Collection;
