import { Spinner } from "@components";
import { Flex, Heading, Text } from "@radix-ui/themes";
import t from "@shared/config";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/edit/$id")({
  component: Component,
});

function Component() {
  const { id } = Route.useParams();

  const { data, isLoading } = t.issue.getIssue.useQuery({
    issueId: id,
  });

  console.log({ data });

  return (
    <Flex className="w-full h-screen" align="center">
      <Flex
        direction="column"
        className="w-4/6 h-full px-3"
        align="center"
        justify="center"
      >
        {isLoading && <Spinner size={40} />}
        <Flex width="100%" align="start" direction="column" gap="3">
          <Heading size="7">{data?.metadata?.Series}</Heading>
          <Flex gap="1" direction="column" align="start" width="100%">
            <Text size="4">Number: {data?.metadata?.Issue}</Text>
            <Text size="4">{data?.metadata?.Summary}</Text>
            <Text size="4">Page Count: {data?.metadata?.PageCount}</Text>
            <Text size="4">Written By: {data?.metadata?.writer}</Text>
            <Text size="2" color="gray">
              {data?.metadata?.Notes}
            </Text>
          </Flex>
        </Flex>
      </Flex>
      <Flex direction="column" justify="center" align="center">
        <Flex className="w-[400px] h-[600px] cursor-pointer overflow-hidden rounded-md border-1 border-solid border-zinc-200 dark:border-zinc-800 shadow-md">
          <img
            src={data?.issue?.thumbnailUrl}
            alt={data?.issue?.issueTitle}
            className="w-full h-full "
          />
        </Flex>
      </Flex>
    </Flex>
  );
}
