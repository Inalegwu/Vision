import { Flex, Text } from "@radix-ui/themes";
import t from "@shared/config";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Mail } from "lucide-react";

export const Route = createLazyFileRoute("/me")({
  component: Component,
});

function Component() {
  const { mutate: launchOAuth } = t.oauth.launchOAuthWindow.useMutation();

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      className="w-full h-screen"
    >
      <Flex
        direction="column"
        align="center"
        justify="center"
        className="border-1 shadow-md bg-white w-4/6 h-4/6 rounded-md border-solid border-zinc-200 dark:border-zinc-800"
      >
        <Flex align="center" justify="between">
          <button
            onClick={() => launchOAuth({ provider: "google" })}
            className="flex items-center justify-center space-x-2 cursor-pointer px-2 py-2 rounded-md bg-red-500/20 text-red-500"
          >
            <Mail size={10} />
            <Text>Login with google</Text>
          </button>
        </Flex>
      </Flex>
    </Flex>
  );
}
