import { ScrollArea } from "@radix-ui/themes";
import type React from "react";

type ListRenderItemProps<T> = {
  item: T;
  index: number;
};

type FlatListProps<T> = {
  renderItem: (props: ListRenderItemProps<T>) => React.ReactNode;
  data: T[];
  listHeaderComponent?: () => React.ReactNode;
  listFooterComponent?: () => React.ReactNode;
  scrollbars?: "horizontal" | "vertical" | "both";
  scrollHideDelay?: number;
  className?: string;
  style?: React.CSSProperties;
};

const FlatList = <T extends Record<string, unknown>>({
  renderItem,
  listFooterComponent: ListFooterComponent,
  listHeaderComponent: ListHeaderComponent,
  scrollHideDelay,
  scrollbars,
  data,
  className,
  style,
}: FlatListProps<T>) => {
  return (
    <ScrollArea
      style={style}
      className={className}
      scrollbars={scrollbars}
      scrollHideDelay={scrollHideDelay}
      size="1"
    >
      {ListHeaderComponent && <ListHeaderComponent />}
      {data.map((v, idx) => renderItem({ item: v, index: idx }))}
      {ListFooterComponent && <ListFooterComponent />}
    </ScrollArea>
  );
};

export default FlatList;
