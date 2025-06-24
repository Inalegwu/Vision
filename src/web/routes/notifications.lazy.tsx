import { Flex } from "@radix-ui/themes";
import { createLazyFileRoute } from "@tanstack/react-router";
import { memo } from "react";

export const Route = createLazyFileRoute("/notifications")({
  component: memo(Component),
});

function Component() {
  return (
    <Flex width="100%" className="h-screen">
      notifications
    </Flex>
  );
}
