import { Flex, Heading } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import { CurrentlyReading, DoneReading } from "../components";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <Flex direction="column" className="h-screen w-full">
      <Flex
        direction="column"
        align="start"
        justify="center"
        className="w-full h-3.5/6 px-2 py-2 space-y-2"
      >
        <Heading size="7">Currently Reading</Heading>
        <Flex grow="1" className="py-2">
          <CurrentlyReading
            issue={{
              id: "2",
              issueTitle: "Kill All Immortals",
              collectionId: null,
            }}
          />
        </Flex>
      </Flex>
      <Flex direction="column" className="w-full h-2.5/6 px-2 py-2 space-y-2">
        <Heading size="6">Done Reading</Heading>
        <Flex grow="1" className="py-2">
          <DoneReading
            issue={{
              issueTitle: "Kill All Immortals",
              id: "2",
              collectionId: null,
            }}
          />
        </Flex>
      </Flex>
    </Flex>
  );
}
