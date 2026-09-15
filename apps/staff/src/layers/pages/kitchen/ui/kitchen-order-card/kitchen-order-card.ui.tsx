import { Badge, Group, Paper, Stack, Text, Title } from "@mantine/core";

import { CookingStateControlUI } from "../../../../features/cooking-state";
import { kitchenStatusLabels } from "../../lib/kitchen-status";
import type { CookingState, Order, OrderLine } from "../../../../entities/orders";

type KitchenOrderCardUIProps = {
  order: Order;
  lines: readonly OrderLine[];
  status: CookingState;
  disabled: boolean;
  pendingItemIds: readonly string[];
  onUpdate: (menuItemId: string, to: CookingState) => void;
};

export const KitchenOrderCardUI = ({
  order,
  lines,
  status,
  disabled,
  pendingItemIds,
  onUpdate,
}: KitchenOrderCardUIProps) => (
  <Paper component="article" aria-label={`注文${order.orderNumber}`} withBorder p="md" radius="md">
    <Stack>
      <Group justify="space-between">
        <Title order={2}>注文{order.orderNumber}</Title>
        <Badge size="lg" fz="md" color={status === "completed" ? "green" : status === "cooking" ? "blue" : "gray"}>
          {kitchenStatusLabels[status]}
        </Badge>
      </Group>
      <Stack gap="xs">
        {lines.map((line) => (
          <CookingStateControlUI
            key={line.menuItemId}
            line={line}
            orderNumber={order.orderNumber}
            editable={!order.handedOffAt}
            disabled={disabled || pendingItemIds.includes(line.menuItemId)}
            onUpdate={(to) => onUpdate(line.menuItemId, to)}
          />
        ))}
      </Stack>
      {order.handedOffAt ? <Text>受け渡し済みです</Text> : null}
    </Stack>
  </Paper>
);
