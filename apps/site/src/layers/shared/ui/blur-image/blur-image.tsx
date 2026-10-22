import { useState } from "react";
import type { CSSProperties } from "react";

export type OptimizedImage = {
  src: string;
  srcSet: string;
  sizes: string;
  placeholder: string;
  width: number;
  height: number;
};

type BlurImageProps = {
  src: string;
  srcSet?: string;
  sizes?: string;
  placeholder: string;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
  fit?: CSSProperties["objectFit"];
  objectPosition?: CSSProperties["objectPosition"];
};

const loadedSources = new Set<string>();

export const BlurImage = ({
  src,
  srcSet,
  sizes,
  placeholder,
  alt,
  className = "",
  loading = "lazy",
  fit = "cover",
  objectPosition,
}: BlurImageProps) => {
  const [loaded, setLoaded] = useState(() => loadedSources.has(src));
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={placeholder}
        alt=""
        aria-hidden
        style={{ objectFit: fit, objectPosition }}
        className={`absolute inset-0 size-full scale-110 blur-md transition-opacity duration-300 motion-reduce:transition-none ${loaded ? "opacity-0" : "opacity-100"}`}
      />
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={() => {
          loadedSources.add(src);
          setLoaded(true);
        }}
        style={{ objectFit: fit, objectPosition }}
        className={`absolute inset-0 size-full transition-opacity duration-300 motion-reduce:transition-none ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
};
