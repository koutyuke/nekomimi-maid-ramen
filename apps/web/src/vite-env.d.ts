/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 画面から呼び出すAPIの送信元。本番のビルド時に指定する。 */
  readonly VITE_API_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
