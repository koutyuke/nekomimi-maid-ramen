import { Paper, Stack, Group, Avatar, Flex, Alert, Text } from "@mantine/core";

import { StaffRoleBadge } from "./staff-role-badge";
import type { Staff } from "../model/staff";

type StaffAccountCardProps = {
  name: Staff["name"];
  email: Staff["email"];
  role: Staff["role"];
};

export const StaffAccountCard = ({ name, email, role }: StaffAccountCardProps) => (
  <Paper aria-label="ログイン中のスタッフ" component="section" p="lg" radius="md" withBorder>
    <Stack gap="md">
      <Group gap="md" wrap="nowrap">
        <Avatar color="initials" name={name} radius="xl" size="lg" />
        <Stack flex="1" gap={4} miw={0}>
          <Group gap="xs">
            <Flex gap={4} align="end">
              <Text fw={600}>{name}</Text>
              <Text fw={600} c="gray" size="sm">
                さん
              </Text>
            </Flex>
            <StaffRoleBadge role={role} />
          </Group>

          <Text c="dimmed" size="sm" style={{ overflowWrap: "anywhere" }}>
            {email}
          </Text>
        </Stack>
      </Group>

      {role === "None" && (
        <Alert color="yellow" variant="light">
          業務操作の権限がありません。管理者に権限の付与を依頼してください。
        </Alert>
      )}
    </Stack>
  </Paper>
);
