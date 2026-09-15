import { Alert, Button, Container, Stack, Text } from "@mantine/core";
import { Link } from "@tanstack/react-router";

export const AccessDeniedUI = () => (
  <Container py="xl" size="md">
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
