import { Flex, Text } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$issueId")({
  component: Component,
});

function Component() {
  const { issueId } = Route.useParams();

  return (
    <Flex>
      <Text>{issueId}</Text>
    </Flex>
  );
}
