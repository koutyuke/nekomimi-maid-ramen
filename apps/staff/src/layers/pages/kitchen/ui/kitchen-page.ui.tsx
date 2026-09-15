import {
  Alert,
  Button,
  Checkbox,
  Container,
  Divider,
  Flex,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

import { ErrorAlert, ConnectingIndicator } from "../../../shared/ui";
import { visibleKitchenOrders } from "../lib/kitchen-status";
import { KitchenOrderCardUI } from "./kitchen-order-card/kitchen-order-card.ui";
import type { CookingState } from "../../../entities/orders";
import type { PendingCookingLine } from "../../../features/cooking-state";
import type { KitchenFilter } from "../lib/kitchen-status";
import type { KitchenOrdersState } from "../model/use-kitchen";

export type KitchenPageUIProps = {
  orders: KitchenOrdersState;
  realtimeConnected: boolean;
  pendingLines: readonly PendingCookingLine[];
  updateError: string | null;
  onRetry: () => void;
  onUpdate: (orderId: string, menuItemId: string, to: CookingState) => void;
};

export const KitchenPageUI = ({
  orders,
  realtimeConnected,
  pendingLines,
  updateError,
  onRetry,
  onUpdate,
}: KitchenPageUIProps) => {
  const [filter, setFilter] = useState<KitchenFilter>("all");
  const [hideHandled, setHideHandled] = useState(true);
  const disabled = orders.status !== "success";
  const visibleOrders = visibleKitchenOrders(orders.data ?? [], filter, hideHandled);

  return (
    <Container size="md" py="lg">
      <Stack>
        <Flex gap="xs" align="center">
          <Title order={1}>調理</Title>
          <Flex flex={1} align="center" justify="end">
            {!realtimeConnected && (orders.status === "pending" || orders.status === "success") && (
              <ConnectingIndicator />
            )}
          </Flex>
          <Button variant="light" onClick={onRetry} h={44} w={44} p={0}>
            <RefreshCw size={20} />
          </Button>
        </Flex>

        <Select
          label="表示する商品"
          value={filter}
          onChange={(_value, option) => {
            setFilter(option.value);
          }}
          data={[
            { value: "all", label: "すべて表示" },
            { value: "main", label: "ラーメンのみ" },
            { value: "side", label: "サイドのみ" },
          ]}
        />
        <Checkbox
          label="対応済みを非表示"
          checked={hideHandled}
          onChange={(event) => setHideHandled(event.currentTarget.checked)}
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
        {orders.status !== "denied" && updateError && <ErrorAlert>{updateError}</ErrorAlert>}
        {orders.status === "success" && visibleOrders.length === 0 && <Text>表示する注文はありません。</Text>}

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          {visibleOrders.map(({ order, lines, status }) => (
            <KitchenOrderCardUI
              key={order.id}
              order={order}
              lines={lines}
              status={status}
              disabled={disabled}
              pendingItemIds={pendingLines.filter((line) => line.orderId === order.id).map((line) => line.menuItemId)}
              onUpdate={(menuItemId, to) => onUpdate(order.id, menuItemId, to)}
            />
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
};
