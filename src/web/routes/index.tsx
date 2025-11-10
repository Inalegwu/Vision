import { Icon, LoadingSkeleton, Spinner } from "@/web/components";
import { Switch, useObservable } from "@legendapp/state/react";
import {
  Button,
  Flex,
  Popover,
  Text,
  TextField,
  Tooltip,
  Tabs,
} from "@radix-ui/themes";
import t from "@/shared/config";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import React, { memo, Suspense } from "react";
import { toast } from "@/web/components/toast";
import { useTimeout } from "../hooks";
import { globalState$ } from "../state";
import { Library, AddCircle, Book2, AddSquare } from "@solar-icons/react";

const Collection = React.lazy(() => import("../components/collection"));
const Issue = React.lazy(() => import("../components/issue"));

export const Route = createFileRoute("/")({
  component: memo(Component),
});

function Component() {
  const isEnabled = useObservable(false);

  const view = globalState$.libraryView.get();

  const { data } = t.library.getLibrary.useQuery(undefined, {
    enabled: isEnabled.get(),
    onError: (error) => toast.error(error.message),
  });

  useTimeout(() => isEnabled.set(true), 500);

  return (
    <Tabs.Root className="w-full h-screen" defaultValue="collections">
      <Flex
        width="100%"
        align="center"
        direction="column"
        justify="between"
        className="pt-9"
      >
        <Flex width="100%" align="center" justify="between">
          <Tabs.List className="w-full" size="2">
            <Tabs.Trigger className="cursor-pointer" value="collections">
              <Flex align="center" justify="center" gap="2">
                <Library size={15} />
                <Text size="2" weight="medium">
                  Collections
                </Text>
                <Text size="1" color="gray">
                  {data?.collections.length || 0}
                </Text>
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger className="cursor-pointer" value="issues">
              <Flex align="center" justify="center" gap="2">
                <Book2 size={15} />
                <Text weight="medium">Issues</Text>
                <Text size="1" color="gray">
                  {data?.issues.length || 0}
                </Text>
              </Flex>
            </Tabs.Trigger>
            <Flex align="center" justify="end" gap="2" p="1">
              <CreateCollection />
            </Flex>
          </Tabs.List>
        </Flex>
        <Tabs.Content className="w-full h-[90vh]" value="collections">
          <RenderCollections collections={data?.collections || []} />
        </Tabs.Content>
        <Tabs.Content className="w-full h-[90vh]" value="issues">
          <RenderIssues issues={data?.issues || []} />
        </Tabs.Content>
      </Flex>
    </Tabs.Root>
  );
}

const RenderIssues = memo(({ issues }: { issues: Issue[] }) => {
  if (issues.length === 0) {
    // return (
    //   <Flex
    //     direction="column"
    //     className="w-full h-full"
    //     align="center"
    //     justify="center"
    //   >
    //     <Heading className="text-moonlightOrange" size="8">
    //       No Issues
    //     </Heading>
    //     <Text size="3" className="text-moonlightSlight">
    //       Add some issues to see them in your library
    //     </Text>
    //   </Flex>
    // );
    return null;
  }

  return (
    <Flex width="100%" wrap="wrap" gap="2">
      <Suspense fallback={<LoadingSkeleton />}>
        {issues.map((issue) => (
          <Issue issue={issue} key={issue.id} />
        ))}
      </Suspense>
    </Flex>
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
    if (collections.length === 0) {
      // return (
      //   <Flex
      //     direction="column"
      //     className="w-full h-full"
      //     align="center"
      //     justify="center"
      //   >
      //     <Heading className="text-moonlightOrange" size="8">
      //       No Collections
      //     </Heading>
      //     <Text size="3" className="text-moonlightSlight">
      //       Create some collections to organize your library
      //     </Text>
      //   </Flex>
      // );
      return null;
    }

    return (
      <Flex width="100%" gap="5" wrap="wrap">
        <Suspense fallback={<LoadingSkeleton />}>
          {collections.map((collection) => (
            <Collection key={collection.id} collection={collection} />
          ))}
        </Suspense>
      </Flex>
    );
  },
);

const CreateCollection = React.memo(() => {
  const utils = t.useUtils();
  const { mutate: createCollection, isLoading } =
    t.library.createCollection.useMutation({
      onSuccess: (data) => utils.library.invalidate(),
      onError: (error) => toast.error(error.message),
    });

  const collectionName = useObservable("");

  const create = () =>
    createCollection({
      collectionName: collectionName.get(),
    });

  return (
    <Popover.Root>
      <Popover.Trigger>
        <button
          disabled={isLoading}
          className="p-2 rounded-md cursor-pointer text-moonlightOrange hover:bg-moonlightOrange/10"
        >
          <Tooltip content="Create a new collection">
            {isLoading ? <Spinner /> : <Icon name="Plus" size={10} />}
          </Tooltip>
        </button>
      </Popover.Trigger>
      <Popover.Content className="transition bg-white dark:bg-moonlightBase relative">
        <Flex direction="column" gap="2" align="start">
          <Flex align="center" justify="start">
            <Text size="1" weight="bold">
              Give your collection a name
            </Text>
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
                <AddSquare size={16} />
                <Text weight="medium">Create Collection</Text>
              </Flex>
            </Button>
          </Popover.Close>
        </Flex>
      </Popover.Content>
    </Popover.Root>
  );
});
