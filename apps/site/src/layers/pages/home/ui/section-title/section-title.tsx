import type { ReactNode } from "react";

type SectionTitleProps = {
  id?: string;
  children: ReactNode;
};

export const SectionTitle = ({ id, children }: SectionTitleProps) => (
  <h2
    id={id}
    className="scroll-mt-24 text-center text-4xl leading-12 font-black text-white [text-shadow:2px_2px_0_var(--tomato-9)]"
  >
    <span aria-hidden>\ </span>
    {children}
    <span aria-hidden> /</span>
  </h2>
);
