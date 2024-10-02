import { useObservable } from "@legendapp/state/react";
import { Flex, Heading, Text } from "@radix-ui/themes";
import t from "@shared/config";
import { createFileRoute } from "@tanstack/react-router";
import { memo, useEffect } from "react";
import { useTimeout } from "../hooks";
import { globalState$ } from "../state";
import { Spinner } from "../components";

export const Route = createFileRoute("/library")({
  component: memo(Component),
});

function Component() {
  const { mutate: createSourceDir } =
    t.library.createLibraryFolder.useMutation();

  const isEnabled = useObservable(false);

  useTimeout(() => {
    isEnabled.set(true);
  }, 3_000);

  useEffect(() => {
    if (globalState$.firstLaunch.get()) {
      createSourceDir();
      globalState$.firstLaunch.set(false);
    }
  }, [createSourceDir]);

  return <Flex>library</Flex>;
}
