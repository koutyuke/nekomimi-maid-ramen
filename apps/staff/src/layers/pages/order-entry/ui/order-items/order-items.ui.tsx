import { Badge, Box, Button, Group, Paper, Stack, Text } from "@mantine/core";
import { Minus, Plus } from "lucide-react";

import { yen } from "../../lib/format-yen";
import type { MenuItem } from "../../../../entities/menu";
import type { DraftLine } from "../../lib/checkout";

type OrderItemsUIProps = {
  disabled: boolean;
  canIncrease: boolean;
  items: readonly MenuItem[];
  lines: readonly DraftLine[];
  onChangeQuantity: (item: MenuItem, delta: -1 | 1) => void;
};

export const OrderItemsUI = ({ items, lines, disabled, canIncrease, onChangeQuantity }: OrderItemsUIProps) => {
  // 商品が一覧から消えても、選択済みの行を残して数量を減らせるようにする。
  const displayedItems = [
    ...items,
    ...lines
      .filter((line) => !items.some((item) => item.id === line.item.id))
      .map((line) => Object.assign({}, line.item, { sellable: false, quantity: 0 })),
  ];

  return (
    <Stack>
      {displayedItems.map((item) => {
        const line = lines.find((candidate) => candidate.item.id === item.id);
        const quantity = Number(line?.quantity ?? 0);
        return (
          <Paper
            key={item.id}
            withBorder
            p="md"
            bg={
              quantity > item.quantity
                ? "var(--mantine-color-red-light)"
                : quantity > 0
                  ? "var(--mantine-color-blue-light)"
                  : "var(--mantine-color-body)"
            }
          >
            <Stack gap="xs">
              <Group justify="space-between">
                <Text fw={600} size="lg">
                  {item.name} · {yen(line?.item.price ?? item.price)}
                </Text>
                <Badge color={item.sellable ? "green" : "gray"}>{item.sellable ? "販売中" : "売り切れ"}</Badge>
              </Group>
              <Group justify="space-between" wrap="nowrap">
                <Button
                  size="lg"
                  variant="default"
                  aria-label={`${item.name}を1個減らす`}
                  disabled={disabled || quantity === 0}
                  onClick={() => onChangeQuantity(item, -1)}
                  h={48}
                  w={72}
                  p={0}
                >
                  <Minus />
                </Button>
                <Box pos="relative">
                  <Text aria-label={`${item.name}の選択数`} aria-live="polite" fw={700} fz={28}>
                    {quantity}
                  </Text>
                  <Box
                    pos="absolute"
                    right={"-0.25rem"}
                    bottom={"0.25rem"}
                    w={60}
                    style={{
                      translate: "100%",
                    }}
                  >
                    <Text component="span" size="sm" c="dimmed">
                      / {Math.min(10, item.quantity)}({item.quantity})
                    </Text>
                  </Box>
                </Box>
                <Button
                  size="lg"
                  aria-label={`${item.name}を1個増やす`}
                  disabled={disabled || !canIncrease || !item.sellable || quantity >= Math.min(10, item.quantity)}
                  onClick={() => onChangeQuantity(item, 1)}
                  h={48}
                  w={72}
                  p={0}
                >
                  <Plus />
                </Button>
              </Group>
              {quantity > 0 && <Text ta="right">小計：{yen((line?.item.price ?? item.price) * quantity)}</Text>}
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
};
