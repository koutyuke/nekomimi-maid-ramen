import type { ReactNode } from "react";

import cola from "../assets/cola.svg";
import gingerAle from "../assets/ginger-ale.svg";
import oolongTea from "../assets/oolong-tea.svg";
import orange from "../assets/orange.svg";
import soda from "../assets/soda.svg";
import { MENU_PHOTOS } from "./images";
import type { OptimizedImage } from "../../../shared/ui";
import type { MenuCategory } from "@nekomimi/core/models";

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

export const EQUIVALENT_ALLERGENS = [
  { id: "allergen-almond", name: "アーモンド" },
  { id: "allergen-abalone", name: "あわび" },
  { id: "allergen-squid", name: "いか" },
  { id: "allergen-salmon-roe", name: "いくら" },
  { id: "allergen-orange", name: "オレンジ" },
  { id: "allergen-kiwifruit", name: "キウイフルーツ" },
  { id: "allergen-beef", name: "牛肉" },
  { id: "allergen-sesame", name: "ごま" },
  { id: "allergen-salmon", name: "さけ" },
  { id: "allergen-mackerel", name: "さば" },
  { id: "allergen-soybean", name: "大豆" },
  { id: "allergen-chicken", name: "鶏肉" },
  { id: "allergen-banana", name: "バナナ" },
  { id: "allergen-pistachio", name: "ピスタチオ" },
  { id: "allergen-pork", name: "豚肉" },
  { id: "allergen-macadamia-nut", name: "マカダミアナッツ" },
  { id: "allergen-peach", name: "もも" },
  { id: "allergen-yam", name: "やまいも" },
  { id: "allergen-apple", name: "りんご" },
  { id: "allergen-gelatin", name: "ゼラチン" },
] as const satisfies readonly { id: string; name: string }[];

export type AllergenId = (typeof ALLERGENS)[number]["id"];

export type EquivalentAllergenId = (typeof EQUIVALENT_ALLERGENS)[number]["id"];

export type AllergenStatus = "contains" | "may-contain" | "absent";

export type MenuItemImage = { kind: "photo"; photo: OptimizedImage } | { kind: "illustration"; src: string };

export type MenuItem = {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  category: MenuCategory;
  description: ReactNode | null;
  image: MenuItemImage;
  allergens: Readonly<Record<AllergenId | EquivalentAllergenId, AllergenStatus>> | null;
};

const RAMEN_ALLERGENS: NonNullable<MenuItem["allergens"]> = {
  "allergen-shrimp": "absent",
  "allergen-crab": "absent",
  "allergen-cashew-nut": "absent",
  "allergen-walnut": "absent",
  "allergen-wheat": "contains",
  "allergen-buckwheat": "absent",
  "allergen-egg": "may-contain",
  "allergen-milk": "may-contain",
  "allergen-peanut": "absent",
  "allergen-almond": "absent",
  "allergen-abalone": "absent",
  "allergen-squid": "absent",
  "allergen-salmon-roe": "absent",
  "allergen-orange": "absent",
  "allergen-kiwifruit": "absent",
  "allergen-beef": "may-contain",
  "allergen-sesame": "contains",
  "allergen-salmon": "absent",
  "allergen-mackerel": "may-contain",
  "allergen-soybean": "contains",
  "allergen-chicken": "contains",
  "allergen-banana": "absent",
  "allergen-pistachio": "absent",
  "allergen-pork": "contains",
  "allergen-macadamia-nut": "absent",
  "allergen-peach": "absent",
  "allergen-yam": "absent",
  "allergen-apple": "may-contain",
  "allergen-gelatin": "may-contain",
};

const GYOZA_ALLERGENS: NonNullable<MenuItem["allergens"]> = {
  "allergen-shrimp": "absent",
  "allergen-crab": "absent",
  "allergen-cashew-nut": "absent",
  "allergen-walnut": "absent",
  "allergen-wheat": "contains",
  "allergen-buckwheat": "absent",
  "allergen-egg": "absent",
  "allergen-milk": "contains",
  "allergen-peanut": "absent",
  "allergen-almond": "absent",
  "allergen-abalone": "absent",
  "allergen-squid": "absent",
  "allergen-salmon-roe": "absent",
  "allergen-orange": "absent",
  "allergen-kiwifruit": "absent",
  "allergen-beef": "absent",
  "allergen-sesame": "contains",
  "allergen-salmon": "absent",
  "allergen-mackerel": "absent",
  "allergen-soybean": "contains",
  "allergen-chicken": "contains",
  "allergen-banana": "absent",
  "allergen-pistachio": "absent",
  "allergen-pork": "contains",
  "allergen-macadamia-nut": "absent",
  "allergen-peach": "absent",
  "allergen-yam": "absent",
  "allergen-apple": "absent",
  "allergen-gelatin": "absent",
};

