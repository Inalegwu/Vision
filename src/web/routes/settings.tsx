import { Flex, Tabs,Text } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import { memo } from "react";

export const Route = createFileRoute("/settings")({
  component: memo(Component),
});

function Component() {
  return (
    <Flex direction="column" className="w-full h-screen pt-8">
      <Tabs.Root>
        <Tabs.List>
          <Tabs.Trigger value="storage">
            <Text>Storage</Text>
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="storage">
          storage</Tabs.Content>
      </Tabs.Root>
    </Flex>
  );
}
