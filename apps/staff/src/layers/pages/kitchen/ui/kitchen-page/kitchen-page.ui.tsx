import {
  Alert,
  Anchor,
  Badge,
  Button,
  Checkbox,
  Container,
  Group,
  NativeSelect,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { cookingStateLabels } from "../../../../entities/kitchen";
import type { CookingState, KitchenOrder, KitchenOrderLine } from "../../../../entities/kitchen";

type KitchenFilter = "all" | "main" | "side";

const statusOf = (lines: readonly KitchenOrderLine[]): CookingState => {
  if (lines.every((line) => line.cookingState === "completed")) {
    return "completed";
  }
  if (lines.every((line) => line.cookingState === "unstarted")) {
    return "unstarted";
  }
  return "cooking";
};

const statusLabels = { ...cookingStateLabels, completed: "対応済み" } as const;
const statusRank = { cooking: 0, unstarted: 1, completed: 2 } as const;

export type KitchenPageUIProps = {
  access: "loading" | "error" | "allowed" | "denied";
  orders: readonly KitchenOrder[];
  loading: boolean;
  failed: boolean;
  connected: boolean;
  pending: boolean;
  error: string | null;
  message: string | null;
  actions: { onRetry: () => void; onUpdate: (order: KitchenOrder, line: KitchenOrderLine, to: CookingState) => void };
};

export const KitchenPageUI = ({
  access,
  orders,
  loading,
  failed,
  connected,
  pending,
  error,
  message,
  actions,
}: KitchenPageUIProps) => {
  const [filter, setFilter] = useState<KitchenFilter>("all");
  const [hideHandled, setHideHandled] = useState(true);
  const disabled = loading || failed || !connected || pending;
  const visibleOrders = orders
    .map((order) => {
      const lines = order.lines.filter(
        (line) => line.category !== "drink" && (filter === "all" || line.category === filter),
      );
      return { order, lines, status: statusOf(lines) };
    })
    .filter(({ lines, status }) => lines.length > 0 && (!hideHandled || status !== "completed"))
    .toSorted(
      (left, right) =>
        statusRank[left.status] - statusRank[right.status] || left.order.orderNumber - right.order.orderNumber,
    );

  return (
    <Container size="md" py="lg">
      <Stack>
        <Anchor component={Link} to="/" mih={44} c="blue.8">
          ← スタッフページへ戻る
        </Anchor>
        <Group justify="space-between">
          <Title order={1}>調理</Title>
          <Button variant="default" mih={44} onClick={actions.onRetry}>
            再読み込み
          </Button>
        </Group>
        {access === "loading" ? <Text component="output">権限を確認しています</Text> : null}
        {access === "error" ? (
          <Alert color="red" role="alert">
            権限を確認できません。通信状況を確認して再読み込みしてください。
          </Alert>
        ) : null}
        {access === "denied" ? (
          <Alert color="yellow" role="alert">
            調理画面にはスタッフ権限が必要です。
          </Alert>
        ) : null}
        {access === "allowed" ? (
          <>
            <Text component="output">
              {connected
                ? "注文の変更を自動で反映しています"
                : "自動再接続中です。最新の注文を確認するまで更新できません。"}
            </Text>
            <Group align="end">
              <NativeSelect
                label="表示する商品"
                value={filter}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  if (value === "all" || value === "main" || value === "side") {
                    setFilter(value);
                  }
                }}
                data={[
                  { value: "all", label: "すべて表示（main・サイド）" },
                  { value: "main", label: "main（ラーメン）のみ" },
                  { value: "side", label: "サイドのみ" },
                ]}
              />
              <Checkbox
                label="対応済みを非表示"
                checked={hideHandled}
                onChange={(event) => setHideHandled(event.currentTarget.checked)}
                mih={44}
              />
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
            {message ? <Text component="output">{message}</Text> : null}
            {!loading && !failed && visibleOrders.length === 0 ? <Text>表示する注文はありません。</Text> : null}
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {visibleOrders.map(({ order, lines, status }) => (
                <Paper
                  component="article"
                  aria-label={`注文${order.orderNumber}`}
                  key={order.id}
                  withBorder
                  p="md"
                  radius="md"
                >
                  <Stack>
                    <Group justify="space-between">
                      <Title order={2}>注文{order.orderNumber}</Title>
                      <Badge
                        size="lg"
                        fz="md"
                        c="black"
                        color={status === "completed" ? "green" : status === "cooking" ? "orange" : "gray"}
                      >
                        {statusLabels[status]}
                      </Badge>
                    </Group>
                    <Text>営業日 {order.businessDate}</Text>
                    <Stack gap="xs">
                      {lines.map((line) => (
                        <Paper
                          component="section"
                          aria-label={line.name}
                          key={line.menuItemId}
                          withBorder
                          p="sm"
                          radius="sm"
                        >
                          <Stack gap="xs">
                            <Group justify="space-between">
                              <Text style={{ overflowWrap: "anywhere" }}>
                                {line.name} × {line.quantity}
                              </Text>
                              <Badge
                                color={
                                  line.cookingState === "completed"
                                    ? "green"
                                    : line.cookingState === "cooking"
                                      ? "orange"
                                      : "gray"
                                }
                                c="black"
                              >
                                {cookingStateLabels[line.cookingState]}
                              </Badge>
                            </Group>
                            {!order.handedOffAt && line.cookingState === "unstarted" ? (
                              <Button
                                color="blue.8"
                                mih={44}
                                disabled={disabled}
                                aria-label={`注文${order.orderNumber}の${line.name}の調理を開始`}
                                onClick={() => actions.onUpdate(order, line, "cooking")}
                              >
                                調理を開始
                              </Button>
                            ) : null}
                            {!order.handedOffAt && line.cookingState === "cooking" ? (
                              <Group grow>
                                <Button
                                  color="blue.8"
                                  mih={44}
                                  disabled={disabled}
                                  aria-label={`注文${order.orderNumber}の${line.name}を完成`}
                                  onClick={() => actions.onUpdate(order, line, "completed")}
                                >
                                  完成
                                </Button>
                                <Button
                                  variant="default"
                                  mih={44}
                                  disabled={disabled}
                                  aria-label={`注文${order.orderNumber}の${line.name}を未調理に戻す`}
                                  onClick={() => actions.onUpdate(order, line, "unstarted")}
                                >
                                  未調理に戻す
                                </Button>
                              </Group>
                            ) : null}
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                    {order.handedOffAt ? <Text>受け渡し済みです</Text> : null}
                  </Stack>
                </Paper>
              ))}
            </SimpleGrid>
          </>
        ) : null}
      </Stack>
    </Container>
  );
};
