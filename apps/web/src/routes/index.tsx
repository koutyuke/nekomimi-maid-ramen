import { Anchor, Container, Stack, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <Container py="md" size="sm">
      <Stack>
        <Title order={1}>猫耳メイドラーメン</Title>
        <Anchor href="/menu">メニューを見る</Anchor>
      </Stack>
    </Container>
  );
}
