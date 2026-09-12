import { Badge, Button, Group, Modal, Paper, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";

import { handoffStatusLabels } from "../../lib/handoff-status";
import { HandoffOrderLineUI } from "../handoff-order-line/handoff-order-line.ui";
import type { HandoffOrder, HandoffOrderLine } from "../../../../entities/handoff";
import type { CookingState } from "../../../../entities/kitchen";
import type { HandoffStatus } from "../../lib/handoff-status";

const statusColors = {
  ready: "pink",
  drinkPending: "blue",
  preparing: "blue",
  completed: "green",
} as const;

type HandoffOrderCardUIProps = {
  order: HandoffOrder;
  status: HandoffStatus;
  disabled: boolean;
  pendingItemIds: readonly string[];
  actions: {
    onUpdate: (line: HandoffOrderLine, to: CookingState) => void;
    onComplete: () => void;
  };
};

export const HandoffOrderCardUI = ({
  order,
  status,
  disabled,
  pendingItemIds,
  actions: { onUpdate, onComplete },
}: HandoffOrderCardUIProps) => {
  const [opened, setOpened] = useState(false);

  const canComplete = status === "ready" && !order.handedOffAt && !order.cancelledAt;
  if (opened && !canComplete) {
    setOpened(false);
  }

  return (
    <Paper component="article" aria-label={`注文${order.orderNumber}`} withBorder p="md" radius="md">
      {canComplete && (
        <Modal
          opened={opened}
          onClose={() => setOpened(false)}
          title="受け渡しを完了してよいですか？"
          centered
          closeButtonProps={{ "aria-label": "確認を閉じる" }}
        >
          <Stack>
            <Text fw={700}>注文{order.orderNumber}</Text>
            {order.lines.map((line) => (
              <Text key={line.menuItemId}>
                {line.name} × {line.quantity}個
              </Text>
            ))}
            <Text>紙の注文番号と商品を照合し、すべての商品を渡したことを確認してください。</Text>
            <Text>受け渡しを完了すると、未受け渡しには戻せません。</Text>
            <Button
              mih={44}
              disabled={disabled || pendingItemIds.length > 0 || !opened}
              onClick={() => {
                if (disabled || pendingItemIds.length > 0 || !opened) {
                  return;
                }
                setOpened(false);
                onComplete();
              }}
            >
              はい、受け渡しを完了する
            </Button>
            <Button variant="default" mih={44} data-autofocus onClick={() => setOpened(false)}>
              キャンセル
            </Button>
          </Stack>
        </Modal>
      )}
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
              disabled={disabled || pendingItemIds.includes(line.menuItemId)}
              actions={{ onUpdate: (to) => onUpdate(line, to) }}
            />
          ))}
        </Stack>
        {status === "completed" ? <Text fw={700}>受け渡し済みです。</Text> : null}
        {canComplete ? (
          <Button
            mih={44}
            disabled={disabled || pendingItemIds.length > 0}
            aria-label={`注文${order.orderNumber}を受け渡し済みにする`}
            onClick={() => setOpened(true)}
          >
            受け渡し済みにする
          </Button>
        ) : null}
      </Stack>
    </Paper>
  );
};
