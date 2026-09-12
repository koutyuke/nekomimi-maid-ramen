import { Alert, Anchor, Button, Checkbox, Container, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { visibleHandoffOrders } from "../../lib/handoff-status";
import { HandoffOrderCardUI } from "./handoff-order-card.ui";
import type { HandoffOrder, HandoffOrderLine } from "../../../../entities/handoff";
import type { CookingState } from "../../../../entities/kitchen";

export type HandoffPageUIProps = {
  access: "loading" | "error" | "allowed" | "denied";
  orders: readonly HandoffOrder[];
  loading: boolean;
  failed: boolean;
  connected: boolean;
  pending: boolean;
  error: string | null;
  message: string | null;
  actions: {
    onUpdate: (order: HandoffOrder, line: HandoffOrderLine, to: CookingState) => void;
    onComplete: (order: HandoffOrder) => void;
    onRetry: () => void;
  };
};

export const HandoffPageUI = ({
  access,
  orders,
  loading,
  failed,
  connected,
  pending,
  error,
  message,
  actions: { onUpdate, onComplete, onRetry },
}: HandoffPageUIProps) => {
  const [hideCompleted, setHideCompleted] = useState(true);
  const disabled = loading || failed || !connected || pending;
  const visibleOrders = visibleHandoffOrders(orders, hideCompleted);

  return (
    <Container size="md" py="lg">
      <Stack>
        <Anchor component={Link} to="/" mih={44} c="blue.8">
          ← スタッフページへ戻る
        </Anchor>
        <Group justify="space-between">
          <Title order={1}>受け渡し</Title>
          <Button variant="default" mih={44} onClick={onRetry}>
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
            受け渡し画面にはスタッフ権限が必要です。
          </Alert>
        ) : null}
        {access === "allowed" ? (
          <>
            <Text component="output">
              {connected
                ? "注文の変更を自動で反映しています"
                : "自動再接続中です。最新の注文を確認するまで記録できません。"}
            </Text>
            <Checkbox
              label="完了を非表示"
              checked={hideCompleted}
              onChange={(event) => setHideCompleted(event.currentTarget.checked)}
              mih={44}
            />
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
              {visibleOrders.map(({ order, status }) => (
                <HandoffOrderCardUI
                  key={order.id}
                  order={order}
                  status={status}
                  disabled={disabled}
                  actions={{
                    onUpdate: (line, to) => onUpdate(order, line, to),
                    onComplete: () => onComplete(order),
                  }}
                />
              ))}
            </SimpleGrid>
          </>
        ) : null}
      </Stack>
    </Container>
  );
};
