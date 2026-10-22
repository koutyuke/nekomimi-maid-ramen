import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { salesSummaryFixture } from "../testing";
import { SalesSummaryPageUI } from "./sales-summary-page.ui";

const meta = {
  component: SalesSummaryPageUI,
  title: "Pages/SalesSummary/SalesSummaryPage",
  args: {
    businessDate: "2026-10-24",
    summary: { status: "success", data: salesSummaryFixture },
    realtimeConnected: true,
    onBusinessDateChange: fn(),
    onRetry: fn(),
  },
} satisfies Meta<typeof SalesSummaryPageUI>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Summary: Story = {};
export const Connecting: Story = { args: { realtimeConnected: false } };
export const Loading: Story = { args: { summary: { status: "pending" } } };
export const Failed: Story = { args: { summary: { status: "error" } } };
export const Denied: Story = { args: { summary: { status: "denied" } } };
