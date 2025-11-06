import { Icon } from "@/web/components";
import {
  ContextMenu,
  Dialog,
  Flex,
  Heading,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import t from "@/shared/config";
import { useRouter } from "@tanstack/react-router";
import { useRef } from "react";
import FlatList from "./flatlist";
import { toast } from "./toast";

type Props = {
  issue: Issue;
};

export default function Issue({ issue }: Props) {
  const utils = t.useUtils();
  const navigation = useRouter();
  const dialogRef = useRef<HTMLButtonElement>(null);

  const { mutate: deleteIssue } = t.issue.deleteIssue.useMutation({
    onSuccess: () => utils.library.getLibrary.invalidate(),
  });

  const { mutate: addToCollection, isLoading: adding } =
    t.library.addIssueToCollection.useMutation({
      onSuccess: () => utils.library.getLibrary.invalidate(),
      onError: (error) => toast.error(error.message),
    });

  const { mutate: removeFromCollection } =
    t.library.removeFromCollection.useMutation({
      onSuccess: () => utils.library.invalidate(),
    });

  const { data } = t.library.getCollections.useQuery();

  const go = () =>
    navigation.navigate({
      to: "/read/$issueId",
      params: {
        issueId: issue.id,
      },
    });

  return (
    <>
      <ContextMenu.Root>
        <ContextMenu.Trigger>
          <Flex
            className="w-[200px] h-[300px] mb-16 cursor-pointer"
            gap="1"
            direction="column"
            onClick={go}
          >
            <img
              className="w-full h-full bg-zinc-200/5 dark:opacity-[0.8] rounded-md border-1 border-solid border-neutral-200 dark:border-zinc-600"
              alt="issue_thumbnail"
              src={issue.thumbnailUrl}
            />
            <Flex direction="column">
              <Text
                size="1"
                weight="medium"
                className="text-black dark:text-neutral-400"
              // className="text-neutral-400"
              >
                {issue.issueTitle}
              </Text>
            </Flex>
          </Flex>
        </ContextMenu.Trigger>
        <ContextMenu.Content
          size="1"
          variant="soft"
          className="dark:bg-moonlightFocusLow"
          color="orange"
        >
          <Flex align="center" justify="start" gap="1" width="100%">
            {issue.collectionId !== null ? (
              <Tooltip
                content={`Remove ${issue.issueTitle} from this collection`}
              >
                <button
                  onClick={() => removeFromCollection({ issueId: issue.id })}
                  className="p-2 rounded-md cursor-pointer text-red-500 hover:bg-red-500/10"
                >
                  <Icon name="Minus" size={12} />
                </button>
              </Tooltip>
            ) : (
              <Tooltip content={`Add ${issue.issueTitle} to a collection`}>
                <button
                  onClick={() => dialogRef.current?.click()}
                  className="p-2 rounded-md cursor-pointer text-moonlightOrange hover:bg-moonlightOrange/10"
                >
                  <Icon name="Plus" size={12} />
                </button>
              </Tooltip>
            )}
            <Tooltip content="About">
              <button
                onClick={() =>
                  navigation.navigate({
                    to: "/edit/$id",
                    params: {
                      id: issue.id,
                    },
                  })
                }
                className="p-2 rounded-md cursor-pointer dark:text-moonlightSlight hover:bg-neutral-400/10 dark:hover:bg-neutral-400/5"
              >
                <Icon name="Info" size={12} />
              </button>
            </Tooltip>
            <Tooltip content="Delete Issue">
              <button
                onClick={() =>
                  deleteIssue({
                    issueId: issue.id,
                  })
                }
                className="p-2 rounded-md cursor-pointer text-red-500 hover:bg-red-500/10"
              >
                <Icon name="Trash" size={12} />
              </button>
            </Tooltip>
          </Flex>
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger>
              <ContextMenu.Item>
                <Flex align="center" justify="start">
                  <Text size="1">More</Text>
                </Flex>
              </ContextMenu.Item>
            </ContextMenu.SubTrigger>
            <ContextMenu.SubContent>
              {issue.collectionId !== null ? (
                <ContextMenu.Item
                  onClick={() => removeFromCollection({ issueId: issue.id })}
                >
                  <Flex align="center" gap="3" justify="between" width="100%">
                    <Text size="1"> Remove From Collection</Text>
                    <Icon name="Minus" size={11} />
                  </Flex>
                </ContextMenu.Item>
              ) : (
                <ContextMenu.Item
                  onClick={() => dialogRef.current?.click()}
                  className="cursor-pointer"
                >
                  <Flex align="center" justify="between" gap="4" width="100%">
                    <Text size="1">Add To Collection</Text>
                    <Icon name="Plus" size={11} />
                  </Flex>
                </ContextMenu.Item>
              )}
              <ContextMenu.Item className="cursor-pointer">
                <Flex gap="3" align="center" justify="between" width="100%">
                  <Text size="1"> Regenerate Thumbnail</Text>
                  <Icon name="RefreshCcw" size={11} />
                </Flex>
              </ContextMenu.Item>
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
        </ContextMenu.Content>
      </ContextMenu.Root>
      <Dialog.Root>
        <Dialog.Trigger>
          <button ref={dialogRef} />
        </Dialog.Trigger>
        <Dialog.Content
          className="space-y-2 max-h-90 dark:bg-moonlightBase"
          size="1"
        >
          <FlatList
            data={data || []}
            className="h-70"
            scrollbars="vertical"
            scrollHideDelay={3000}
            listHeaderComponent={() => (
              <Heading size="6" weight="medium">
                My Collections
              </Heading>
            )}
            renderItem={({ item, index }) => (
              <Flex
                align="center"
                justify="between"
                key={item.id}
                className="rounded-md py-2 cursor-pointer px-1"
              >
                <Text size="2" weight="medium">
                  {item.collectionName}
                </Text>
                <button
                  className="p-2 rounded-md space-x-2 cursor-pointer outline-moonlightOrange text-moonlightOrange hover:bg-moonlightOrange/10"
                  onClick={() =>
                    addToCollection({
                      issueId: issue.id,
                      collectionId: item.id,
                    })
                  }
                >
                  <Icon name="BookPlus" size={13} />
                </button>
              </Flex>
            )}
          />
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}
