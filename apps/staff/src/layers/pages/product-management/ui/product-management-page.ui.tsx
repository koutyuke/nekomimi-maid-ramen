import { Alert, Button, Container, Flex, Stack, Text, Title } from "@mantine/core";
import { RefreshCw } from "lucide-react";

import { ConnectingIndicator, ErrorAlert, LoadingNotice } from "../../../shared/ui";
import { PriceTableUI } from "./price-table/price-table.ui";
import { StockTableUI } from "./stock-table/stock-table.ui";
import type { ItemChange, ItemUpdateState, ProductsState } from "../model/use-product-management";

export type ProductManagementPageUIProps = {
  products: ProductsState;
  itemUpdate: ItemUpdateState;
  realtimeConnected: boolean;
  onRetry: () => void;
  onUpdate: (menuItemId: string, change: ItemChange) => void;
};

export const ProductManagementPageUI = ({
  products,
  itemUpdate,
  realtimeConnected,
  onRetry,
  onUpdate,
}: ProductManagementPageUIProps) => {
  const busy = itemUpdate.status === "pending";
  const updatingMenuItemId = (field: ItemChange["field"]) =>
    itemUpdate.status === "pending" && itemUpdate.field === field ? itemUpdate.menuItemId : null;

  return (
    <Container py="lg" size="md">
      <Stack>
        <Flex align="center" gap="sm">
          <Title order={1}>商品管理</Title>
          <Flex flex={1} align="center" justify="end">
            {!realtimeConnected && (products.status === "pending" || products.status === "success") && (
              <ConnectingIndicator />
            )}
          </Flex>
          <Button aria-label="再読み込み" disabled={busy} onClick={onRetry} variant="light" h={44} w={44} p={0}>
            <RefreshCw size={20} />
          </Button>
        </Flex>
        <Stack gap="md">
          <Text c="dimmed" size="sm">
            商品ごとの在庫数と価格を登録・修正します。
          </Text>

          {products.status === "denied" && (
            <Alert color="yellow" role="alert">
              商品情報へのアクセスが拒否されました。ログイン状態とスタッフ権限を確認してください。
            </Alert>
          )}
          {products.status === "error" && (
            <ErrorAlert title="商品情報を取得できません">権限と通信状況を確認して再試行してください。</ErrorAlert>
          )}
          {products.status !== "denied" && itemUpdate.status === "error" && (
            <ErrorAlert
              title={itemUpdate.field === "price" ? "価格を更新できませんでした" : "在庫を更新できませんでした"}
            >
              権限と通信状況を確認し、もう一度お試しください。
            </ErrorAlert>
          )}
          {products.status === "pending" && <LoadingNotice>商品情報を読み込んでいます</LoadingNotice>}
          {products.status === "success" && (
            <>
              <Stack gap="xs">
                <Title order={2} size="h3">
                  在庫
                </Title>
                <Text c="dimmed" size="sm">
                  実在庫を数え直した現在の数量を入力してください。
                </Text>
                <StockTableUI
                  items={products.data}
                  busy={busy}
                  updatingMenuItemId={updatingMenuItemId("stock")}
                  onUpdate={(menuItemId, quantity) => onUpdate(menuItemId, { field: "stock", quantity })}
                />
              </Stack>
              <Stack gap="xs">
                <Title order={2} size="h3">
                  価格
                </Title>
                <Text c="dimmed" size="sm">
                  以後に確定する注文に適用されます。公開サイトの価格は変わりません。
                </Text>
                <PriceTableUI
                  items={products.data}
                  busy={busy}
                  updatingMenuItemId={updatingMenuItemId("price")}
                  onUpdate={(menuItemId, price) => onUpdate(menuItemId, { field: "price", price })}
                />
              </Stack>
            </>
          )}
        </Stack>
      </Stack>
    </Container>
  );
};
