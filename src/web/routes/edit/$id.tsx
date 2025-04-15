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
    <Flex className="w-full h-screen pt-8" align="center">
      <Flex
        direction="column"
        className="w-4/6 h-full px-3"
        align="center"
        justify="center"
      >
        {isLoading && <Spinner size={40} />}
        <Flex width="100%" align="start" direction="column" gap="3">
          <Heading size="7" className="text-moonlightOrange">
            {data?.metadata?.Series}
          </Heading>
          <Flex gap="1" direction="column" align="start" width="100%">
            {data?.metadata?.Issue && (
              <Text size="3">Number: {data?.metadata.Issue}</Text>
            )}
            <Text size="3" className="dark:text-moonlightText">
              {data?.metadata?.Summary}
            </Text>
            {data?.metadata?.PageCount && (
              <Text size="3" className="dark:text-moonlightText">
                <span className="text-moonlightOrange">Page Count:</span>
                {"  "}
                {data?.metadata?.PageCount}
              </Text>
            )}
            {data?.metadata?.writer && (
              <Text size="3">Written By: {data?.metadata.writer}</Text>
            )}
            <Text size="2" className="text-moonlightOrange/40">
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
