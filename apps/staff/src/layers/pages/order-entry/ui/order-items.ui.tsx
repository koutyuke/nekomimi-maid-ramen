import { Alert, Badge, Button, Group, Paper, Stack, Text, Title } from "@mantine/core";

import { yen } from "../lib/format-yen";
import type { MenuItem } from "../../../entities/menu";
import type { DraftLine } from "../model/checkout";

type OrderItemsUIProps = {
  items: readonly MenuItem[];
  lines: readonly DraftLine[];
  menuLoading: boolean;
  menuFailed: boolean;
  locked: boolean;
  actions: {
    onRetry: () => void;
    onStep: (item: MenuItem, delta: -1 | 1) => void;
  };
};

export const OrderItemsUI = ({ items, lines, menuLoading, menuFailed, locked, actions }: OrderItemsUIProps) => {
  // 商品が一覧から消えても、選択済みの行を残して数量を減らせるようにする。
  const displayedItems = [
    ...items,
    ...lines
      .filter((line) => !items.some((item) => item.id === line.item.id))
      .map((line) => Object.assign({}, line.item, { sellable: false })),
  ];

  return (
    <>
      <Group justify="space-between">
        <Title order={2} size="h3">
          商品と個数
        </Title>
        <Button variant="light" disabled={locked} onClick={actions.onRetry}>
          商品情報を更新
        </Button>
      </Group>
      {menuLoading ? <Text>商品を読み込んでいます</Text> : null}
      {menuFailed ? (
        <Alert color="red" role="alert">
          商品情報を取得できません。再読み込みしてから確定してください。
        </Alert>
      ) : null}
      {!menuLoading && !menuFailed && items.length === 0 ? <Text>販売中の商品はありません。</Text> : null}
      {displayedItems.map((item) => {
        const line = lines.find((candidate) => candidate.item.id === item.id);
        const quantity = Number(line?.quantity ?? 0);
        return (
          <Paper
            key={item.id}
            withBorder
            p="md"
            bg={quantity > 0 ? "var(--mantine-color-blue-light)" : "var(--mantine-color-body)"}
          >
            <Stack gap="xs">
              <Group justify="space-between">
                <Text fw={600}>
                  {item.name} · {yen(line?.item.price ?? item.price)}
                </Text>
                <Badge color={item.sellable ? "green" : "gray"}>{item.sellable ? "販売中" : "売り切れ"}</Badge>
              </Group>
              <Group justify="space-between" wrap="nowrap">
                <Button
                  size="lg"
                  variant="default"
                  aria-label={`${item.name}を1個減らす`}
                  disabled={locked || quantity === 0}
                  onClick={() => actions.onStep(item, -1)}
                >
                  −
                </Button>
                <Text aria-label={`${item.name}の選択数`} aria-live="polite" fw={700} fz={28}>
                  {quantity}
                  <Text component="span" size="sm" c="dimmed">
                    {" "}
                    / 最大10個
                  </Text>
                </Text>
                <Button
                  size="lg"
                  aria-label={`${item.name}を1個増やす`}
                  disabled={locked || menuFailed || !item.sellable || quantity >= 10}
                  onClick={() => actions.onStep(item, 1)}
                >
                  ＋
                </Button>
              </Group>
              {quantity > 0 ? <Text ta="right">小計：{yen((line?.item.price ?? item.price) * quantity)}</Text> : null}
            </Stack>
          </Paper>
        );
      })}
    </>
  );
};
