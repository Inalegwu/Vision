import { Button, Flex, Heading, Text } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Issue } from "../components";

export const Route = createFileRoute("/library")({
  component: Component,
});

function Component() {
  return (
    <Flex direction="column" className="w-full h-screen px-2 py-2">
      <Flex align="center" justify="between" className="w-full">
        <Heading size="8">Library</Heading>
        <Flex align="center" justify="end" gap="3">
          <Button size="1" className="cursor-pointer" variant="surface">
            <Plus size={11} />
            <Text>Add Issue To Library</Text>
          </Button>
        </Flex>
      </Flex>
      <Flex grow="1" className="py-5">
        <Issue
          issue={{
            id: "1",
            issueTitle: "Kill All Immortals",
            collectionId: null,
          }}
        />
      </Flex>
    </Flex>
  );
}