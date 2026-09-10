import {
  Alert,
  Avatar,
  Button,
  Container,
  Divider,
  Group,
  Loader,
  NavLink,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Link } from "@tanstack/react-router";

import { StaffRoleBadge } from "../../../entities/staff";
import { getSiteBaseURL } from "@nekomimi/core/http";
import type { Staff, StaffRole } from "../../../entities/staff";

export type StaffPageUIProps = {
  staff: Pick<Staff, "name" | "email" | "role"> | null;
  loading: boolean;
  failed: boolean;
  actionFailed: boolean;
  busy: boolean;
  loginFailed: boolean;
  actions: { onSignIn: () => void; onSignOut: () => void; onRetry: () => void };
};

type Navigation = {
  href: string;
  label: string;
  description: string;
  // 省略した場合はロールを問わず表示する。
  roles?: readonly StaffRole[];
};

// 導線は実装済みのページだけを載せる。ページを増やしたらここへ追加する。
const staffNavigations: readonly Navigation[] = [
  {
    href: "/sales",
    label: "注文・会計",
    description: "商品と個数を入力し、会計を終えて注文を確定する",
    roles: ["Owner", "Admin", "Staff"],
  },
  {
    href: "/admin",
    label: "管理ページ",
    description: "スタッフや商品の管理ページ",
    roles: ["Owner", "Admin"],
  },
];

const publicNavigations: readonly Navigation[] = [
  {
    href: new URL("/menu", getSiteBaseURL(import.meta.env.PROD)).href,
    label: "公開メニュー",
    description: "来場者に見えているメニューを確認する",
  },
];

const NavigationSection = ({
  title,
  navigations,
  role,
}: {
  title: string;
  navigations: readonly Navigation[];
  role: StaffRole;
}) => {
  const visible = navigations.filter((navigation) => navigation.roles?.includes(role) ?? true);
  return visible.length === 0 ? null : (
    <Stack gap="sm">
      <Title order={2} size="h4">
        {title}
      </Title>
      <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
        {visible.map((navigation) => (
          <Paper key={navigation.href} radius="md" style={{ overflow: "hidden" }} withBorder>
            <NavLink
              aria-label={navigation.label}
              component={Link}
              description={navigation.description}
              h="100%"
              label={navigation.label}
              p="md"
              to={navigation.href}
              rightSection={
                <Text aria-hidden c="dimmed">
                  →
                </Text>
              }
            />
          </Paper>
        ))}
      </SimpleGrid>
    </Stack>
  );
};

export const StaffPageUI = ({ staff, loading, failed, actionFailed, busy, loginFailed, actions }: StaffPageUIProps) => (
  <Container py="xl" size="sm">
    <Stack gap="xl">
      <Stack gap={4}>
        <Title order={1}>スタッフ</Title>
        <Text c="dimmed" size="sm">
          猫耳メイドラーメンの運営用ページ
        </Text>
      </Stack>

      {loading ? (
        <Paper p="xl" radius="md" withBorder>
          <Group gap="sm" justify="center">
            <Loader size="sm" />
            <Text c="dimmed">ログイン状態を確認しています</Text>
          </Group>
        </Paper>
      ) : null}

      {failed ? (
        <Alert color="red" role="alert" title="ログイン状態を確認できません" variant="light">
          {/* 失敗の原因はスタッフの判断に使えないため、次の行動だけを伝える。 */}
          <Stack align="flex-start" gap="sm">
            <Text size="sm">通信状況を確認して、もう一度お試しください。</Text>
            <Button onClick={actions.onRetry} variant="default">
              再読み込み
            </Button>
          </Stack>
        </Alert>
      ) : null}

      {loginFailed && !staff ? (
        <Alert color="yellow" role="alert" title="ログインできませんでした" variant="light">
          学校のGoogleアカウントを選び、もう一度お試しください。
        </Alert>
      ) : null}

      {actionFailed ? (
        <Alert color="red" role="alert" title="操作を完了できませんでした" variant="light">
          通信状況を確認して、もう一度お試しください。
        </Alert>
      ) : null}

      {!loading && !failed && !staff ? (
        <Paper p="xl" radius="md" withBorder>
          <Stack align="center" gap="md">
            <Text aria-hidden fz={40} lh={1}>
              🐾
            </Text>
            <Stack align="center" gap={4}>
              <Text fw={600}>ログインが必要です</Text>
              <Text c="dimmed" size="sm" ta="center">
                学校のGoogleアカウントでログインしてください。
              </Text>
            </Stack>
            <Button fullWidth loading={busy} onClick={actions.onSignIn}>
              Googleでログイン
            </Button>
          </Stack>
        </Paper>
      ) : null}

      {!loading && !failed && staff ? (
        <>
          <Paper aria-label="ログイン中のスタッフ" component="section" p="lg" radius="md" withBorder>
            <Stack gap="md">
              <Group gap="md" wrap="nowrap">
                <Avatar color="initials" name={staff.name} radius="xl" size="lg" />
                <Stack flex="1" gap={4} miw={0}>
                  <Group gap="xs">
                    <Text fw={600}>{staff.name}さん</Text>
                    <StaffRoleBadge role={staff.role} />
                  </Group>
                  <Text c="dimmed" size="sm" truncate>
                    {staff.email}
                  </Text>
                </Stack>
              </Group>
              {staff.role === "None" ? (
                <Alert color="yellow" variant="light">
                  業務操作の権限がありません。管理者に権限の付与を依頼してください。
                </Alert>
              ) : null}
              <Divider />
              <Group gap="sm" grow>
                <Button onClick={actions.onRetry} variant="light">
                  権限を再確認
                </Button>
                <Button loading={busy} onClick={actions.onSignOut} variant="filled" color="red">
                  ログアウト
                </Button>
              </Group>
            </Stack>
          </Paper>

          <NavigationSection navigations={staffNavigations} role={staff.role} title="スタッフページ" />
          <NavigationSection navigations={publicNavigations} role={staff.role} title="一般ページ" />
        </>
      ) : null}
    </Stack>
  </Container>
);
