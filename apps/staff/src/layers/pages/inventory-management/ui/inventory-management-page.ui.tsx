import { Alert, Button, Container, Flex, Stack, Text, Title } from "@mantine/core";
import { RefreshCw } from "lucide-react";

import { ConnectingIndicator, ErrorAlert, LoadingNotice } from "../../../shared/ui";
import { StockTableUI } from "./stock-table/stock-table.ui";
import type { InventoryState, StockUpdateState } from "../model/use-inventory-management";

export type InventoryManagementPageUIProps = {
  inventory: InventoryState;
  stockUpdate: StockUpdateState;
  realtimeConnected: boolean;
  onRetry: () => void;
  onUpdate: (menuItemId: string, quantity: number) => void;
};

export const InventoryManagementPageUI = ({
  inventory,
  stockUpdate,
  realtimeConnected,
  onRetry,
  onUpdate,
}: InventoryManagementPageUIProps) => (
  <Container py="lg" size="md">
    <Stack>
      <Flex align="center" gap="sm">
        <Title order={1}>在庫管理</Title>
        <Flex flex={1} align="center" justify="end">
          {!realtimeConnected && (inventory.status === "pending" || inventory.status === "success") && (
            <ConnectingIndicator />
          )}
        </Flex>
        <Button
          aria-label="再読み込み"
          disabled={stockUpdate.status === "pending"}
          onClick={onRetry}
          variant="light"
          h={44}
          w={44}
          p={0}
        >
          <RefreshCw size={20} />
        </Button>
      </Flex>
      <Stack gap="md">
        <Text c="dimmed" size="sm">
          商品ごとの現在在庫数を登録・修正します。
          <br />
          実在庫を数え直した現在の数量を入力してください。
        </Text>

        {inventory.status === "denied" && (
          <Alert color="yellow" role="alert">
            在庫情報へのアクセスが拒否されました。ログイン状態とスタッフ権限を確認してください。
          </Alert>
        )}
        {inventory.status === "error" && (
          <ErrorAlert title="在庫を取得できません">権限と通信状況を確認して再試行してください。</ErrorAlert>
        )}
        {inventory.status !== "denied" && stockUpdate.status === "error" && (
          <ErrorAlert title="在庫を更新できませんでした">権限と通信状況を確認し、もう一度お試しください。</ErrorAlert>
        )}
        {inventory.status !== "denied" && stockUpdate.status === "success" && (
          <Alert color="green" component="output" title="在庫を更新しました">
            {stockUpdate.result.name}の在庫を{stockUpdate.result.previousQuantity}個から{stockUpdate.result.quantity}
            個へ更新しました。
          </Alert>
        )}
        {inventory.status === "pending" && <LoadingNotice>在庫を読み込んでいます</LoadingNotice>}
        {inventory.status === "success" && (
          <StockTableUI
            items={inventory.data}
            busy={stockUpdate.status === "pending"}
            updatingMenuItemId={stockUpdate.status === "pending" ? stockUpdate.menuItemId : null}
            onUpdate={onUpdate}
          />
        )}
      </Stack>
    </Stack>
  </Container>
);
