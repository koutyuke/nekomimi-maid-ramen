import { motion, useReducedMotion } from "motion/react";
import type { ComponentProps } from "react";

export const Reveal = (props: ComponentProps<typeof motion.div>) => {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      {...props}
    />
  );
};
