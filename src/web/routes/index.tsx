import { Icon, LoadingSkeleton, Spinner } from "@components";
import { Switch, useObservable } from "@legendapp/state/react";
import {
  Button,
  Flex,
  Popover,
  Text,
  TextField,
  Tooltip,
} from "@radix-ui/themes";
import t from "@shared/config";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import React, { memo, Suspense } from "react";
import { toast } from "../components/toast";
import { useTimeout } from "../hooks";
import { globalState$ } from "../state";

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
    <Flex direction="column" className="w-full h-screen pt-8">
      <Flex align="center" justify="between" className="w-full px-3 py-4">
        <Flex grow="1" align="center" justify="start" className="relative">
          <Flex
            gap="1"
            className="bg-neutral-100 rounded-lg p-0.6 relative dark:bg-moonlightFocusMedium"
          >
            <motion.div
              animate={{
                transform:
                  view === "collections"
                    ? "translateX(0px)"
                    : "translateX(28px)",
              }}
              className="absolute z-0 w-[45%] h-[89%] rounded-lg bg-white dark:bg-moonlightFocusLow"
            />
            <Tooltip content="My Collections">
              <button
                onClick={() => globalState$.libraryView.set("collections")}
                className={`p-1.6 cursor-pointer ${
                  view === "collections"
                    ? " text-moonlightOrange"
                    : "text-neutral-600"
                }`}
              >
                <Icon name="Library" size={13} />
              </button>
            </Tooltip>
            <Tooltip content="My Issues">
              <button
                onClick={() => globalState$.libraryView.set("issues")}
                className={`p-1.6 cursor-pointer ${
                  view === "issues"
                    ? " text-moonlightOrange"
                    : "text-neutral-600"
                }`}
              >
                <Icon name="Book" size={13} />
              </button>
            </Tooltip>
          </Flex>
        </Flex>
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
      <Flex grow="1" className="px-3 overflow-y-scroll pb-20">
        <AnimatePresence>
          <Switch value={view}>
            {{
              issues: () => <RenderIssues issues={data?.issues || []} />,
              collections: () => (
                <RenderCollections collections={data?.collections || []} />
              ),
              default: () => null,
              undefined: () => null,
            }}
          </Switch>
        </AnimatePresence>
      </Flex>
    </Flex>
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
      onSuccess: () => utils.library.invalidate(),
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
        <button className="p-2 rounded-md cursor-pointer text-moonlightOrange hover:bg-moonlightOrange/10">
          <Tooltip content="Create a new collection">
            {isLoading ? <Spinner /> : <Icon name="Plus" size={10} />}
          </Tooltip>
        </button>
      </Popover.Trigger>
      <Popover.Content className="transition bg-white dark:bg-moonlightBase relative">
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
                <Icon name="Plus" size={10} />
                <Text>Create Collection</Text>
              </Flex>
            </Button>
          </Popover.Close>
        </Flex>
      </Popover.Content>
    </Popover.Root>
  );
});
