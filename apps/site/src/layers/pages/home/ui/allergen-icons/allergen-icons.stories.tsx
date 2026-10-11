import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  BuckwheatIcon,
  CashewIcon,
  CrabIcon,
  EggIcon,
  MilkIcon,
  PeanutIcon,
  ShrimpIcon,
  WalnutIcon,
  WheatIcon,
} from "./allergen-icons";

const ICONS = [
  ["えび", ShrimpIcon],
  ["かに", CrabIcon],
  ["カシューナッツ", CashewIcon],
  ["くるみ", WalnutIcon],
  ["小麦", WheatIcon],
  ["そば", BuckwheatIcon],
  ["卵", EggIcon],
  ["乳", MilkIcon],
  ["落花生", PeanutIcon],
] as const;

const meta = {
  title: "Pages/Home/AllergenIcons",
  render: () => (
    <ul className="grid grid-cols-3 gap-4 text-tomato-12">
      {ICONS.map(([name, Icon]) => (
        <li key={name} className="flex items-center gap-2 text-sm">
          <Icon className="size-6" />
          {name}
        </li>
      ))}
    </ul>
  ),
} satisfies Meta;
export default meta;

export const All: StoryObj<typeof meta> = {};
