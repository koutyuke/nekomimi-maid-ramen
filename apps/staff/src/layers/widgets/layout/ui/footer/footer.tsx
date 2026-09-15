import { Anchor, Box, Container, Flex, Group, Text } from "@mantine/core";

import { getSiteBaseURL } from "@nekomimi/core/http";

export const Footer = () => (
  <Box component="footer" aria-label="規約とポリシー" style={{ borderTop: "1px solid var(--app-shell-border-color)" }}>
    <Container size="md" py="sm">
      <Flex
        direction={{ base: "column", sm: "row" }}
        align="center"
        justify="space-between"
        gap={{ base: 0, sm: "md" }}
      >
        <Text size="xs" c="dimmed">
          &copy; {new Date().getFullYear()} 猫耳メイドラーメン
        </Text>
        <Group gap="md" justify="center">
          <Anchor
            href={new URL("/privacy", getSiteBaseURL(import.meta.env.PROD)).href}
            size="xs"
            c="dimmed"
            underline="hover"
            mih={44}
            display="inline-flex"
            style={{ alignItems: "center" }}
          >
            プライバシーポリシー
          </Anchor>
          <Anchor
            href={new URL("/terms", getSiteBaseURL(import.meta.env.PROD)).href}
            size="xs"
            c="dimmed"
            underline="hover"
            mih={44}
            display="inline-flex"
            style={{ alignItems: "center" }}
          >
            利用規約
          </Anchor>
        </Group>
      </Flex>
    </Container>
  </Box>
);
