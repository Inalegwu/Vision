import { Flex } from "@radix-ui/themes";
import { createLazyFileRoute } from "@tanstack/react-router";
import { memo, useEffect } from "react";
import { globalState$ } from "../state";

export const Route = createLazyFileRoute("/first-launch")({
  component: memo(Component),
});

function Component() {
  useEffect(() => {
    globalState$.isFullscreen.set(false);
  }, []);

  return (
    <Flex className="w-full h-screen bg-white relative">
      <Flex className="w-60 h-60 rounded-full bg-yellow-500 blur-3xl" />
      <Flex className="w-full h-full absolute z-10 bg-transparent backdrop-blur-4xl">
        body
      </Flex>
    </Flex>
  );
}
