import { Button, Container, Stack, Text } from "@mantine/core";

import { ErrorAlert } from "../../../../shared/ui";

type AuthErrorUIProps = {
  onRetry: () => void;
};

export const AuthErrorUI = ({ onRetry }: AuthErrorUIProps) => (
  <Container py="xl" size="md">
    <ErrorAlert title="ログイン状態を確認できません">
      <Stack align="flex-start">
        <Text>通信状況を確認して、もう一度お試しください。</Text>
        <Button onClick={onRetry}>再読み込み</Button>
      </Stack>
    </ErrorAlert>
  </Container>
);
