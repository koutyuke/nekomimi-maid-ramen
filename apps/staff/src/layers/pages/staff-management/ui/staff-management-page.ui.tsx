import { Anchor, Button, Container, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { StaffRoleBadge } from "../../../entities/staff";
import type { Staff, StaffRole } from "../../../entities/staff";

export type StaffManagementPageUIProps = {
  administrator: Pick<Staff, "id"> & { role: Extract<StaffRole, "Owner" | "Admin"> };
  onRetry: () => void;
  slots: {
    roleManagement: ReactNode;
  };
};

export const StaffManagementPageUI = ({
  administrator,
  onRetry,
  slots: { roleManagement },
}: StaffManagementPageUIProps) => (
  <Container py="xl" size="lg">
    <Stack gap="xl">
      <Stack gap={4}>
        <Anchor c="dimmed" component={Link} size="sm" to="/" w="fit-content">
          ← スタッフページへ戻る
        </Anchor>
        <Group align="flex-end" gap="sm" justify="space-between">
          <Stack gap={4}>
            <Title order={1}>スタッフ管理</Title>
            <Text c="dimmed" size="sm">
              スタッフのロールを付与・剥奪します。
            </Text>
          </Stack>
          <Group gap="sm">
            <StaffRoleBadge role={administrator.role} />
            <Button onClick={onRetry} variant="light">
              権限を再確認
            </Button>
          </Group>
        </Group>
      </Stack>
      <Paper component="section" p="lg" radius="md" withBorder>
        {roleManagement}
      </Paper>
    </Stack>
  </Container>
);
