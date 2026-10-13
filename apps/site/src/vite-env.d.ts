/// <reference types="vite/client" />

// `vite-imagetools`で変換する画像は、クエリの末尾に`&imagetools`を付けて読み込む。
declare module "*&imagetools" {
  const src: string;
  export default src;
}
