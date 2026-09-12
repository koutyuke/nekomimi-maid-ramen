import { Badge, Group, Paper, Stack, Text, Title } from "@mantine/core";

import { kitchenStatusLabels } from "../../lib/kitchen-status";
import { KitchenOrderLineUI } from "../kitchen-order-line/kitchen-order-line.ui";
import type { CookingState, KitchenOrder, KitchenOrderLine } from "../../../../entities/kitchen";

type KitchenOrderCardUIProps = {
  order: KitchenOrder;
  lines: readonly KitchenOrderLine[];
  status: CookingState;
  disabled: boolean;
  pendingItemIds: readonly string[];
  actions: { onUpdate: (line: KitchenOrderLine, to: CookingState) => void };
};

export const KitchenOrderCardUI = ({
  order,
  lines,
  status,
  disabled,
  pendingItemIds,
  actions: { onUpdate },
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
          <KitchenOrderLineUI
            key={line.menuItemId}
            line={line}
            orderNumber={order.orderNumber}
            editable={!order.handedOffAt}
            disabled={disabled || pendingItemIds.includes(line.menuItemId)}
            actions={{ onUpdate: (to) => onUpdate(line, to) }}
          />
        ))}
      </Stack>
      {order.handedOffAt ? <Text>受け渡し済みです</Text> : null}
    </Stack>
  </Paper>
);
