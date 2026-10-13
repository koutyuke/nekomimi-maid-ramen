import { getSiteBaseURL } from "@nekomimi/core/http";

export const PAGE_HEADS = {
  "/": {
    title: "猫耳メイドラーメン",
    description: "茨城高専の文化祭に出店する猫耳メイドラーメンのメニュー、営業時間、出店場所をご案内します。",
  },
  "/terms": {
    title: "利用規約 | 猫耳メイドラーメン",
    description: "猫耳メイドラーメンの公開サイトとスタッフ機能の利用条件を定めた利用規約です。",
  },
  "/privacy": {
    title: "プライバシーポリシー | 猫耳メイドラーメン",
    description:
      "猫耳メイドラーメンの公開サイトとスタッフ機能で扱う情報と、その取り扱いを定めたプライバシーポリシーです。",
  },
} as const;

// プレビュー環境でも、検索エンジンには本番のURLを正式なものとして伝える。
const canonicalURL = (path: string): string => new URL(path, getSiteBaseURL(true)).href;

export const pageHead = (path: keyof typeof PAGE_HEADS) => ({
  meta: [{ title: PAGE_HEADS[path].title }, { name: "description", content: PAGE_HEADS[path].description }],
  links: [{ rel: "canonical", href: canonicalURL(path) }],
});
