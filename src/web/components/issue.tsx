import { deleteFromStoreCompletionEvent$ } from "@core/events";
import { Button, ContextMenu, Dialog, Flex, Text } from "@radix-ui/themes";
import t from "@shared/config";
import type { Issue as issue } from "@src/shared/types";
import { useRouter } from "@tanstack/react-router";
import { Minus, Plus, RefreshCcw, Trash2 } from "lucide-react";
import moment from "moment";
import { useRef } from "react";
import FlatList from "./flatlist";
import Spinner from "./spinner";

type Props = {
  issue: issue;
};

export default function Issue({ issue }: Props) {
  const utils = t.useUtils();
  const navigation = useRouter();
  const dialogRef = useRef<HTMLButtonElement>(null);

  const { mutate: deleteIssue } = t.issue.deleteIssue.useMutation({
    onSuccess: () => utils.library.getLibrary.invalidate(),
  });

  const { mutate: addToCollection } =
    t.collection.addIssueToCollection.useMutation({
      onSuccess: () => {
        utils.library.getLibrary.invalidate();
      },
    });

  const { mutate: removeFromCollection } =
    t.collection.removeFromCollection.useMutation({
      onSuccess: () => {
        utils.library.invalidate();
        utils.collection.invalidate();
      },
    });

  const { data, isLoading } = t.collection.getCollections.useQuery();

  deleteFromStoreCompletionEvent$.on(() => utils.library.invalidate());

  const go = () =>
    navigation.navigate({
      to: "/$issueId",
      params: {
        issueId: issue.id,
      },
    });

  return (
    <>
      <ContextMenu.Root>
        <ContextMenu.Trigger>
          <Flex
            className="w-[200px] h-[300px] mb-14 cursor-pointer"
            gap="1"
            direction="column"
            onClick={go}
          >
            <img
              className="w-full h-full bg-zinc-200/5 rounded-md border-1 border-solid border-zinc-600"
              alt="issue_thumbnail"
              src={issue.thumbnailUrl}
            />
            <Flex direction="column">
              <Text size="2" className="text-gray-600 dark:text-zinc-300">
                {issue.issueTitle}
              </Text>
            </Flex>
          </Flex>
        </ContextMenu.Trigger>
        <ContextMenu.Content size="1" variant="soft">
          <ContextMenu.Item
            className="cursor-pointer"
            onClick={() =>
              navigation.navigate({
                to: "/edit/$id",
                params: {
                  id: issue.id,
                },
              })
            }
          >
            <Text size="1">Edit Issue</Text>
          </ContextMenu.Item>
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger>
              <ContextMenu.Item>
                <Text size="1">More</Text>
              </ContextMenu.Item>
            </ContextMenu.SubTrigger>
            <ContextMenu.SubContent>
              <ContextMenu.Item className="cursor-pointer">
                <Flex align="center" gap="2" justify="between" width="100%">
                  <Text size="1"> Regenerate Thumbnail</Text>
                  <RefreshCcw size={11} />
                </Flex>
              </ContextMenu.Item>
              <ContextMenu.Item
                onClick={() => dialogRef.current?.click()}
                className="cursor-pointer"
              >
                <Flex align="center" gap="4" justify="between" width="100%">
                  <Text size="1">Add To Collection</Text>
                  <Plus size={11} />
                </Flex>
              </ContextMenu.Item>
              {issue.collectionId !== null && (
                <ContextMenu.Item
                  onClick={() => removeFromCollection({ issueId: issue.id })}
                >
                  <Flex align="center" gap="2" justify="between" width="100%">
                    <Text size="1"> Remove From Collection</Text>
                    <Minus size={11} />
                  </Flex>
                </ContextMenu.Item>
              )}
              <ContextMenu.Item
                onClick={() =>
                  deleteIssue({
                    issueId: issue.id,
                  })
                }
                color="ruby"
                className="cursor-pointer"
              >
                <Flex align="center" justify="between" width="100%">
                  <Text size="1">Delete Issue</Text>
                  <Trash2 size={11} />
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
        <Dialog.Content className="space-y-2" size="1">
          <Text size="6">My Collections</Text>
          {isLoading && <Spinner size={10} />}
          <FlatList
            data={data?.collections || []}
            renderItem={({ item, index }) => (
              <Flex
                align="center"
                justify="between"
                key={item.id}
                className="px-2 rounded-md py-2 cursor-pointer"
              >
                <Flex
                  direction="column"
                  align="start"
                  justify="center"
                  className="w-[75%]"
                >
                  <Text size="4">{item.collectionName}</Text>
                  <Text size="2" color="gray">
                    {moment(item.dateCreated).fromNow()}
                  </Text>
                </Flex>
                <Flex align="center" justify="end" gap="2">
                  <Button
                    size="1"
                    color="blue"
                    className="cursor-pointer px-4"
                    variant="outline"
                    onClick={() =>
                      addToCollection({
                        issueId: issue.id,
                        collectionId: item.id,
                      })
                    }
                  >
                    <Flex align="center" justify="center" gap="2">
                      <Text>Add</Text>
                    </Flex>
                  </Button>
                </Flex>
              </Flex>
            )}
          />
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}
