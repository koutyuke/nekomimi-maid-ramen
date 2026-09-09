import { Anchor, Button, Container, Group, Loader, Stack, Text, Title } from "@mantine/core";

export type StaffPageUIProps = {
  staff: { name: string; role: "Owner" | "Admin" | "Staff" | "None" } | null;
  loading: boolean;
  failed: boolean;
  actionFailed: boolean;
  busy: boolean;
  loginFailed: boolean;
  actions: { onSignIn: () => void; onSignOut: () => void; onRetry: () => void };
};

export const StaffPageUI = ({ staff, loading, failed, actionFailed, busy, loginFailed, actions }: StaffPageUIProps) => (
  <Container py="md" size="sm">
    <Stack gap="lg">
      <Title order={1}>スタッフ</Title>
      {loading ? (
        <Group gap="xs">
          <Loader size="sm" />
          <Text>ログイン状態を確認しています</Text>
        </Group>
      ) : null}
      {failed ? (
        <Stack>
          <Text role="alert">ログイン状態を確認できません。通信状況を確認して、もう一度お試しください。</Text>
          <Button onClick={actions.onRetry}>再読み込み</Button>
        </Stack>
      ) : null}
      {loginFailed && !staff ? (
        <Text role="alert">ログインできませんでした。学校のGoogleアカウントを選び、もう一度お試しください。</Text>
      ) : null}
      {actionFailed ? (
        <Text role="alert">操作を完了できませんでした。通信状況を確認して、もう一度お試しください。</Text>
      ) : null}
      {!loading && !failed && !staff ? (
        <Stack>
          <Text>学校のGoogleアカウントでログインしてください。</Text>
          <Button loading={busy} onClick={actions.onSignIn}>
            Googleでログイン
          </Button>
        </Stack>
      ) : null}
      {!loading && !failed && staff ? (
        <Stack>
          <Text>{staff.name}さん</Text>
          {staff.role === "None" ? (
            <Text>業務操作の権限がありません。管理者に権限の付与を依頼してください。</Text>
          ) : (
            <Text>ログイン済みです。ロール: {staff.role}</Text>
          )}
          <Button onClick={actions.onRetry} variant="light">
            権限を再確認
          </Button>
          <Button loading={busy} onClick={actions.onSignOut} variant="default">
            ログアウト
          </Button>
        </Stack>
      ) : null}
      <Anchor href="/menu">公開メニューを見る</Anchor>
    </Stack>
  </Container>
);
