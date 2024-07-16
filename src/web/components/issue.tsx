import { ContextMenu, Flex, Text } from "@radix-ui/themes";
import t from "@src/shared/config";
import type { Issue as issue } from "@src/shared/types";
import { useRouter } from "@tanstack/react-router";
import { Edit, Trash2 } from "lucide-react";

type Props = {
  issue: issue;
};

export default function Issue({ issue }: Props) {
  const utils = t.useUtils();
  const navigation = useRouter();
  const { mutate: deleteIssue } = t.issue.deleteIssue.useMutation({
    onSuccess: () => {
      utils.library.getLibrary.invalidate();
    },
  });

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <Flex
          className="w-[200px] h-[300px] cursor-pointer"
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
          {/* TODO make image */}
          <img
            className="w-full h-full bg-zinc-200/5 rounded-md border-1 border-solid border-zinc-300 dark:border-zinc-800"
            alt="issue_thumbnail"
            src={issue.thumbnailUrl}
          />
          <Flex direction="column" align="start">
            <Text size="1" className="text-gray-600 dark:text-zinc-400">
              {issue.issueTitle}
            </Text>
          </Flex>
        </Flex>
      </ContextMenu.Trigger>
      <ContextMenu.Content size="1" variant="soft">
        <ContextMenu.Item className="cursor-pointer">
          <Flex align="center" justify="start" gap="2">
            <Edit size={10} />
            <Text>Edit Issue</Text>
          </Flex>
        </ContextMenu.Item>
        <ContextMenu.Item
          onClick={() => deleteIssue({ issueId: issue.id })}
          color="ruby"
          className="cursor-pointer"
        >
          <Flex align="center" justify="start" gap="2">
            <Trash2 size={10} />
            <Text>Delete Issue</Text>
          </Flex>
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
}
