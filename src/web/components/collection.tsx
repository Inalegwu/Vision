import { ContextMenu, Flex, Text } from "@radix-ui/themes";
import t from "@shared/config";
import { useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Info, Trash2 } from "lucide-react";

type Props = {
  collection: Collection & {
    issues: Array<Issue>;
  };
};

// TODO work on shared element transitions
export default function Collection({ collection }: Props) {
  const utils = t.useUtils();
  const navigation = useRouter();

  const { mutate: deleteIssue } = t.collection.deleteCollection.useMutation({
    onSuccess: () => utils.library.invalidate(),
  });

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
          className="w-[200px] h-[320px] cursor-pointer mt-6"
          direction="column"
          gap="2"
        >
          <Flex className="w-full h-full relative rounded-md ">
            {collection.issues
              .reverse()
              .slice(0, 3)
              .map((issue, idx) => (
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
        <ContextMenu.Item>
          <Flex align="center" width="100%" justify="between">
            <Text size="1">Info</Text>
            <Info size={10} />
          </Flex>
        </ContextMenu.Item>
        <ContextMenu.Sub>
          <ContextMenu.SubTrigger>
            <Flex align="center" justify="start">
              <Text size="1">More</Text>
            </Flex>
          </ContextMenu.SubTrigger>
          <ContextMenu.SubContent>
            <ContextMenu.Item
              onClick={() =>
                deleteIssue({
                  collectionId: collection.id,
                })
              }
              color="tomato"
              className="cursor-pointer"
            >
              <Flex align="center" gap="3" justify="between" width="100%">
                <Text size="1">Delete Collection</Text>
                <Trash2 size={10} />
              </Flex>
            </ContextMenu.Item>
          </ContextMenu.SubContent>
        </ContextMenu.Sub>
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
}
