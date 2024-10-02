import { deleteFromStoreCompletionEvent$ } from "@core/events";
import { ContextMenu, DropdownMenu, Flex, Text } from "@radix-ui/themes";
import t from "@shared/config";
import { useRouter } from "@tanstack/react-router";
import { memo } from "react";
import type { IssueSelect } from "@shared/types";

type Props = {
  issue: IssueSelect;
};

export default function Issue({ issue }: Props) {
  const utils = t.useUtils();
  const navigation = useRouter();

  deleteFromStoreCompletionEvent$.on(() => utils.library.invalidate());

  const go = () =>
    navigation.navigate({
      to: "/$issueId",
      params: {
        issueId: issue._id,
      },
    });

  return null;
}
