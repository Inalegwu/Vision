import { Flex, Text } from "@radix-ui/themes";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import t from "@shared/config";
import { Spinner, Issue } from "../../components";

export const Route = createFileRoute("/collection/$collectionId")({
  component: Component,
});

function Component() {
  const navigation = useRouter();
  const { collectionId } = Route.useParams();

  const { data, isLoading } = t.collection.getCollectionById.useQuery({
    collectionId,
  });

  if (!data) {
    navigation.history.back();
  }

  return (
    <Flex gap="4" className="h-screen px-2 py-2" direction="column">
      <Flex className="w-full" align="center" justify="between">
        <Text size="8">{data?.collection?.collectionName}</Text>
        {isLoading && <Spinner size={15} />}
      </Flex>
      <Flex gap="3">
        {data?.collection?.issues.map((issue) => (
          <Issue key={issue.id} issue={issue} />
        ))}
      </Flex>
    </Flex>
  );
}
