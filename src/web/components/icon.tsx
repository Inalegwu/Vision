import { icons } from "lucide-react";
import React from "react";

type Props = {
  name: keyof typeof icons;
  size: number;
};

const Icon = React.memo(({ name, size }: Props) => {
  const LucideIcon = icons[name];

  return <LucideIcon size={size} />;
});

export default Icon;
