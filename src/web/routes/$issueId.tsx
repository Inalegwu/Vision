import { Flex } from "@radix-ui/themes";
import { createFileRoute, useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/$issueId")({
  component: Component,
});

function Component() {
  const { issueId } = Route.useParams();

  const navigation = useRouter();

  return (
    <Flex className="w-full h-screen" justify="center">
      {issueId}
      <Flex
        align="center"
        justify="start"
        gap="2"
        className="absolute z-20 w-5/6 bottom-10 bg-transparent border-1 border-solid border-zinc-200 dark:border-zinc-800 rounded-lg p-2"
      >
        <div className="bg-zinc-400 border-1 border-solid border-zinc-800 rounded-md w-[80px] cursor-pointer h-[90px]" />
        <div className="bg-zinc-400 border-1 border-solid border-zinc-800 rounded-md w-[80px] cursor-pointer h-[90px]" />
        <div className="bg-zinc-400 border-1 border-solid border-zinc-800 rounded-md w-[80px] cursor-pointer h-[90px]" />
        <div className="bg-zinc-400 border-1 border-solid border-zinc-800 rounded-md w-[80px] cursor-pointer h-[90px]" />
      </Flex>
    </Flex>
  );
}
