import {
  Alert,
  Anchor,
  Button,
  Checkbox,
  Container,
  Divider,
  Flex,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { visibleHandoffOrders } from "../../lib/handoff-status";
import { HandoffOrderCardUI } from "../handoff-order-card/handoff-order-card.ui";
import type { HandoffOrder, HandoffOrderLine } from "../../../../entities/handoff";
import type { CookingState, PendingCookingLine } from "../../../../entities/kitchen";

export type HandoffPageUIProps = {
  access: "loading" | "error" | "allowed" | "denied";
  orders: readonly HandoffOrder[];
  loading: boolean;
  failed: boolean;
  connected: boolean;
  pending: boolean;
  pendingLines: readonly PendingCookingLine[];
  error: string | null;
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
  pendingLines,
  error,
  actions: { onUpdate, onComplete, onRetry },
}: HandoffPageUIProps) => {
  const [hideCompleted, setHideCompleted] = useState(true);
  const disabled = loading || failed || pending;
  const visibleOrders = visibleHandoffOrders(orders, hideCompleted);

  return (
    <Container size="md" py="lg">
      <Stack>
        <Anchor component={Link} to="/">
          ← スタッフページへ戻る
        </Anchor>
        <Group justify="space-between">
          <Title order={1}>受け渡し</Title>
          {!connected && (
            <Flex display="flex" gap="4" align="center">
              <Loader size="xs" />
              <Text size="md" fw={500}>
                接続中
              </Text>
            </Flex>
          )}
        </Group>

        {access === "loading" ? <Text>権限を確認しています</Text> : null}
        {access === "error" ? (
          <Alert color="red" role="alert">
            権限を確認できません。<Button onClick={onRetry}>再読み込み</Button>
          </Alert>
        ) : null}
        {access === "denied" ? (
          <Alert color="yellow" role="alert">
            受け渡し画面にはスタッフ権限が必要です。
          </Alert>
        ) : null}
        {access === "allowed" ? (
          <>
            <Checkbox
              label="完了を非表示"
              checked={hideCompleted}
              onChange={(event) => setHideCompleted(event.currentTarget.checked)}
            />
            <Button variant="light" onClick={onRetry}>
              注文情報を更新
            </Button>
            <Divider />
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
            {!loading && !failed && visibleOrders.length === 0 ? <Text>表示する注文はありません。</Text> : null}
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {visibleOrders.map(({ order, status }) => (
                <HandoffOrderCardUI
                  key={order.id}
                  order={order}
                  status={status}
                  disabled={disabled}
                  pendingItemIds={pendingLines
                    .filter((line) => line.orderId === order.id)
                    .map((line) => line.menuItemId)}
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
