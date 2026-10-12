import { useState } from "react";

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
};

// 親が決めた大きさいっぱいに、代替画像の上へ本画像を重ね、読み込みが終わったらフェードインさせる。
export const BlurImage = ({ src, placeholder, alt, className = "", loading = "lazy" }: BlurImageProps) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={placeholder}
        alt=""
        aria-hidden
        className={`absolute inset-0 size-full scale-110 object-cover blur-md transition-opacity duration-300 motion-reduce:transition-none ${loaded ? "opacity-0" : "opacity-100"}`}
      />
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 size-full object-cover transition-opacity duration-300 motion-reduce:transition-none ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
};
