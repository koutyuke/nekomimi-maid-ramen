import { Alert, Button, Checkbox, Container, Divider, Flex, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

import { ErrorAlert, ConnectingIndicator } from "../../../shared/ui";
import { visibleHandoffOrders } from "../lib/handoff-status";
import { HandoffOrderCardUI } from "./handoff-order-card/handoff-order-card.ui";
import type { CookingState } from "../../../entities/orders";
import type { PendingCookingLine } from "../../../features/cooking-state";
import type { HandoffOrdersState } from "../model/use-handoff";

export type HandoffPageUIProps = {
  orders: HandoffOrdersState;
  realtimeConnected: boolean;
  pendingLines: readonly PendingCookingLine[];
  cookingError: string | null;
  handoffPending: boolean;
  handoffError: string | null;
  onUpdate: (orderId: string, menuItemId: string, to: CookingState) => void;
  onComplete: (orderId: string) => void;
  onRetry: () => void;
};

export const HandoffPageUI = ({
  orders,
  realtimeConnected,
  pendingLines,
  cookingError,
  handoffPending,
  handoffError,
  onComplete,
  onRetry,
  onUpdate,
}: HandoffPageUIProps) => {
  const [hideCompleted, setHideCompleted] = useState(true);
  const disabled = orders.status !== "success" || handoffPending;
  const visibleOrders = visibleHandoffOrders(orders.data ?? [], hideCompleted);

  return (
    <Container size="md" py="lg">
      <Stack>
        <Flex gap="xs" align="center">
          <Title order={1}>受け渡し</Title>
          <Flex flex={1} align="center" justify="end">
            {!realtimeConnected && (orders.status === "pending" || orders.status === "success") && (
              <ConnectingIndicator />
            )}
          </Flex>
          <Button variant="light" onClick={onRetry} h={44} w={44} p={0}>
            <RefreshCw size={20} />
          </Button>
        </Flex>
        <Checkbox
          label="完了を非表示"
          checked={hideCompleted}
          onChange={(event) => setHideCompleted(event.currentTarget.checked)}
        />
        <Divider />

        {orders.status === "pending" && <Text component="output">注文を読み込んでいます</Text>}
        {orders.status === "denied" && (
          <Alert color="yellow" role="alert">
            注文情報へのアクセスが拒否されました。ログイン状態とスタッフ権限を確認してください。
          </Alert>
        )}
        {orders.status === "error" && (
          <ErrorAlert>最新の注文を取得できません。権限と通信状況を確認して再読み込みしてください。</ErrorAlert>
        )}
        {orders.status !== "denied" && cookingError && <ErrorAlert>{cookingError}</ErrorAlert>}
        {orders.status !== "denied" && handoffError && <ErrorAlert>{handoffError}</ErrorAlert>}
        {orders.status === "success" && visibleOrders.length === 0 && <Text>表示する注文はありません。</Text>}

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          {visibleOrders.map(({ order, status }) => (
            <HandoffOrderCardUI
              key={order.id}
              order={order}
              status={status}
              disabled={disabled}
              pendingItemIds={pendingLines.filter((line) => line.orderId === order.id).map((line) => line.menuItemId)}
              onUpdate={(menuItemId, to) => onUpdate(order.id, menuItemId, to)}
              onComplete={() => onComplete(order.id)}
            />
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
};
