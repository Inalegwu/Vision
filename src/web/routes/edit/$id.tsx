import { Spinner } from "@components";
import { Show, useObservable } from "@legendapp/state/react";
import { Flex, Text, TextField } from "@radix-ui/themes";
import t from "@shared/config";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Pencil } from "lucide-react";
import { useCallback } from "react";

export const Route = createFileRoute("/edit/$id")({
  component: Component,
});

function Component() {
  const { id } = Route.useParams();

  const utils = t.useUtils();
  const isEditing = useObservable(false);

  const name = useObservable<string>("");
  const nameVal = name.get();

  const { data, isLoading } = t.issue.getIssue.useQuery(
    {
      issueId: id,
    },
    {
      onSuccess: (d) => name.set(d.issue?.issueTitle),
    },
  );

  const { mutate, isLoading: saving } = t.issue.editIssueTitle.useMutation({
    onSuccess: (data) => {
      console.log({ data });
      utils.library.invalidate();
      isEditing.set(false);
      name.set(data.result.at(0)?.issueTitle);
    },
  });

  const saveEdit = useCallback(() => {
    if (name.get() === null) return;

    mutate({
      issueId: id,
      issueTitle: nameVal,
    });
  }, [id, name, mutate, nameVal]);

  return (
    <Flex className="w-full h-screen pt-8" align="center">
      <Flex
        direction="column"
        className="w-4/6 h-full px-3"
        align="center"
        justify="center"
      >
        {isLoading && <Spinner size={40} />}
        <Flex width="100%" align="start" direction="column" gap="3">
          <Flex grow="1" width="100%" align="center" justify="start" gap="4">
            {isEditing.get() ? (
              <TextField.Root className="w-3/6">
                <TextField.Input
                  value={nameVal}
                  onChange={(e) => name.set(e.currentTarget.value)}
                  variant="soft"
                  size="2"
                />
              </TextField.Root>
            ) : (
              <Text weight="medium" size="6" className="text-moonlightOrange">
                {data?.issue?.issueTitle}
              </Text>
            )}
            <Flex gap="1">
              <button
                onClick={() => isEditing.set(!isEditing.get())}
                className="p-2 rounded-md cursor-pointer dark:text-moonlightSlight hover:bg-neutral-400/10 dark:hover:bg-neutral-400/5"
              >
                <Pencil size={15} />
              </button>
              <Show if={isEditing}>
                <button
                  onClick={saveEdit}
                  className="p-2 rounded-md cursor-pointer hover:bg-moonlightOrange/10 text-moonlightOrange"
                >
                  {saving ? <Spinner size={15} /> : <Check size={15} />}
                </button>
              </Show>
            </Flex>
          </Flex>
          <Flex gap="2" direction="column" align="start" width="100%">
            {data?.metadata?.Series && (
              <Text size="4">Series: {data?.metadata.Series}</Text>
            )}
            {data?.metadata?.Issue && (
              <Text size="3">Number: {data?.metadata.Issue}</Text>
            )}
            <Text size="3" weight="medium" className="dark:text-moonlightText">
              {data?.metadata?.Summary}
            </Text>
            {data?.metadata?.PageCount && (
              <Text size="3" className="dark:text-moonlightText">
                <span className="text-moonlightOrange" weight="medium">
                  Page Count:
                </span>
                {"  "}
                {data?.metadata?.PageCount}
              </Text>
            )}
            {data?.metadata?.writer && (
              <Text size="3">Written By: {data?.metadata.writer}</Text>
            )}
            <Text size="2" color="gray" className="mt-2">
              {data?.metadata?.Notes}
            </Text>
          </Flex>
        </Flex>
      </Flex>
      <Flex direction="column" justify="center" align="center">
        <Flex className="w-[400px] h-[600px] cursor-pointer overflow-hidden rounded-md border-1 border-solid border-zinc-200 dark:border-zinc-800 shadow-md">
          <img
            src={data?.issue?.thumbnailUrl}
            alt={data?.issue?.issueTitle}
            className="w-full h-full "
          />
        </Flex>
      </Flex>
    </Flex>
  );
}
