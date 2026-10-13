import { motion, useReducedMotion } from "motion/react";

import { lineIconProps } from "./icon-props";

type AnimatedCheckIconProps = {
  className?: string;
};

export const AnimatedCheckIcon = ({ className }: AnimatedCheckIconProps) => {
  const reduceMotion = useReducedMotion();
  return (
    <motion.svg
      {...lineIconProps}
      className={className}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.14, ease: "easeOut" }}
    >
      <motion.path
        d="m4 12 5 5L20 6"
        initial={reduceMotion ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.22 }}
      />
    </motion.svg>
  );
};
