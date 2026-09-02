import { Container, Stack, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <Container size="sm" py="md">
      <Stack>
        <Title order={1}>猫耳メイドラーメン</Title>
      </Stack>
    </Container>
  );
}
