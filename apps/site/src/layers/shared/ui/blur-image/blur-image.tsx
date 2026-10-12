import { useState } from "react";
import type { CSSProperties } from "react";

// ビルド時に変換した写真。本画像のURL、代替画像のData URL、原本の大きさ(表示領域の縦横比に使う)を持つ。
export type OptimizedImage = {
  src: string;
  placeholder: string;
  width: number;
  height: number;
};

type BlurImageProps = {
  src: string;
  // 幅32px程度に縮めた代替画像のData URL。本画像の読み込み中にぼかして見せる。
  placeholder: string;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
  fit?: CSSProperties["objectFit"];
};

// 読み込みが終わった本画像のURL。同じ画像を別の要素で表示し直すとき(カードから詳細への拡大など)は、
// ブラウザーのキャッシュから即座に出せるため、ぼかした代替画像を挟まない。
const loadedSources = new Set<string>();

// 親が決めた大きさいっぱいに、代替画像の上へ本画像を重ね、読み込みが終わったらフェードインさせる。
export const BlurImage = ({
  src,
  placeholder,
  alt,
  className = "",
  loading = "lazy",
  fit = "cover",
}: BlurImageProps) => {
  const [loaded, setLoaded] = useState(() => loadedSources.has(src));
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={placeholder}
        alt=""
        aria-hidden
        style={{ objectFit: fit }}
        className={`absolute inset-0 size-full scale-110 blur-md transition-opacity duration-300 motion-reduce:transition-none ${loaded ? "opacity-0" : "opacity-100"}`}
      />
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={() => {
          loadedSources.add(src);
          setLoaded(true);
        }}
        style={{ objectFit: fit }}
        className={`absolute inset-0 size-full transition-opacity duration-300 motion-reduce:transition-none ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
};
