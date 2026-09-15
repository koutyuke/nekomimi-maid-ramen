import { Alert, Button, Container, Divider, Flex, Stack, Text, TextInput, Title } from "@mantine/core";
import { RefreshCw } from "lucide-react";

import { ErrorAlert, ConnectingIndicator } from "../../../shared/ui";
import { OrderTableUI } from "./order-table/order-table.ui";
import type { OrderManagementOrdersState } from "../model/use-order-management";

export type OrderManagementPageUIProps = {
  businessDate: string;
  orders: OrderManagementOrdersState;
  realtimeConnected: boolean;
  cancellationPending: boolean;
  cancellationError: string | null;
  cancelledOrderNumber: number | null;
  onBusinessDateChange: (value: string) => void;
  onCancel: (orderId: string) => void;
  onRetry: () => void;
};

export const OrderManagementPageUI = ({
  businessDate,
  realtimeConnected,
  orders,
  cancellationPending,
  cancellationError,
  cancelledOrderNumber,
  onBusinessDateChange,
  onCancel,
  onRetry,
}: OrderManagementPageUIProps) => (
  <Container size="md" py="lg">
    <Stack>
      <Flex gap="xs" align="center">
        <Title order={1}>注文管理</Title>
        <Flex flex={1} align="center" justify="end">
          {!realtimeConnected && (orders.status === "pending" || orders.status === "success") && (
            <ConnectingIndicator />
          )}
        </Flex>
        <Button
          aria-label="再読み込み"
          variant="light"
          disabled={cancellationPending}
          onClick={onRetry}
          h={44}
          w={44}
          p={0}
        >
          <RefreshCw size={20} />
        </Button>
      </Flex>

      <TextInput
        type="date"
        label="営業日"
        value={businessDate}
        disabled={cancellationPending}
        onChange={(event) => {
          if (event.currentTarget.value) {
            onBusinessDateChange(event.currentTarget.value);
          }
        }}
      />
      <Divider />

      {orders.status === "pending" ? <Text component="output">注文を読み込んでいます</Text> : null}
      {orders.status === "error" ? (
        <ErrorAlert>最新の注文を取得できません。権限と通信状況を確認して再読み込みしてください。</ErrorAlert>
      ) : null}
      {orders.status === "denied" && (
        <Alert color="yellow" role="alert">
          注文情報へのアクセスが拒否されました。ログイン状態とスタッフ権限を確認してください。
        </Alert>
      )}
      {orders.status !== "denied" && cancellationError && <ErrorAlert>{cancellationError}</ErrorAlert>}
      {orders.status !== "denied" && cancelledOrderNumber !== null ? (
        <Text component="output">注文{cancelledOrderNumber}を取り消し、在庫を戻しました。</Text>
      ) : null}
      {orders.status === "success" && orders.data.length === 0 ? <Text>表示する注文はありません。</Text> : null}

      <OrderTableUI
        key={businessDate}
        orders={orders.data}
        disabled={orders.status !== "success"}
        pending={cancellationPending}
        onCancel={onCancel}
      />
    </Stack>
  </Container>
);
