import { Flex, Heading } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const mock = [
    {
      id: 1,
    },
    {
      id: 2,
    },
    {
      id: 3,
    },
    {
      id: 4,
    },
    {
      id: 5,
    },
    {
      id: 6,
    },
    {
      id: 7,
    },
    {
      id: 8,
    },
  ];

  return (
    <Flex direction="column" className="h-screen w-full">
      <Flex
        direction="column"
        align="start"
        justify="center"
        className="w-full h-3.5/6 px-2 py-2 space-y-2"
      >
        <Heading size="7">Currently Reading</Heading>
        <Flex grow="1" />
      </Flex>
      <Flex className="w-full h-2.5/6 px-2 py-2 space-y-2">
        <Heading size="6">Done Reading</Heading>
        <Flex grow="1" />
      </Flex>
    </Flex>
  );
}