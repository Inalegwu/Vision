import { Flex, Heading, Text } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <Flex className="w-full h-screen">index</Flex>;
}
