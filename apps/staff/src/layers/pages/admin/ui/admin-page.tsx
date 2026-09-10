import { Alert, Anchor, Button, Container, Group, Loader, Paper, Stack, Text, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { staffQueries, StaffRoleBadge } from "../../../entities/staff";
import { StaffRoleManagement } from "../../../features/staff-role-management";

export const AdminPage = () => {
  const staff = useQuery(staffQueries.current());
  const administrator =
    staff.data?.role === "Owner" || staff.data?.role === "Admin" ? { id: staff.data.id, role: staff.data.role } : null;
  const retry = () => void staff.refetch();

  return (
    <Container py="xl" size="lg">
      <Stack gap="xl">
        <Stack gap={4}>
          <Anchor c="dimmed" component={Link} size="sm" to="/" w="fit-content">
            ← スタッフページへ戻る
          </Anchor>
          <Group align="flex-end" gap="sm" justify="space-between">
            <Stack gap={4}>
              <Title order={1}>管理</Title>
              <Text c="dimmed" size="sm">
                スタッフや商品の管理ページ
              </Text>
            </Stack>
            {administrator ? (
              <Group gap="sm">
                <StaffRoleBadge role={administrator.role} />
                <Button onClick={retry} variant="light">
                  権限を再確認
                </Button>
              </Group>
            ) : null}
          </Group>
        </Stack>

        {staff.isPending ? (
          <Paper p="xl" radius="md" withBorder>
            <Group gap="sm" justify="center">
              <Loader size="sm" />
              <Text c="dimmed">権限を確認しています</Text>
            </Group>
          </Paper>
        ) : null}

        {staff.isError ? (
          <Alert color="red" role="alert" title="権限を確認できません" variant="light">
            {/* 失敗の原因はスタッフの判断に使えないため、次の行動だけを伝える。 */}
            <Stack align="flex-start" gap="sm">
              <Text size="sm">通信状況を確認して、もう一度お試しください。</Text>
              <Button onClick={retry} variant="default">
                再読み込み
              </Button>
            </Stack>
          </Alert>
        ) : null}

        {!staff.isPending && !staff.isError && !administrator ? (
          <Alert color="yellow" role="alert" title="権限がありません" variant="light">
            <Stack align="flex-start" gap="sm">
              <Text size="sm">管理ページを閲覧する権限がありません。</Text>
              <Button component={Link} to="/" variant="default">
                スタッフページへ戻る
              </Button>
            </Stack>
          </Alert>
        ) : null}

        {administrator ? (
          <Paper component="section" p="lg" radius="md" withBorder>
            <StaffRoleManagement currentStaff={administrator} />
          </Paper>
        ) : null}
      </Stack>
    </Container>
  );
};
