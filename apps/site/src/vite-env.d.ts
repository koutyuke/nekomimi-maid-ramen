/// <reference types="vite/client" />

// `vite-imagetools`で変換する画像は、クエリの末尾に`&imagetools`を付けて読み込む。変換後のURL(`inline`ならData URL)が返る。
declare module "*&imagetools" {
  const src: string;
  export default src;
}
