import { motion, useReducedMotion } from "motion/react";
import type { ComponentProps } from "react";

// 画面に入ったときに下から浮かび上がらせる。要素ごとに発火するため、スクロールに合わせて上から順に現れる。
// 動きを減らす設定では移動をやめ、フェードだけにする。
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
