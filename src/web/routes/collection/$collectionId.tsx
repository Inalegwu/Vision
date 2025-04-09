import { Flex, Text } from "@radix-ui/themes";
import t from "@shared/config";
import { sortPages } from "@shared/utils";
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
    <Flex gap="4" className="h-screen px-2 py-2" direction="column">
      <Flex className="w-full" align="center" justify="between">
        <Text size="8" weight="bold">
          {data?.collection?.collectionName}
        </Text>
        {isLoading && <Spinner size={15} />}
      </Flex>
      <Flex gap="3">
        {data?.collection?.issues
          .sort((a, b) => sortPages(a.issueTitle, b.issueTitle))
          .map((issue) => (
            <Issue key={issue.id} issue={issue} />
          ))}
      </Flex>
    </Flex>
  );
}
