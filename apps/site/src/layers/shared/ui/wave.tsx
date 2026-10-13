const WAVE_PATHS = {
  default:
    "M0 81.5 21.333 67.278C42.667 53.056 85.333 24.611 128 26.967c42.667 2.533 85.333 35.422 128 35.556 42.667-.134 85.333-33.023 128-49.778 42.667-16.578 85.333-16.578 128-2.356 42.667 14.222 85.333 42.667 106.667 56.889L640 81.5V124H0V81.5Z",
  inverted:
    "M640 0 618.667 14.222C597.333 28.444 554.667 56.889 512 54.533 469.333 52 426.667 19.111 384 18.978 341.333 19.111 298.667 52 256 68.756 213.333 85.333 170.667 85.333 128 71.111 85.333 56.889 42.667 28.444 21.333 14.222L0 0V124H640V0Z",
} as const;

type WaveVariant = keyof typeof WAVE_PATHS;

const toMask = (path: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 124" preserveAspectRatio="none"><path d="${path}"/></svg>`,
  )}")`;

const MASKS: Record<WaveVariant, string> = {
  default: toMask(WAVE_PATHS.default),
  inverted: toMask(WAVE_PATHS.inverted),
};

type WaveProps = {
  className: string;
  variant?: WaveVariant;
};

export const Wave = ({ className, variant = "default" }: WaveProps) => (
  <div
    aria-hidden
    className={`absolute bottom-full left-0 h-18 w-full ${className}`}
    style={{ maskImage: MASKS[variant], maskSize: "100% 100%", maskRepeat: "no-repeat" }}
  />
);
