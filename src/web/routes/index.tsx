import { Flex, Heading, Text } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import CurrentlyReading from "../components/currently-reading";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <Flex className="w-full h-screen">index</Flex>;
}
