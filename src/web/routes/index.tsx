import { Flex, Heading, Text } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import { DoneReading } from "../components";
import CurrentlyReading from "../components/currently-reading";
import { readingState$ } from "../state";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const currentlyReading = Array.from(readingState$.currentlyReading.values());
  const doneReading = Array.from(readingState$.doneReading.values());

  if (currentlyReading.length === 0 && doneReading.length === 0) {
    return (
      <Flex
        direction="column"
        className="w-full h-screen"
        align="center"
        justify="center"
        gap="1"
      >
        <Heading size="8">Nothing to see yet</Heading>
        <Text size="3" color="gray">
          start reading to track your progress
        </Text>
      </Flex>
    );
  }

  return (
    <Flex
      direction="column"
      className="h-screen w-full overflow-y-scroll pb-40"
    >
      <Flex
        direction="column"
        align="start"
        justify="center"
        className="w-full px-2 py-2 space-y-1 pt-12"
      >
        <Heading size="7">Currently Reading</Heading>
        <Flex grow="1" className="py-2 overflow-x-scroll pr-14" gap="3">
          {currentlyReading.map((v) => (
            <CurrentlyReading key={v.id} issue={v} />
          ))}
        </Flex>
      </Flex>
      <Flex direction="column" className="w-full h-2/6 px-2 py-2 space-y-2">
        <Heading size="6">Done Reading</Heading>
        <Flex grow="1" className="py-2" wrap="wrap" gap="4">
          {doneReading.map((v) => (
            <DoneReading key={v.id} issue={v} />
          ))}
        </Flex>
      </Flex>
    </Flex>
  );
}
