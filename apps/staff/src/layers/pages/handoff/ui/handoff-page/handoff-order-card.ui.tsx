import { Badge, Button, Group, Paper, Stack, Text, Title } from "@mantine/core";

import { handoffStatusLabels } from "../../lib/handoff-status";
import { HandoffOrderLineUI } from "./handoff-order-line.ui";
import type { HandoffOrder, HandoffOrderLine } from "../../../../entities/handoff";
import type { CookingState } from "../../../../entities/kitchen";
import type { HandoffStatus } from "../../lib/handoff-status";

const statusColors = { ready: "green", drinkPending: "orange", preparing: "orange", completed: "gray" } as const;

type HandoffOrderCardUIProps = {
  order: HandoffOrder;
  status: HandoffStatus;
  disabled: boolean;
  actions: {
    onUpdate: (line: HandoffOrderLine, to: CookingState) => void;
    onComplete: () => void;
  };
};

export const HandoffOrderCardUI = ({
  order,
  status,
  disabled,
  actions: { onUpdate, onComplete },
}: HandoffOrderCardUIProps) => (
  <Paper component="article" aria-label={`注文${order.orderNumber}`} withBorder p="md" radius="md">
    <Stack>
      <Group justify="space-between">
        <Title order={2}>注文{order.orderNumber}</Title>
        <Badge size="lg" fz="md" color={statusColors[status]}>
          {handoffStatusLabels[status]}
        </Badge>
      </Group>
      <Stack gap="xs">
        {order.lines.map((line) => (
          <HandoffOrderLineUI
            key={line.menuItemId}
            line={line}
            orderNumber={order.orderNumber}
            editable={!order.handedOffAt && line.category === "drink"}
            disabled={disabled}
            actions={{ onUpdate: (to) => onUpdate(line, to) }}
          />
        ))}
      </Stack>
      {status === "completed" ? <Text fw={700}>受け渡し済みです。</Text> : null}
      {status === "ready" ? (
        <Button
          mih={44}
          disabled={disabled}
          aria-label={`注文${order.orderNumber}を受け渡し済みにする`}
          onClick={onComplete}
        >
          受け渡し済みにする
        </Button>
      ) : null}
    </Stack>
  </Paper>
);
