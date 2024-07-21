import { Issue, IssueSkeleton } from "@components";
import { useObservable } from "@legendapp/state/react";
import { Flex, Heading } from "@radix-ui/themes";
import t from "@shared/config";
import type { Issue as IssueType } from "@shared/types";
import { createFileRoute } from "@tanstack/react-router";
import { memo, useEffect } from "react";
import { useTimeout } from "../hooks";
import { globalState$ } from "../state";

export const Route = createFileRoute("/library")({
  component: memo(Component),
});

function Component() {
  const utils = t.useUtils();
  const { mutate: createSourceDir } =
    t.library.createLibraryFolder.useMutation();

  const isEnabled = useObservable(false);

  const { data, isLoading } = t.library.getLibrary.useQuery(undefined, {
    enabled: isEnabled.get(),
  });

  useTimeout(() => {
    isEnabled.set(true);
  }, 3_000);

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
      <Flex
        grow="1"
        className="py-5 overflow-y-scroll pb-24"
        gap="4"
        wrap="wrap"
      >
        {isLoading &&
          Array(15)
            .fill(0)
            .map((_, index) => <IssueSkeleton key={index} />)}
        <RenderIssues issues={data || []} />
      </Flex>
    </Flex>
  );
}

const RenderIssues = memo(({ issues }: { issues: IssueType[] }) => {
  return (
    <>
      {issues?.map((issue) => (
        <Issue key={issue.id} issue={issue} />
      ))}
    </>
  );
});
