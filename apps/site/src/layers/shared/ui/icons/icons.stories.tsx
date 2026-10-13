import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentType } from "react";

import { AnimatedCheckIcon } from "./animated-check-icon";
import BuckwheatIcon from "./buckwheat-icon.svg?react";
import CashewIcon from "./cashew-icon.svg?react";
import CatMenuIcon from "./cat-menu-icon.svg?react";
import CrabIcon from "./crab-icon.svg?react";
import EggIcon from "./egg-icon.svg?react";
import GitHubIcon from "./github-icon.svg?react";
import InstagramIcon from "./instagram-icon.svg?react";
import MilkIcon from "./milk-icon.svg?react";
import PeanutIcon from "./peanut-icon.svg?react";
import ShrimpIcon from "./shrimp-icon.svg?react";
import WalnutIcon from "./walnut-icon.svg?react";
import WheatIcon from "./wheat-icon.svg?react";
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

export const AnimatedCheck: Story = {
  render: () => <AnimatedCheckIcon className="size-6 text-slate-12" />,
};
