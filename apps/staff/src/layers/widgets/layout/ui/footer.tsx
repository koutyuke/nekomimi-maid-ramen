import { Anchor, Group } from "@mantine/core";

import { getSiteBaseURL } from "@nekomimi/core/http";

export const Footer = () => (
  <Group component="footer" aria-label="規約とポリシー" gap="lg" justify="center" p="lg">
    <Anchor
      href={new URL("/privacy", getSiteBaseURL(import.meta.env.PROD)).href}
      mih={44}
      display="inline-flex"
      style={{ alignItems: "center" }}
    >
      プライバシーポリシー
    </Anchor>
    <Anchor
      href={new URL("/terms", getSiteBaseURL(import.meta.env.PROD)).href}
      mih={44}
      display="inline-flex"
      style={{ alignItems: "center" }}
    >
      利用規約
    </Anchor>
  </Group>
);
