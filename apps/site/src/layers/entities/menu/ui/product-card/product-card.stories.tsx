import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { colaFixture, gyozaFixture, ramenFixture } from "../../testing";
import { DrinkCard, FoodCard } from "./product-card";

const meta = {
  title: "Entities/Menu/ProductCard",
  component: FoodCard,
  args: { item: ramenFixture, className: "rotate-2", onSelect: fn() },
  decorators: [
    (Story) => (
      <div className="bg-tomato-3 p-8">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <div className="w-80">
      <FoodCard {...args} />
    </div>
  ),
} satisfies Meta<typeof FoodCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Food: Story = {};

export const WideFood: Story = { args: { item: gyozaFixture, className: "-rotate-2" } };

export const Drink: Story = {
  args: { item: colaFixture },
  render: (args) => (
    <div className="w-38">
      <DrinkCard {...args} />
    </div>
  ),
};
