import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentType } from "react";

import { AnimatedCheckIcon } from "./animated-check-icon";
import { BuckwheatIcon } from "./buckwheat-icon";
import { CashewIcon } from "./cashew-icon";
import { CatMenuIcon } from "./cat-menu-icon";
import { CrabIcon } from "./crab-icon";
import { EggIcon } from "./egg-icon";
import { GitHubIcon } from "./github-icon";
import { InstagramIcon } from "./instagram-icon";
import { MilkIcon } from "./milk-icon";
import { PeanutIcon } from "./peanut-icon";
import { ShrimpIcon } from "./shrimp-icon";
import { WalnutIcon } from "./walnut-icon";
import { WheatIcon } from "./wheat-icon";
import type { IconProps } from "./icon-props";

const IconGrid = ({ icons }: { icons: readonly (readonly [string, ComponentType<IconProps>])[] }) => (
  <ul className="grid grid-cols-3 gap-4 text-slate-12">
    {icons.map(([name, Icon]) => (
      <li key={name} className="flex items-center gap-2 text-sm">
        <Icon className="size-6" />
        {name}
      </li>
    ))}
  </ul>
);

const meta = {
  title: "Shared/Icons",
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Site: Story = {
  render: () => (
    <IconGrid
      icons={[
        ["CatMenu", CatMenuIcon],
        ["Instagram", InstagramIcon],
        ["GitHub", GitHubIcon],
      ]}
    />
  ),
};

export const Allergens: Story = {
  render: () => (
    <IconGrid
      icons={[
        ["えび", ShrimpIcon],
        ["かに", CrabIcon],
        ["カシューナッツ", CashewIcon],
        ["くるみ", WalnutIcon],
        ["小麦", WheatIcon],
        ["そば", BuckwheatIcon],
        ["卵", EggIcon],
        ["乳", MilkIcon],
        ["落花生", PeanutIcon],
      ]}
    />
  ),
};

// 表示されるたびに線が描かれる。もう一度見るときはストーリーを開き直す。
export const AnimatedCheck: Story = {
  render: () => <AnimatedCheckIcon className="size-6 text-slate-12" />,
};
