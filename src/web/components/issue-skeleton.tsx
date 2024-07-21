import { Flex } from "@radix-ui/themes";
import { memo } from "react";
import Skeleton from "./skeleton";

const IssueSkeleton = memo(() => {
  return (
    <Flex direction="column" gap="2" className="w-[200px] h-[300px]">
      <Skeleton className="w-full h-full bg-zinc-500/10 rounded-md" />
      <Skeleton className="p-1 rounded-md bg-zinc-500/10" />
    </Flex>
  );
});

export default IssueSkeleton;
