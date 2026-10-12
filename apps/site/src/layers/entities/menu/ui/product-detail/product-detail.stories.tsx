import type { Meta, StoryObj } from "@storybook/react-vite";

import { checkedRamenFixture, ramenFixture } from "../../testing";
import { ProductDetail } from "./product-detail";

const meta = {
  title: "Entities/Menu/ProductDetail",
  component: ProductDetail,
  args: { item: checkedRamenFixture },
  decorators: [
    (Story) => (
      <div className="w-80 rounded-3xl border-4 border-tomato-6 bg-tomato-1">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProductDetail>;
export default meta;
type Story = StoryObj<typeof meta>;

export const AllergensChecked: Story = {};

export const AllergensUnchecked: Story = { args: { item: ramenFixture } };
