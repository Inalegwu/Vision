import { Spinner } from "@components";
import { useObservable } from "@legendapp/state/react";
import { Button, Flex, Popover, Text, TextField } from "@radix-ui/themes";
import t from "@shared/config";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import React, { memo, Suspense } from "react";
import { useTimeout } from "../hooks";

const Collection = React.lazy(() => import("../components/collection"));
const Issue = React.lazy(() => import("../components/issue"));

export const Route = createFileRoute("/library")({
  component: memo(Component),
});

function Component() {
  const isEnabled = useObservable(false);

  const { data } = t.library.getLibrary.useQuery(undefined, {
    enabled: isEnabled.get(),
  });

  useTimeout(() => {
    isEnabled.set(true);
  }, 3_000);

  return (
    <Flex direction="column" className="w-full h-screen pt-8">
      <Flex align="center" justify="between" className="w-full px-3 py-4">
        <Flex grow="1" />
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
        className="px-3 overflow-y-scroll pb-20"
        gap="4"
        wrap="wrap"
      >
        {/* @ts-ignore: all good */}
        <RenderCollections collections={data?.collections || []} />
        <RenderIssues issues={data?.issues || []} />
      </Flex>
    </Flex>
  );
}

// TODO: virtualize this list;
const RenderIssues = memo(({ issues }: { issues: Issue[] }) => {
  return (
    <Suspense
      fallback={
        <Flex
          className="w-full h-screen bg-moonlightBase"
          align="center"
          justify="center"
        >
          <Spinner className="border-2 border-moonlightOrange" size={35} />
        </Flex>
      }
    >
      {issues?.map((issue) => (
        <Issue key={issue.id} issue={issue} />
      ))}
    </Suspense>
  );
});

// TODO: virtualize
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
      <Suspense
        fallback={
          <Flex
            className="w-full h-screen bg-moonlightBase"
            align="center"
            justify="center"
          >
            <Spinner className="border-2 border-moonlightOrange" size={35} />
          </Flex>
        }
      >
        {collections?.map((collection) => (
          <Collection key={collection.id} collection={collection} />
        ))}
      </Suspense>
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
        <button className="p-2 rounded-md cursor-pointer text-moonlightOrange hover:bg-moonlightOrange/10">
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
