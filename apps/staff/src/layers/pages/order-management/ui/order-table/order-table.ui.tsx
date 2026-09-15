import { Button, Group, Modal, Stack, Table, Text } from "@mantine/core";
import { useState } from "react";

import { cookingStateLabels, orderCancellationReason } from "../../../../entities/orders";
import type { OrderSummary } from "../../../../entities/orders";

export type OrderTableUIProps = {
  orders: readonly OrderSummary[] | undefined;
  disabled: boolean;
  pending: boolean;
  onCancel: (orderId: string) => void;
};

const PAGE_SIZE = 20;

export const OrderTableUI = ({ orders, disabled, pending, onCancel }: OrderTableUIProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const sorted = (orders ?? []).toSorted((left, right) => right.orderNumber - left.orderNumber);
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const selected = orders?.find((order) => order.id === selectedId && !orderCancellationReason(order));
  const cancellationDisabled = disabled || pending;
  if (page > pageCount && !disabled) {
    setPage(pageCount);
  }
  if (selectedId && !selected) {
    setSelectedId(null);
  }

  return (
    <Stack>
      <Table.ScrollContainer minWidth={640}>
        <Table
          verticalSpacing="sm"
          horizontalSpacing="xs"
          style={{ tableLayout: "fixed" }}
          aria-label="注文一覧"
          withTableBorder
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th w="15%">注文</Table.Th>
              <Table.Th w="35%">商品・個数</Table.Th>
              <Table.Th w="25%">状態</Table.Th>
              <Table.Th w="25%">操作</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((order) => {
              const reason = orderCancellationReason(order);
              return (
                <Table.Tr key={order.id}>
                  <Table.Td>
                    <Text fw={700}>{order.orderNumber}</Text>
                  </Table.Td>
                  <Table.Td>
                    {order.lines.map((line) => (
                      <Text size="sm" key={line.menuItemId}>
                        {line.name} × {line.quantity}個
                      </Text>
                    ))}
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" id={`order-reason-${order.id}`}>
                      {reason ?? cookingStateLabels[order.cookingState]}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Button
                      color="red"
                      variant="light"
                      size="compact-sm"
                      mih={44}
                      fullWidth
                      px={4}
                      disabled={cancellationDisabled || !!reason}
                      aria-label={`注文${order.orderNumber}を取り消す`}
                      aria-describedby={`order-reason-${order.id}`}
                      onClick={() => setSelectedId(order.id)}
                    >
                      取り消す
                    </Button>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      {pageCount > 1 ? (
        <Group justify="center" gap="xs" wrap="nowrap">
          <Button
            variant="default"
            size="compact-sm"
            mih={44}
            disabled={pending || page === 1}
            onClick={() => setPage(page - 1)}
          >
            前の20件
          </Button>
          <Text size="sm">
            {page} / {pageCount} ページ
          </Text>
          <Button
            variant="default"
            size="compact-sm"
            mih={44}
            disabled={pending || page === pageCount}
            onClick={() => setPage(page + 1)}
          >
            次の20件
          </Button>
        </Group>
      ) : null}

      <Modal
        opened={!!selected}
        onClose={() => setSelectedId(null)}
        title="注文を取り消してよいですか？"
        centered
        closeButtonProps={{ "aria-label": "確認を閉じる" }}
      >
        {selected ? (
          <Stack>
            <Text fw={700}>
              {selected.businessDate} / 注文{selected.orderNumber}
            </Text>
            {selected.lines.map((line) => (
              <Text key={line.menuItemId}>
                {line.name} × {line.quantity}個
              </Text>
            ))}
            <Text>すべての商品の在庫を戻します。取り消した注文は元に戻せません。</Text>
            <Button
              color="red"
              mih={44}
              disabled={cancellationDisabled}
              onClick={() => {
                if (cancellationDisabled) {
                  return;
                }
                setSelectedId(null);
                onCancel(selected.id);
              }}
            >
              はい、取り消す
            </Button>
            <Button variant="default" mih={44} data-autofocus onClick={() => setSelectedId(null)}>
              キャンセル
            </Button>
          </Stack>
        ) : null}
      </Modal>
    </Stack>
  );
};
