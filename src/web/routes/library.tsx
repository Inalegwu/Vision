import { Flex, Heading } from "@radix-ui/themes";
import t from "@src/shared/config";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { globalState$ } from "../state";

export const Route = createFileRoute("/library")({
  component: Component,
});

function Component() {
  const { mutate: createSourceDir } =
    t.library.createLibraryFolder.useMutation();

  useEffect(() => {
    if (globalState$.firstLaunch.get()) {
      createSourceDir();
    }
  }, [createSourceDir]);

  return (
    <Flex direction="column" className="w-full h-screen px-2 py-2">
      <Flex align="center" justify="between" className="w-full">
        <Heading size="8">Library</Heading>
      </Flex>
      <Flex grow="1" className="py-5"></Flex>
    </Flex>
  );
}
