import { Alert, Button, Container, Paper, Stack, Text } from "@mantine/core";

type LoginPromptUIProps = {
  busy: boolean;
  loginFailed: boolean;
  onLogin: () => void;
};

export const LoginPromptUI = ({ busy, loginFailed, onLogin }: LoginPromptUIProps) => (
  <Container py="xl" size="md">
    <Stack>
      {loginFailed && (
        <Alert color="yellow" role="alert" title="ログインできませんでした" variant="light">
          学校のGoogleアカウントを選び、もう一度お試しください。
        </Alert>
      )}
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
          <Button fullWidth loading={busy} onClick={onLogin}>
            Googleでログイン
          </Button>
        </Stack>
      </Paper>
    </Stack>
  </Container>
);
