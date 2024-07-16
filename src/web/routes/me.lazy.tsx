import { Flex, Heading } from "@radix-ui/themes";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/me")({
  component: Component,
});

function Component() {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      className="w-full h-screen"
    >
      <Heading size="6">Me Again</Heading>
    </Flex>
  );
}