const DRINK_ALLERGENS: NonNullable<MenuItem["allergens"]> = {
  "allergen-shrimp": "absent",
  "allergen-crab": "absent",
  "allergen-cashew-nut": "absent",
  "allergen-walnut": "absent",
  "allergen-wheat": "absent",
  "allergen-buckwheat": "absent",
  "allergen-egg": "absent",
  "allergen-milk": "absent",
  "allergen-peanut": "absent",
  "allergen-almond": "absent",
  "allergen-abalone": "absent",
  "allergen-squid": "absent",
  "allergen-salmon-roe": "absent",
  "allergen-orange": "absent",
  "allergen-kiwifruit": "absent",
  "allergen-beef": "absent",
  "allergen-sesame": "absent",
  "allergen-salmon": "absent",
  "allergen-mackerel": "absent",
  "allergen-soybean": "absent",
  "allergen-chicken": "absent",
  "allergen-banana": "absent",
  "allergen-pistachio": "absent",
  "allergen-pork": "absent",
  "allergen-macadamia-nut": "absent",
  "allergen-peach": "absent",
  "allergen-yam": "absent",
  "allergen-apple": "absent",
  "allergen-gelatin": "absent",
};

const DRINK_DESCRIPTION =
  "ご主人さま、ひと息つきませんか？お気に入りの一杯で、ほっとひと休み♡ おしゃべりしながら、のんびり楽しんでいってくださいねっ♪";

export const MENU_ITEMS: readonly MenuItem[] = [
  {
    id: "item-ramen",
    name: "ラーメン",
    subtitle: "Nekomimi Ramen",
    price: 500,
    category: "main",
    description:
      "あつあつスープに「おいしくな〜れ♡」の魔法をひとさじ。麺をすすれば、おなかもハートもぽかぽかに♪ ご主人さま、最後のひとくちまで楽しんでくださいねっ♡",
    image: { kind: "photo", photo: MENU_PHOTOS.ramen },
    allergens: RAMEN_ALLERGENS,
  },
  {
    id: "item-gyoza",
    name: "餃子",
    subtitle: "Crispy Gyoza",
    price: 400,
    category: "side",
    description:
      "ぱくっとひとくち、じゅわっとしあわせ♡ ちっちゃな餃子に、おいしさをぎゅぎゅっと包みました。ラーメンのおともに、わたしもまぜてっ♪",
    image: { kind: "photo", photo: MENU_PHOTOS.gyoza },
    allergens: GYOZA_ALLERGENS,
  },
  {
    id: "item-soda",
    name: "ソーダ",
    subtitle: "Soda",
    price: 300,
    category: "drink",
    description: DRINK_DESCRIPTION,
    image: { kind: "illustration", src: soda },
    allergens: DRINK_ALLERGENS,
  },
  {
    id: "item-cola",
    name: "コーラ",
    subtitle: "Cola",
    price: 300,
    category: "drink",
    description: DRINK_DESCRIPTION,
    image: { kind: "illustration", src: cola },
    allergens: DRINK_ALLERGENS,
  },
  {
    id: "item-orange-juice",
    name: "オレンジジュース",
    subtitle: "Orange",
    price: 300,
    category: "drink",
    description: DRINK_DESCRIPTION,
    image: { kind: "illustration", src: orange },
    allergens: { ...DRINK_ALLERGENS, "allergen-orange": "contains" },
  },
  {
    id: "item-ginger-ale",
    name: "ジンジャーエール",
    subtitle: "Ginger Ale",
    price: 300,
    category: "drink",
    description: DRINK_DESCRIPTION,
    image: { kind: "illustration", src: gingerAle },
    allergens: DRINK_ALLERGENS,
  },
  {
    id: "item-oolong-tea",
    name: "烏龍茶",
    subtitle: "Oolong Tea",
    price: 300,
    category: "drink",
    description: DRINK_DESCRIPTION,
    image: { kind: "illustration", src: oolongTea },
    allergens: DRINK_ALLERGENS,
  },
];
