type ScribbleArrowProps = {
  className?: string;
};

// 手書き風の上向きの矢印。色は文字色に合わせる。
export const ScribbleArrow = ({ className }: ScribbleArrowProps) => (
  <svg
    className={className}
    viewBox="0 0 46 103"
    fill="none"
    stroke="currentColor"
    strokeWidth={4.547}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M33.543 100.432C19.478 91.854 13.147 72.909 20.209 53.448c2.243-6.971 6.396-9.396 11.61-6.971 7.548 3.182 12.943 12.397 11.64 18.823-.697 5.032-5.346 7.944-9.916 5.965C18.237 64.64 8.126 27.932 25.626 5.432" />
    <path d="M2.273 17.939C11.383 10.786 19.839 5.59 26.762 2.273l9.452 24.182" />
  </svg>
);
