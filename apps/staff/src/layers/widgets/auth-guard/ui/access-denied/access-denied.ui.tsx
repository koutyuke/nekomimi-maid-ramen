import { Alert, Button, Container, Stack, Text } from "@mantine/core";
// eslint-disable-next-line staff-fsd/presenter-dependencies -- 宣言的なリンクは表示の一部としてこの部品で扱う。
import { Link } from "@tanstack/react-router";

export const AccessDeniedUI = () => (
  <Container py="xl">
    <Alert color="yellow" role="alert" title="権限がありません">
      <Stack align="flex-start">
        <Text>このページを閲覧する権限がありません。</Text>
        <Button component={Link} to="/" variant="default">
          トップページへ戻る
        </Button>
      </Stack>
    </Alert>
  </Container>
);
