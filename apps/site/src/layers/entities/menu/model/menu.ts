import cola from "../assets/cola.svg";
import gingerAle from "../assets/ginger-ale.svg";
import oolongTea from "../assets/oolong-tea.svg";
import orange from "../assets/orange.svg";
import { MENU_PHOTOS } from "./images";
import type { OptimizedImage } from "../../../shared/ui";
import type { MenuCategory } from "@nekomimi/core/models";

// 特定原材料の一覧。IDはスタッフ側のデータベース(`apps/api/seed.sql`)と同じ値にそろえる。
export const ALLERGENS = [
  { id: "allergen-shrimp", name: "えび" },
  { id: "allergen-crab", name: "かに" },
  { id: "allergen-cashew-nut", name: "カシューナッツ" },
  { id: "allergen-walnut", name: "くるみ" },
  { id: "allergen-wheat", name: "小麦" },
  { id: "allergen-buckwheat", name: "そば" },
  { id: "allergen-egg", name: "卵" },
  { id: "allergen-milk", name: "乳" },
  { id: "allergen-peanut", name: "落花生" },
] as const satisfies readonly { id: string; name: string }[];

export type AllergenId = (typeof ALLERGENS)[number]["id"];

// 使用している、調理過程での接触や使用製品での含有の可能性がある、使用していない。
export type AllergenStatus = "contains" | "may-contain" | "absent";

export type MenuItemImage = { kind: "photo"; photo: OptimizedImage } | { kind: "illustration"; src: string };

export type MenuItem = {
  // スタッフ側のデータベース(`apps/api/seed.sql`)の商品IDと同じ値にそろえる。
  id: string;
  name: string;
  subtitle: string;
  price: number;
  category: MenuCategory;
  description: string | null;
  image: MenuItemImage;
  // 原材料を確認していない商品は`null`にする。確認した商品は、全品目の使用状況を持つ。
  allergens: Readonly<Record<AllergenId, AllergenStatus>> | null;
};

// 会計はスタッフ側のデータベースの価格で行うため、商品名・価格を変えるときは`apps/api/seed.sql`も同時に直す。
export const MENU_ITEMS: readonly MenuItem[] = [
  {
    id: "item-ramen",
    name: "ラーメン",
    subtitle: "Nekomimi Ramen",
    price: 500,
    category: "main",
    description: null,
    image: { kind: "photo", photo: MENU_PHOTOS.ramen },
    allergens: null,
  },
  {
    id: "item-gyoza",
    name: "餃子",
    subtitle: "Crispy Gyoza",
    price: 400,
    category: "side",
    description: null,
    image: { kind: "photo", photo: MENU_PHOTOS.gyoza },
    allergens: null,
  },
  {
    id: "item-cola",
    name: "コーラ",
    subtitle: "Cola",
    price: 300,
    category: "drink",
    description: null,
    image: { kind: "illustration", src: cola },
    allergens: null,
  },
  {
    id: "item-orange-juice",
    name: "オレンジジュース",
    subtitle: "Orange",
    price: 300,
    category: "drink",
    description: null,
    image: { kind: "illustration", src: orange },
    allergens: null,
  },
  {
    id: "item-ginger-ale",
    name: "ジンジャーエール",
    subtitle: "Ginger Ale",
    price: 300,
    category: "drink",
    description: null,
    image: { kind: "illustration", src: gingerAle },
    allergens: null,
  },
  {
    id: "item-oolong-tea",
    name: "烏龍茶",
    subtitle: "Oolong Tea",
    price: 300,
    category: "drink",
    description: null,
    image: { kind: "illustration", src: oolongTea },
    allergens: null,
  },
];
