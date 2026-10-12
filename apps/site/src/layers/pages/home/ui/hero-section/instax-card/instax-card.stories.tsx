import type { Meta, StoryObj } from "@storybook/react-vite";

import { InstaxCard } from "./instax-card";

const meta = {
  title: "Pages/Home/InstaxCard",
  component: InstaxCard,
  decorators: [
    (Story) => (
      <div className="flex justify-center p-12">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InstaxCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Front: Story = {};

export const Back: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "チェキを裏返す" }));
  },
};
