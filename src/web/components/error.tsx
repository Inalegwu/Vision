import { Code, Flex, Heading, Text } from "@radix-ui/themes";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { globalState$ } from "../state";

export default function ErrorComponent(props: ErrorComponentProps) {
  useEffect(() => {
    // TODO: aptabase for error reporting
    console.error({ error: props.error, instanceId: globalState$.appId.get() });
  }, [props]);

  return (
    <Flex
      direction="column"
      align="start"
      justify="center"
      gap="3"
      className="w-full h-screen px-10 py-10"
    >
      <Heading size="6">{props.error.message}</Heading>
      <Code size="2">{props.error.stack}</Code>
      <button
        onClick={() => props.reset()}
        className="p-3 space-x-3 rounded-md cursor-pointer text-moonlightOrange hover:bg-moonlightOrange/10"
      >
        <Text>Reload</Text>
        <RefreshCw size={15} />
      </button>
    </Flex>
  );
}
