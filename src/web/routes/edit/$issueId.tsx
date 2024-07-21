import { Flex } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/edit/$issueId")({
  component: Component,
});

function Component() {
  const { issueId } = Route.useParams();

  return <Flex className="w-full h-screen">{issueId}</Flex>;
}
