import type { Meta, StoryObj } from "@storybook/react-vite";

import { CatMenuIcon, GitHubIcon, InstagramIcon } from "./icons";

const meta = {
  title: "Shared/Icons",
  render: () => (
    <div className="flex gap-4 text-slate-12">
      <CatMenuIcon className="size-6" />
      <InstagramIcon className="size-6" />
      <GitHubIcon className="size-6" />
    </div>
  ),
} satisfies Meta;
export default meta;

export const All: StoryObj<typeof meta> = {};
