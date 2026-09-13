import { Anchor, Container, Paper, Stack, Text, Title } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export type InventoryManagementPageUIProps = {
  slots: { stockManagement: ReactNode };
};

export const InventoryManagementPageUI = ({ slots }: InventoryManagementPageUIProps) => (
  <Container py="xl" size="lg">
    <Stack gap="xl">
      <Stack gap={4}>
        <Anchor c="dimmed" component={Link} size="sm" to="/" w="fit-content">
          ← スタッフページへ戻る
        </Anchor>
        <Title order={1}>在庫管理</Title>
        <Text c="dimmed" size="sm">
          商品ごとの現在在庫数を登録・修正します。
        </Text>
      </Stack>
      <Paper component="section" p="lg" radius="md" withBorder>
        {slots.stockManagement}
      </Paper>
    </Stack>
  </Container>
);
