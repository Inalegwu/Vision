import { Flex } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/edit/$id")({
  component: Component,
});

function Component() {
  const { id } = Route.useParams();

  return <Flex className="w-full h-screen">Edit Issue {id}</Flex>;
}
