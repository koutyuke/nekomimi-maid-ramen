import type { Meta, StoryObj } from "@storybook/react-vite";

import { menuItemFixture } from "../../testing/menu.fixtures";
import { MenuItemCardUI } from "./menu-item-card.ui";

const meta = {
  component: MenuItemCardUI,
  title: "Entities/Menu/MenuItemCard",
} satisfies Meta<typeof MenuItemCardUI>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AllergenUnchecked: Story = {
  args: { item: menuItemFixture() },
};

export const AllergenContained: Story = {
  args: {
    item: menuItemFixture({
      allergenCheckState: "checked",
      containedAllergens: [
        { id: "allergen-wheat", name: "小麦" },
        { id: "allergen-egg", name: "卵" },
      ],
    }),
  },
};

export const AllergenNotContained: Story = {
  args: { item: menuItemFixture({ allergenCheckState: "checked" }) },
};

export const SoldOut: Story = {
  args: { item: menuItemFixture({ sellable: false }) },
};

export const WithoutDescription: Story = {
  args: { item: menuItemFixture({ description: null }) },
};
