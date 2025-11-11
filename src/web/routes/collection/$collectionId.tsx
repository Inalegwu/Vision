import {
  Button,
  Checkbox,
  Dialog,
  Flex,
  Heading,
  Text,
} from "@radix-ui/themes";
import t from "@/shared/config";
import { toast } from "@/web/components/toast";
import { createFileRoute } from "@tanstack/react-router";
import React, { Suspense, useState } from "react";
import { FlatList, LoadingSkeleton, Spinner } from "../../components";
import { AddCircle } from "@solar-icons/react";

const Issue = React.lazy(() => import("../../components/issue"));

export const Route = createFileRoute("/collection/$collectionId")({
  component: React.memo(Component),
});

function Component() {
  const utils = t.useUtils();
  const { collectionId } = Route.useParams();

  const { data } = t.library.getCollectionById.useQuery({
    collectionId,
  });

  const { data: issues } = t.library.getLibrary.useQuery();

  const { mutate, isLoading: adding } =
    t.library.addToCollectionInBulk.useMutation({
      onSuccess: (data) => {
        console.log(data);
        utils.invalidate();
      },
      onError: (error) => toast.error(error.message),
    });

  const [toAdd, setToAdd] = useState<Array<string>>([]);

  return (
    <Flex className="h-screen pt-8 w-full" direction="column">
      <Flex className="w-full px-3 py-6" align="center" justify="between">
        <Text size="8" weight="bold">
          {data?.collection?.collectionName}
        </Text>
        <Dialog.Root>
          <Dialog.Trigger>
            <button className="p-2 rounded-md cursor-pointer dark:text-moonlightSlight hover:bg-neutral-400/10 dark:hover:bg-neutral-400/5">
              <AddCircle size={13} />
            </button>
          </Dialog.Trigger>
          <Dialog.Content
            aria-describedby="issues list"
            size="2"
            className="dark:bg-moonlightBase max-h-120"
          >
            <Dialog.Title />
            <FlatList
              listHeaderComponent={() => (
                <Flex align="center" justify="between">
                  <Heading size="5">All Issues</Heading>
                  <Button
                    onClick={() =>
                      mutate({
                        collectionId,
                        issues: toAdd,
                      })
                    }
                    variant="soft"
                    size="1"
                  >
                    {adding ? (
                      <Spinner size={9} />
                    ) : (
                      <Text size="1">Add To This Collection</Text>
                    )}
                  </Button>
                </Flex>
              )}
              data={issues?.issues || []}
              renderItem={({ item }) => (
                <Flex
                  className="py-3"
                  align="center"
                  justify="between"
                  width="100%"
                  key={item.id}
                >
                  <Text
                    weight="medium"
                    size="1"
                    className="text-moonlightOrange"
                  >
                    {item.issueTitle}
                  </Text>
                  <Checkbox
                    onCheckedChange={(checked) =>
                      checked
                        ? setToAdd((added) => [...added, item.id])
                        : setToAdd((added) => [
                            ...added.filter((id) => id !== item.id),
                          ])
                    }
                    size="1"
                    variant="soft"
                  />
                </Flex>
              )}
            />
          </Dialog.Content>
        </Dialog.Root>
      </Flex>
      <Flex wrap="wrap" gap="2" className="px-3 pb-20 overflow-y-scroll">
        <Suspense fallback={<LoadingSkeleton />}>
          {data?.issues?.map((issue) => (
            <Issue key={issue.id} issue={issue} />
          ))}
        </Suspense>
      </Flex>
    </Flex>
  );
}
