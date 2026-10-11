type WaveProps = {
  className?: string;
};

// 区画の境目の波。上に重なる区画の色(文字色)で塗る。横幅に合わせて伸縮し、繰り返さない。
export const Wave = ({ className }: WaveProps) => (
  <svg className={className} viewBox="0 0 640 124" preserveAspectRatio="none" fill="currentColor" aria-hidden>
    <path d="M0 81.5 21.333 67.278C42.667 53.056 85.333 24.611 128 26.967c42.667 2.533 85.333 35.422 128 35.556 42.667-.134 85.333-33.023 128-49.778 42.667-16.578 85.333-16.578 128-2.356 42.667 14.222 85.333 42.667 106.667 56.889L640 81.5V124H0V81.5Z" />
  </svg>
);
