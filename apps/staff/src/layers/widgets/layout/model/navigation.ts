import { getSiteBaseURL } from "@nekomimi/core/http";
import type { StaffRole } from "../../../entities/staff";

type Navigation = {
  href: string;
  label: string;
  description: string;
  // 省略した場合はロールを問わず表示する。
  roles?: readonly StaffRole[];
};

// 導線は実装済みのページだけを載せる。ページを増やしたらここへ追加する。
const staffNavigations: readonly Navigation[] = [
  {
    href: "/sales",
    label: "注文・会計",
    description: "注文を入力・確定するページ",
    roles: ["Owner", "Admin", "Staff"],
  },
  {
    href: "/kitchen",
    label: "調理",
    description: "注文の確認と調理状況を更新するページ",
    roles: ["Owner", "Admin", "Staff"],
  },
  {
    href: "/handoff",
    label: "受け渡し",
    description: "注文番号と商品を確認し、受け渡しを記録するページ",
    roles: ["Owner", "Admin", "Staff"],
  },
  {
    href: "/order-management",
    label: "注文管理",
    description: "確定した注文を確認・取り消すページ",
    roles: ["Owner", "Admin", "Staff"],
  },
];

const adminNavigations: readonly Navigation[] = [
  {
    href: "/staff-management",
    label: "スタッフ管理",
    description: "スタッフ一覧と権限管理を行うページ",
    roles: ["Owner", "Admin"],
  },
  {
    href: "/inventory-management",
    label: "在庫管理",
    description: "商品ごとの在庫確認と管理を行うページ",
    roles: ["Owner", "Admin"],
  },
];

const publicNavigations: readonly Navigation[] = [
  {
    href: new URL("/", getSiteBaseURL(import.meta.env.PROD)).href,
    label: "トップ",
    description: "猫耳メイドラーメンのトップページ",
  },
  {
    href: new URL("/menu", getSiteBaseURL(import.meta.env.PROD)).href,
    label: "メニュー",
    description: "来場者に見えているメニュー",
  },
];

export const getNavigationGroups = (role: StaffRole) =>
  [
    { title: "スタッフページ", navigations: staffNavigations },
    { title: "管理者ページ", navigations: adminNavigations },
    { title: "一般公開ページ", navigations: publicNavigations },
  ]
    .map((group) => ({
      title: group.title,
      navigations: group.navigations.filter((navigation) => navigation.roles?.includes(role) ?? true),
    }))
    .filter((group) => group.navigations.length > 0);
