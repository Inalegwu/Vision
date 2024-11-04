import { Flex } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import t from "@shared/config";

export const Route = createFileRoute("/collection/$collectionId")({
  component: Component,
});

function Component() {
  const { collectionId } = Route.useParams();

  return (
    <Flex className="h-screen px-2 py-2" direction="column">
      <Flex className="w-full bg-red-100">content</Flex>
      {collectionId}
    </Flex>
  );
}
