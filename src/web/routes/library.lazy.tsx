import { Flex } from "@radix-ui/themes";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/library")({
  component: Component,
});

function Component() {
  return <Flex className="w-full h-screen">library</Flex>;
}
