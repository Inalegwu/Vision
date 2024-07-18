import { motion } from "framer-motion";

type Props = {
  size?: number;
};

export default function Spinner({ size }: Props) {
  return (
    <motion.div
      animate={{ rotateZ: "180deg" }}
      transition={{
        repeat: Number.POSITIVE_INFINITY,
        duration: 0.8,
        damping: 20,
        ease: "linear",
      }}
    >
      <div
        className="border-1 rounded-full border-1.5 border-dashed border-zinc-600 dark:border-zinc-400"
        style={{ width: size || 10, height: size || 10 }}
      />
    </motion.div>
  );
}
