import { useObservable } from "@legendapp/state/react";
import {
  Flex,
  Heading,
  Text,
} from "@radix-ui/themes";
import t from "@shared/config";
import { createFileRoute } from "@tanstack/react-router";
import { AddFilled } from "@fluentui/react-icons";
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

  const { data, isLoading: fetchingLibrary } = t.library.getLibrary.useQuery(undefined, {
    enabled: isEnabled.get(),
  });

  const { mutate: addIssue, isLoading: addingIssue } = t.issue.addIssue.useMutation();

  useTimeout(() => {
    isEnabled.set(true);
  }, 3_000);

  useEffect(() => {
    if (globalState$.firstLaunch.get()) {
      createSourceDir();
      globalState$.firstLaunch.set(false);
    }
  }, [createSourceDir]);

  if (fetchingLibrary) {
    return <Flex className="w-full h-screen" align="center" justify="center">
      <Spinner size={30} />
    </Flex>
  }


  if (data?.issues.length === 0) {
    return <Flex direction="column" gap="3" align="center" justify="center" className="w-full h-screen">
      <Heading size="9">Soooo Empty</Heading>
      <Text className="text-zinc-400">Add an Issue to Your Library... Please</Text>
      <button onClick={() => addIssue()} className="px-2 mt-6 py-3 w-2/6 bg-zinc-200/3 text-zinc-400 flex items-center justify-center space-x-3 rounded-md">
        {addingIssue ? (
          <Spinner size={16} />) : 
          <AddFilled fontSize={16} />
        }
        <Text>Add Issue</Text>
      </button>
    </Flex>
  }

  return (
    <Flex direction="column" className="w-full h-screen">
      <Flex direction="column" align="start" gap="2" justify="between" className="w-full px-2 py-3">
        <Heading size="9">My Comics</Heading>
      </Flex>
      <Flex
        grow="1"
        className="py-5 overflow-y-scroll pb-24"
        gap="4"
        wrap="wrap"
      >

      </Flex>
    </Flex>
  );
}



