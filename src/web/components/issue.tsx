import { deleteFromStoreCompletionEvent$ } from "@core/events";
import {
  ContextMenu,
  Dialog,
  DropdownMenu,
  Flex,
  Text,
} from "@radix-ui/themes";
import t from "@shared/config";
import type { Issue as issue } from "@src/shared/types";
import { useRouter } from "@tanstack/react-router";
import { Edit2, MoreVertical, Plus, Trash2 } from "lucide-react";
import { memo, useRef } from "react";

type Props = {
  issue: issue;
};

export default function Issue({ issue }: Props) {
  const utils = t.useUtils();
  const navigation = useRouter();
  const dialogRef = useRef<HTMLButtonElement>(null);

  const { mutate: deleteIssue } = t.issue.deleteIssue.useMutation({
    onSuccess: () => utils.library.invalidate(),
  });

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
              className="w-full h-full bg-zinc-200/5 rounded-md border-1 border-solid border-zinc-300 dark:border-zinc-800"
              alt="issue_thumbnail"
              src={issue.thumbnailUrl}
            />
            <Flex direction="column">
              <Text size="1" className="text-gray-600 dark:text-zinc-400">
                {issue.issueTitle}
              </Text>
            </Flex>
          </Flex>
        </ContextMenu.Trigger>
        <ContextMenu.Content size="1" variant="soft">
          <ContextMenu.Item
            onClick={() => dialogRef.current?.click()}
            className="cursor-pointer"
          >
            <Flex align="center" gap="4" justify="between" width="100%">
              <Text size="1">Add To Collection</Text>
              <Plus size={11} />
            </Flex>
          </ContextMenu.Item>
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
        </ContextMenu.Content>
      </ContextMenu.Root>
      <Dialog.Root>
        <Dialog.Trigger ref={dialogRef} />
        <Dialog.Content size="1">content</Dialog.Content>
      </Dialog.Root>
    </>
  );
}
