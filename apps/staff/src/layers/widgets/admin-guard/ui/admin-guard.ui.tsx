import { Alert, Button, Container, Stack, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export type AdminGuardUIProps = {
  access: "loading" | "error" | "allowed" | "denied";
  onRetry: () => void;
  children: ReactNode;
};

export const AdminGuardUI = ({ access, onRetry, children }: AdminGuardUIProps) => {
  if (access === "loading") {
    return (
      <Container py="xl">
        <Text component="output">権限を確認しています</Text>
      </Container>
    );
  }
  if (access === "error") {
    return (
      <Container py="xl">
        <Alert color="red" role="alert" title="権限を確認できません">
          <Stack align="flex-start">
            <Text>通信状況を確認して、もう一度お試しください。</Text>
            <Button onClick={onRetry} variant="default">
              再読み込み
            </Button>
          </Stack>
        </Alert>
      </Container>
    );
  }
  if (access === "denied") {
    return (
      <Container py="xl">
        <Alert color="yellow" role="alert" title="権限がありません">
          <Stack align="flex-start">
            <Text>管理者ページを閲覧する権限がありません。</Text>
            <Button component={Link} to="/" variant="default">
              スタッフページへ戻る
            </Button>
          </Stack>
        </Alert>
      </Container>
    );
  }

  return children;
};
