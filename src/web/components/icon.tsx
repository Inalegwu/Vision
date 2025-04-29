import { icons } from "lucide-react";
import React from "react";

type Props = {
  name: keyof typeof icons;
  size?: number;
  className?: string;
};

const Icon = React.memo(({ name, size, className }: Props) => {
  const LucideIcon = icons[name];

  return <LucideIcon size={size} className={className} />;
});

export default Icon;
