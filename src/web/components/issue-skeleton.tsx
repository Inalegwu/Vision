import { Flex } from "@radix-ui/themes";
import { memo } from "react";
import Skeleton from "./skeleton";

const IssueSkeleton = memo(() => {
  return (
    <Flex
      direction="column"
      gap="2"
      className="w-[200px] h-[300px] my-1 mx-[0.3em]"
    >
      <Skeleton className="w-full h-full bg-zinc-500/10 rounded-md" />
      <Flex direction="column" gap="1">
        <Skeleton className="p-1 rounded-md bg-zinc-500/10" />
        <Skeleton className="p-1 rounded-md bg-zinc-500/10 w-4/6" />
      </Flex>
    </Flex>
  );
});

export default IssueSkeleton;
