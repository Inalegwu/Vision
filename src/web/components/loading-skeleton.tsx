import { Flex } from "@radix-ui/themes";
import React from "react";
import IssueSkeleton from "./issue-skeleton";

type Props = {
  estimatedLength?: number;
};

const LoadingSkeleton = React.memo(({ estimatedLength = 10 }: Props) => {
  return (
    <Flex wrap="wrap" className="overflow-y-scroll pb-17" gap="2">
      {new Array(estimatedLength).map((_, idx) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
        <IssueSkeleton key={idx} />
      ))}
    </Flex>
  );
});

export default LoadingSkeleton;
