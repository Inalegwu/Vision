import { LoadingSkeleton } from "@/web/components";
import { useObservable } from "@legendapp/state/react";
import {
  Button,
  Flex,
  Text,
  TextField,
  Tabs,
  Dialog,
  IconButton,
  Heading,
} from "@radix-ui/themes";
import t from "@/shared/config";
import { createFileRoute } from "@tanstack/react-router";
import React, { memo, Suspense } from "react";
import { toast } from "@/web/components/toast";
import { useTimeout } from "../hooks";
import { globalState$ } from "../state";
import {
  Library,
  AddCircle,
  Book2,
  Text as TextIcon,
} from "@solar-icons/react";

const Collection = React.lazy(() => import("../components/collection"));
const Issue = React.lazy(() => import("../components/issue"));

export const Route = createFileRoute("/")({
  component: memo(Component),
});

function Component() {
  const isEnabled = useObservable(false);

  const collectionName = useObservable("");
  const utils = t.useUtils();

  const view = globalState$.libraryView.get();

  const { data } = t.library.getLibrary.useQuery(undefined, {
    enabled: isEnabled.get(),
    onError: (error) => toast.error(error.message),
  });

  const { mutate: createCollection, isPending: creating } =
    t.library.createCollection.useMutation({
      onSuccess: (data) => utils.library.invalidate(),
      onError: (error) => toast.error(error.message),
    });

  useTimeout(() => isEnabled.set(true), 500);

  console.log({ data });

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
          </Tabs.List>
        </Flex>
        <Tabs.Content className="w-full h-[90vh]" value="collections">
          <RenderCollections collections={data?.collections || []} />
        </Tabs.Content>
        <Tabs.Content className="w-full h-[90vh]" value="issues">
          <RenderIssues issues={data?.issues || []} />
        </Tabs.Content>
        <Dialog.Root>
          <Dialog.Trigger>
            <IconButton
              variant="soft"
              radius="full"
              size="4"
              className="absolute z-10 bottom-3 right-3"
            >
              <AddCircle size={24} />
            </IconButton>
          </Dialog.Trigger>
          <Dialog.Content
            aria-describedby="create collection modal"
            className="dark:bg-moonlightOverlay"
            size="1"
          >
            <Flex direction="column" gap="2">
              <Flex align="center" justify="between" width="100%">
                <Dialog.Title>
                  <Text weight="bold" size="5">
                    Create Collection
                  </Text>
                </Dialog.Title>
                {/*<Dialog.Close>
                  <CloseSquare size={24} className="text-red-500" />
                </Dialog.Close>*/}
              </Flex>
              <Flex direction="column" gap="3">
                <TextField.Root>
                  <TextField.Slot>
                    <TextIcon size={14} />
                  </TextField.Slot>
                  <TextField.Input
                    placeholder="Collection Name"
                    onChange={(e) => collectionName.set(e.target.value)}
                    variant="soft"
                    size="2"
                  />
                </TextField.Root>
                <Button
                  onClick={() =>
                    createCollection({ collectionName: collectionName.get() })
                  }
                  className="cursor-pointer"
                  variant="soft"
                  size="2"
                >
                  <Flex align="center" justify="center" gap="2">
                    <Text weight="bold">Create Collection</Text>
                  </Flex>
                </Button>
              </Flex>
            </Flex>
          </Dialog.Content>
        </Dialog.Root>
      </Flex>
    </Tabs.Root>
  );
}

const RenderIssues = memo(({ issues }: { issues: Issue[] }) => {
  if (issues.length === 0) {
    return (
      <Flex
        direction="column"
        width="100%"
        className="h-full"
        align="center"
        justify="center"
      >
        <Heading className="text-moonlightOrange" size="8">
          No Issues
        </Heading>
        <Text size="3" className="text-moonlightSlight">
          Add some issues to see them in your library
        </Text>
      </Flex>
    );
  }

  return (
    <Flex width="100%" wrap="wrap" p="4" gap="2">
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
      return (
        <Flex
          direction="column"
          className="h-full"
          width="100%"
          align="center"
          justify="center"
        >
          <Heading className="text-moonlightOrange" size="8">
            No Collections
          </Heading>
          <Text size="3" className="text-moonlightSlight">
            Create some collections to organize your library
          </Text>
        </Flex>
      );
    }

    return (
      <Flex width="100%" gap="5" p="4" wrap="wrap">
        <Suspense fallback={<LoadingSkeleton />}>
          {collections.map((collection) => (
            <Collection key={collection.id} collection={collection} />
          ))}
        </Suspense>
      </Flex>
    );
  },
);
