import { Collection, Issue, IssueSkeleton, Spinner } from "@components";
import { useObservable } from "@legendapp/state/react";
import {
  Button,
  Flex,
  Heading,
  Popover,
  Text,
  TextField,
} from "@radix-ui/themes";
import t from "@shared/config";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { memo } from "react";
import { useTimeout } from "../hooks";

export const Route = createFileRoute("/library")({
  component: memo(Component),
});

function Component() {
  const isEnabled = useObservable(false);

  const { data, isLoading } = t.library.getLibrary.useQuery(undefined, {
    enabled: isEnabled.get(),
  });

  useTimeout(() => {
    isEnabled.set(true);
  }, 3_000);

  return (
    <Flex direction="column" className="w-full h-screen">
      <Flex align="center" justify="between" className="w-full px-3 py-3">
        <Heading size="8">Library</Heading>
        <Flex align="center" justify="end" gap="3">
          <CreateCollection />
          {data && (
            <>
              <Text size="2" className="text-zinc-400">
                {data.issues.length || 0} Issue(s)
              </Text>
              <Text size="2" className="text-zinc-400">
                {data.collections.length || 0} Collection(s)
              </Text>
            </>
          )}
        </Flex>
      </Flex>
      <Flex
        grow="1"
        align="center"
        className="pt-5 px-3 overflow-y-scroll pb-20"
        gap="4"
        wrap="wrap"
      >
        {isLoading &&
          Array(15)
            .fill(0)
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            .map((_, index) => <IssueSkeleton key={index} />)}
        <RenderCollections collections={data?.collections || []} />
        <RenderIssues issues={data?.issues || []} />
      </Flex>
    </Flex>
  );
}

const RenderIssues = memo(({ issues }: { issues: Issue[] }) => {
  return (
    <>
      {issues?.map((issue) => (
        <Issue key={issue.id} issue={issue} />
      ))}
    </>
  );
});

const RenderCollections = memo(
  ({
    collections,
  }: {
    collections: Array<
      Collection & {
        issues: Issue[];
      }
    >;
  }) => {
    return (
      <>
        {collections?.map((collection) => (
          <Collection key={collection.id} collection={collection} />
        ))}
      </>
    );
  },
);

function CreateCollection() {
  const utils = t.useUtils();
  const { mutate: createCollection, isLoading } =
    t.library.createCollection.useMutation({
      onSuccess: () => {
        utils.library.getLibrary.invalidate();
        utils.collection.getCollections.invalidate();
      },
    });

  const collectionName = useObservable("");

  const create = () =>
    createCollection({
      collectionName: collectionName.get(),
    });

  return (
    <Popover.Root>
      <Popover.Trigger>
        <button className="cursor-pointer dark:text-zinc-400 hover:bg-zinc-400/8 px-2 py-1 rounded-full">
          {isLoading ? <Spinner /> : <Plus size={10} />}
        </button>
      </Popover.Trigger>
      <Popover.Content>
        <Flex direction="column" gap="2" align="start">
          <Flex align="center" justify="start">
            <Text size="1">Give your collection a name</Text>
          </Flex>
          <TextField.Root>
            <TextField.Input
              onChange={(e) => collectionName.set(e.target.value)}
              size="2"
            />
          </TextField.Root>
          <Popover.Close>
            <Button
              onClick={create}
              className="cursor-pointer"
              variant="soft"
              size="1"
            >
              <Flex align="center" justify="center" gap="2">
                <Plus size={10} />
                <Text>Create Collection</Text>
              </Flex>
            </Button>
          </Popover.Close>
        </Flex>
      </Popover.Content>
    </Popover.Root>
  );
}
