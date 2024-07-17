import { Flex, Heading } from "@radix-ui/themes";
import t from "@src/shared/config";
import { createFileRoute } from "@tanstack/react-router";
import { memo, useEffect } from "react";
import { Issue } from "../components";
import { globalState$ } from "../state";

export const Route = createFileRoute("/library")({
  component: memo(Component),
});

function Component() {
  const { mutate: createSourceDir } =
    t.library.createLibraryFolder.useMutation();

  const { data } = t.library.getLibrary.useQuery();

  useEffect(() => {
    if (globalState$.firstLaunch.get()) {
      createSourceDir();
      globalState$.firstLaunch.set(false);
    }
  }, [createSourceDir]);

  return (
    <Flex direction="column" className="w-full h-screen px-2 py-2">
      <Flex align="center" justify="between" className="w-full">
        <Heading size="8">Library</Heading>
      </Flex>
      <Flex grow="1" className="py-5" gap="2">
        {data?.map((issue) => (
          <Issue key={issue.id} issue={issue} />
        ))}
      </Flex>
    </Flex>
  );
}
