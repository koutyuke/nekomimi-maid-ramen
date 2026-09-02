import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <h1 className="p-4 text-2xl font-bold">猫耳メイドラーメン</h1>;
}
