import type { Meta, StoryObj } from "@storybook/react-vite";

import { colaFixture, gyozaFixture, ramenFixture } from "../../testing/menu-fixtures";
import { ProductImage } from "./product-image";

const meta = {
  title: "Pages/Home/ProductImage",
  component: ProductImage,
  args: { item: ramenFixture, className: "w-50" },
} satisfies Meta<typeof ProductImage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Photo: Story = {};

export const WidePhoto: Story = { args: { item: gyozaFixture } };

export const Illustration: Story = { args: { item: colaFixture, className: "h-50 w-20" } };
