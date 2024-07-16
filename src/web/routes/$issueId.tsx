import { Flex } from "@radix-ui/themes";
import t from "@src/shared/config";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";

export const Route = createFileRoute("/$issueId")({
  component: Component,
});

function Component() {
  const { issueId } = Route.useParams();

  const { data, isLoading } = t.issue.getPages.useQuery({
    issueId,
  });

  if (isLoading) {
    return (
      <Flex className="w-full h-screen" align="center" justify="center">
        <div className="p-2 border-1 border-solid border-zinc-400 dark:border-zinc-800 rounded-full animate-pulse" />
      </Flex>
    );
  }

  return (
    <Flex className="w-full h-screen" justify="center">
      <Flex
        align="center"
        justify="start"
        gap="2"
        className="absolute z-20 w-5/6 overflow-x-scroll bottom-10 bg-transparent backdrop-blur-lg border-1 border-solid border-zinc-200 dark:border-zinc-800 rounded-lg p-2"
      >
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
