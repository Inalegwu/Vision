import { Flex, Text } from "@radix-ui/themes";
import t from "@shared/config";
import { createFileRoute } from "@tanstack/react-router";
import React, { Suspense } from "react";
import { LoadingSkeleton } from "../../components";

const Issue = React.lazy(() => import("../../components/issue"));

export const Route = createFileRoute("/collection/$collectionId")({
  component: React.memo(Component),
});

function Component() {
  const { collectionId } = Route.useParams();

  const { data } = t.library.getCollectionById.useQuery({
    collectionId,
  });

  return (
    <Flex className="h-screen pt-8 w-full" direction="column">
      <Flex className="w-full px-3 py-3" align="center" justify="between">
        <Text size="8" weight="bold">
          {data?.collection?.collectionName}
        </Text>
      </Flex>
      <Flex wrap="wrap" gap="2" className="px-3 pb-20 overflow-y-scroll">
        <Suspense fallback={<LoadingSkeleton />}>
          {data?.collection?.issues.map((issue) => (
            <Issue key={issue.id} issue={issue} />
          ))}
        </Suspense>
      </Flex>
    </Flex>
  );
}
