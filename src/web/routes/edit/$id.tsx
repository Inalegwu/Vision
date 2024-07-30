import { Spinner } from "@components";
import { Flex } from "@radix-ui/themes";
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
      <Flex className="w-4/6 h-full">{isLoading && <Spinner size={40} />}</Flex>
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
