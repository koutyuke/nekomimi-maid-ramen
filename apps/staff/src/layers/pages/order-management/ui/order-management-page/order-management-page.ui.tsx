import {
  Alert,
  Anchor,
  Button,
  Container,
  Flex,
  Group,
  Loader,
  Modal,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { orderCancellationReason } from "../../../../entities/orders";
import type { OrderSummary } from "../../../../entities/orders";

export type OrderManagementPageUIProps = {
  access: "loading" | "error" | "allowed" | "denied";
  businessDate: string;
  connected: boolean;
  orders: readonly OrderSummary[];
  loading: boolean;
  failed: boolean;
  pending: boolean;
  error: string | null;
  cancelledOrderNumber: number | null;
  actions: {
    onBusinessDateChange: (value: string) => void;
    onCancel: (order: OrderSummary) => void;
    onRetry: () => void;
  };
};
const cookingLabels = { unstarted: "未調理", cooking: "調理中", completed: "完成" } as const;
const PAGE_SIZE = 20;

export const OrderManagementPageUI = ({
  access,
  businessDate,
  connected,
  orders,
  loading,
  failed,
  pending,
  error,
  cancelledOrderNumber,
  actions,
}: OrderManagementPageUIProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [previousDate, setPreviousDate] = useState(businessDate);
  const sorted = orders.toSorted((left, right) => right.orderNumber - left.orderNumber);
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const selected = orders.find((order) => order.id === selectedId && !orderCancellationReason(order));
  const disabled = access !== "allowed" || loading || failed || pending;
  if (previousDate !== businessDate) {
    setPreviousDate(businessDate);
    setPage(1);
    setSelectedId(null);
  } else if (page > pageCount && !loading && !failed) {
    setPage(pageCount);
  }
  if (selectedId && (!selected || access !== "allowed")) {
    setSelectedId(null);
  }

  return (
    <Container size="md" py="lg">
      <Stack>
        <Anchor component={Link} to="/">
          ← スタッフページへ戻る
        </Anchor>
        <Group justify="space-between" wrap="nowrap" mih={44}>
          <Title order={1}>注文管理</Title>
          <Flex gap={4} align="center" style={{ visibility: connected ? "hidden" : "visible" }} aria-hidden={connected}>
            <Loader size="xs" />
            <Text size="md" fw={500}>
              接続中
            </Text>
          </Flex>
        </Group>

        {access === "loading" ? <Text component="output">権限を確認しています</Text> : null}
        {access === "error" ? (
          <Alert color="red" role="alert">
            権限を確認できません。<Button onClick={actions.onRetry}>再読み込み</Button>
          </Alert>
        ) : null}
        {access === "denied" ? (
          <Alert color="yellow" role="alert">
            注文管理にはスタッフ権限が必要です。
          </Alert>
        ) : null}

        {access === "allowed" ? (
          <>
            <Group align="end" justify="space-between">
              <TextInput
                type="date"
                label="営業日"
                value={businessDate}
                disabled={pending}
                onChange={(event) => {
                  if (event.currentTarget.value) {
                    setSelectedId(null);
                    setPage(1);
                    actions.onBusinessDateChange(event.currentTarget.value);
                  }
                }}
              />
              <Button variant="light" disabled={pending} onClick={actions.onRetry} mih={44}>
                再読み込み
              </Button>
            </Group>
            {loading ? <Text component="output">注文を読み込んでいます</Text> : null}
            {failed ? (
              <Alert color="red" role="alert">
                最新の注文を取得できません。権限と通信状況を確認して再読み込みしてください。
              </Alert>
            ) : null}
            {error ? (
              <Alert color="red" role="alert">
                {error}
              </Alert>
            ) : null}
            {cancelledOrderNumber !== null ? (
              <Text component="output">注文{cancelledOrderNumber}を取り消し、在庫を戻しました。</Text>
            ) : null}
            {!loading && !failed && orders.length === 0 ? <Text>表示する注文はありません。</Text> : null}

            <Table.ScrollContainer minWidth={640}>
              <Table verticalSpacing="sm" horizontalSpacing="xs" style={{ tableLayout: "fixed" }} aria-label="注文一覧">
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
                            {reason ?? cookingLabels[order.cookingState]}
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
                            disabled={disabled || !!reason}
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
                    disabled={disabled}
                    onClick={() => {
                      if (disabled) {
                        return;
                      }
                      setSelectedId(null);
                      actions.onCancel(selected);
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
          </>
        ) : null}
      </Stack>
    </Container>
  );
};
