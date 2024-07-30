import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$collectionId")({
  component: Component,
});

function Component() {
  const { collectionId } = Route.useParams();

  return <h1>{collectionId}</h1>;
}
