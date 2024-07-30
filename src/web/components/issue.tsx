import { deleteFromStoreCompletionEvent$ } from "@core/events";
import { DropdownMenu, Flex, Text } from "@radix-ui/themes";
import t from "@shared/config";
import type { Issue as issue } from "@src/shared/types";
import { useRouter } from "@tanstack/react-router";
import { Edit2, Link2Off, MoreVertical } from "lucide-react";
import { memo } from "react";

type Props = {
  issue: issue;
};

export default function Issue({ issue }: Props) {
  const utils = t.useUtils();
  const navigation = useRouter();

  deleteFromStoreCompletionEvent$.on(() => utils.library.invalidate());

  return (
    <Flex
      className="w-[200px] h-[300px] mb-14 cursor-pointer"
      gap="1"
      direction="column"
      onClick={() =>
        navigation.navigate({
          to: "/$issueId",
          params: {
            issueId: issue.id,
          },
        })
      }
    >
      <img
        className="w-full h-full bg-zinc-200/5 rounded-md border-1 border-solid border-zinc-300 dark:border-zinc-800"
        alt="issue_thumbnail"
        src={issue.thumbnailUrl}
      />
      <Flex align="end" justify="between">
        <Text size="1" className="text-gray-600 dark:text-zinc-400">
          {issue.issueTitle}
        </Text>
        <MoreButton issueId={issue.id} />
      </Flex>
    </Flex>
  );
}

const MoreButton = memo(({ issueId }: { issueId: string }) => {
  const utils = t.useUtils();
  const navigation = useRouter();
  const { mutate: deleteIssue } = t.issue.deleteIssue.useMutation({
    onSuccess: () => utils.library.invalidate(),
  });

  const unlink = () =>
    deleteIssue({
      issueId,
    });

  const go = () =>
    navigation.navigate({
      to: "/edit/$id",
      params: {
        id: issueId,
      },
    });

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <button className="cursor-pointer">
          <MoreVertical size={10} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content variant="soft" size="1">
        <DropdownMenu.Item onClick={go} className="cursor-pointer">
          <Flex align="center" justify="start" gap="1">
            <Edit2 size={9} />
            <Text>Edit Issue Info</Text>
          </Flex>
        </DropdownMenu.Item>
        <DropdownMenu.Item
          onClick={unlink}
          color="ruby"
          className="cursor-pointer"
        >
          <Flex align="center" justify="start" gap="1">
            <Link2Off size={10} />
            <Text>Unlink Issue</Text>
          </Flex>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
});
