import { Skeleton } from "@components";
import { useObservable } from "@legendapp/state/react";
import { Flex } from "@radix-ui/themes";
import t from "@shared/config";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useInterval } from "../hooks";

export const Route = createFileRoute("/$issueId")({
  component: Component,
});

function Component() {
  const { issueId } = Route.useParams();

  const isEnabled = useObservable(false);

  const { data, isLoading } = t.issue.getPages.useQuery(
    {
      issueId,
    },
    {
      enabled: isEnabled.get(),
    },
  );

  useInterval(() => {
    console.log("to save reading state");
  }, 10_000);

  useEffect(() => {
    const timeout = setTimeout(() => {
      isEnabled.set(true);
    }, 3_000);

    return () => clearTimeout(timeout);
  }, [isEnabled]);

  return (
    <Flex className="w-full h-screen" justify="center">
      <Flex
        align="center"
        justify="start"
        gap="2"
        className="absolute z-20 w-5/6 overflow-x-scroll bottom-10 bg-transparent backdrop-blur-lg border-1 border-solid border-zinc-200 dark:border-zinc-800 rounded-lg p-2"
      >
        {isLoading &&
          Array(10)
            .fill(0)
            .map((_, index) => (
              <Skeleton
                key={index}
                className="w-[100px] h-[95px] rounded-md border-1 border-solid border-zinc-200 dark:border-zinc-800 bg-zinc-400/10"
              />
            ))}
        {data?.pages.map((v) => {
          return (
            <img
              className="w-[100px] h-[95px] rounded-md border-1 border-solid border-zinc-200 dark:border-zinc-800 cursor-pointer"
              key={v.id}
              alt={`page_${v.id}`}
              src={v.pageContent}
            />
          );
        })}
      </Flex>
    </Flex>
  );
}
