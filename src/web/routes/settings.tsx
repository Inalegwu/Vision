import { Flex, Tabs, Text } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import { memo } from "react";
import { Icon } from "../components";
import { globalState$ } from "../state";

export const Route = createFileRoute("/settings")({
  component: memo(Component),
});

function Component() {
  console.log(globalState$.get());

  return (
    <Flex direction="column" className="w-full h-screen pt-8">
      <Tabs.Root>
        <Tabs.List defaultValue="storage" size="2">
          <Tabs.Trigger className="cursor-pointer" value="storage">
            <Text size="2">Storage</Text>
          </Tabs.Trigger>
          <Tabs.Trigger value="reader">
            <Text size="2">Reader</Text>
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="storage">
          <Flex className="w-full h-screen px-2 py-2" direction="column">
            <Flex align="center" justify="between" width="100%">
              <Flex direction="column">
                <Text size="2">Source Directory</Text>
                <Text size="1" color="gray">
                  where should Vision check for your library
                </Text>
              </Flex>
              <button className="p-2 rounded-md cursor-pointer dark:text-moonlightSlight hover:bg-neutral-400/10 dark:hover:bg-neutral-400/5">
                <Icon name="Folder" size={12} />
                <Text size="1">{globalState$.sourceDirectory.get()}</Text>
              </button>
            </Flex>
          </Flex>
        </Tabs.Content>
        <Tabs.Content value="reader">reader</Tabs.Content>
      </Tabs.Root>
    </Flex>
  );
}
