import { Badge, Button, Group, Modal, Paper, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";

import { CookingStateControlUI } from "../../../../features/cooking-state";
import { handoffStatusLabels } from "../../lib/handoff-status";
import type { Order, CookingState } from "../../../../entities/orders";
import type { HandoffStatus } from "../../lib/handoff-status";

const statusColors = {
  ready: "pink",
  drinkPending: "blue",
  preparing: "blue",
  completed: "green",
} as const;

type HandoffOrderCardUIProps = {
  order: Order;
  status: HandoffStatus;
  disabled: boolean;
  pendingItemIds: readonly string[];
  onUpdate: (menuItemId: string, to: CookingState) => void;
  onComplete: () => void;
};

export const HandoffOrderCardUI = ({
  order,
  status,
  disabled,
  pendingItemIds,
  onUpdate,
  onComplete,
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
            <CookingStateControlUI
              key={line.menuItemId}
              line={line}
              orderNumber={order.orderNumber}
              editable={!order.handedOffAt && line.category === "drink"}
              disabled={disabled || pendingItemIds.includes(line.menuItemId)}
              onUpdate={(to) => onUpdate(line.menuItemId, to)}
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
