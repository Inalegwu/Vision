import { Tooltip } from "radix-ui";

type Props={
  content: String;
  child: React.ReactNode;
}

export default function Tooltip({content,child}:Props){

  return <Tooltip.Root>
    <Tooltip.Trigger>
      {child}
    </Tooltip.Trigger>
    <Tooltip.Content>
      {content}
    </Tooltip.Content>
  </Tooltip.Root>
}
