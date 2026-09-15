import type { Meta, StoryObj } from "@storybook/react-vite";

import { ConnectingIndicator, ErrorAlert, LoadingNotice } from "./feedback";

const meta = {
  title: "Shared/Feedback",
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Error: Story = {
  render: () => <ErrorAlert title="注文を更新できません">通信状況を確認して、もう一度お試しください。</ErrorAlert>,
};
export const Connecting: Story = { render: () => <ConnectingIndicator /> };
export const Loading: Story = { render: () => <LoadingNotice>注文を読み込んでいます</LoadingNotice> };
