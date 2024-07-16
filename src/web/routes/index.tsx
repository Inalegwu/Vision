import { Flex, Heading, Text } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import { readingState$ } from "../state";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  if (
    readingState$.currentlyReading.get() === null &&
    readingState$.doneReading.get() === null
  ) {
    return (
      <Flex
        direction="column"
        className="w-full h-screen"
        align="center"
        justify="center"
        gap="1"
      >
        <Heading size="8">Nothing to see yet</Heading>
        <Text size="4" color="gray">
          start reading to track your progress
        </Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" className="h-screen w-full">
      <Flex
        direction="column"
        align="start"
        justify="center"
        className="w-full h-3.5/6 px-2 py-3 space-y-1"
      >
        <Heading size="7">Currently Reading</Heading>
        <Flex grow="1" className="py-2"></Flex>
      </Flex>
      <Flex direction="column" className="w-full h-2.5/6 px-2 py-2 space-y-2">
        <Heading size="6">Done Reading</Heading>
        <Flex grow="1" className="py-2"></Flex>
      </Flex>
    </Flex>
  );
}
