import { Flex, Text } from "@radix-ui/themes";
import t from "@shared/config";
import { createFileRoute } from "@tanstack/react-router";
import { Issue, Spinner } from "../../components";

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
        {isLoading && <Spinner size={15} />}
      </Flex>
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
    </Flex>
  );
}
