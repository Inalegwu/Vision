import { Flex, Text } from "@radix-ui/themes";
import t from "@shared/config";
import { createFileRoute } from "@tanstack/react-router";
import React, { Suspense, useRef } from "react";
import { LoadingSkeleton, Spinner } from "../../components";

const Issue = React.lazy(() => import("../../components/issue"));

export const Route = createFileRoute("/collection/$collectionId")({
  component: React.memo(Component),
});

function Component() {
  const parentView = useRef<HTMLDivElement>(null);
  const { collectionId } = Route.useParams();

  const { data, isLoading } = t.library.getCollectionById.useQuery({
    collectionId,
  });

  if (isLoading) {
    return (
      <Flex className="w-full h-screen" align="center" justify="center">
        <Spinner size={35} className="border-2 border-moonlightOrange" />
      </Flex>
    );
  }

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
