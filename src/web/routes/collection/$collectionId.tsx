import { Flex, Text } from "@radix-ui/themes";
import t from "@shared/config";
import { createFileRoute } from "@tanstack/react-router";
import React, { Suspense } from "react";
import { Spinner } from "../../components";

const Issue = React.lazy(() => import("../../components/issue"));

export const Route = createFileRoute("/collection/$collectionId")({
  component: Component,
});

function Component() {
  const { collectionId } = Route.useParams();

  const { data, isLoading } = t.collection.getCollectionById.useQuery({
    collectionId,
  });

  return (
    <Flex className="h-screen pt-8 w-full" direction="column">
      <Flex className="w-full px-3 py-3" align="center" justify="between">
        <Text size="8" weight="bold">
          {data?.collection?.collectionName}
        </Text>
      </Flex>
      <Suspense
        fallback={
          <Flex
            grow="1"
            className="w-full h-screen"
            align="center"
            justify="center"
          >
            <Spinner size={30} className="border-moonlightOrange border-2" />
          </Flex>
        }
      >
        <Flex
          gap="3"
          wrap="wrap"
          align="center"
          className="px-3 overflow-y-scroll pb-24"
        >
          {data?.collection?.issues.map((issue) => (
            <Issue key={issue.id} issue={issue} />
          ))}
        </Flex>
      </Suspense>
    </Flex>
  );
}
