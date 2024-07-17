import { Flex, Heading } from "@radix-ui/themes";
import type { IssueType } from "@shared/types";
import t from "@src/shared/config";
import { deleteFromStoreCompletionEvent$ } from "@src/shared/events";
import { createFileRoute } from "@tanstack/react-router";
import { memo, useEffect } from "react";
import { Issue } from "../components";
import { globalState$ } from "../state";

export const Route = createFileRoute("/library")({
  component: memo(Component),
});

function Component() {
  const utils = t.useUtils();
  const { mutate: createSourceDir } =
    t.library.createLibraryFolder.useMutation();

  const { data, isLoading } = t.library.getLibrary.useQuery();

  deleteFromStoreCompletionEvent$.on(() => utils.library.invalidate());

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
      <Flex grow="1" className="py-5 overflow-y-scroll" gap="2" wrap="wrap">
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
