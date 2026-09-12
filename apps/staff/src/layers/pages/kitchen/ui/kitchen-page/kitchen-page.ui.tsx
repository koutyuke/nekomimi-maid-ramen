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
  NativeSelect,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { visibleKitchenOrders } from "../../lib/kitchen-status";
import { KitchenOrderCardUI } from "../kitchen-order-card/kitchen-order-card.ui";
import type { CookingState, KitchenOrder, KitchenOrderLine, PendingCookingLine } from "../../../../entities/kitchen";
import type { KitchenFilter } from "../../lib/kitchen-status";

export type KitchenPageUIProps = {
  access: "loading" | "error" | "allowed" | "denied";
  orders: readonly KitchenOrder[];
  loading: boolean;
  failed: boolean;
  connected: boolean;
  pendingLines: readonly PendingCookingLine[];
  error: string | null;
  actions: { onRetry: () => void; onUpdate: (order: KitchenOrder, line: KitchenOrderLine, to: CookingState) => void };
};

export const KitchenPageUI = ({
  access,
  orders,
  loading,
  failed,
  connected,
  pendingLines,
  error,
  actions,
}: KitchenPageUIProps) => {
  const [filter, setFilter] = useState<KitchenFilter>("all");
  const [hideHandled, setHideHandled] = useState(true);
  const disabled = loading || failed;
  const visibleOrders = visibleKitchenOrders(orders, filter, hideHandled);

  return (
    <Container size="md" py="lg">
      <Stack>
        <Anchor component={Link} to="/">
          ← スタッフページへ戻る
        </Anchor>
        <Group justify="space-between">
          <Title order={1}>調理</Title>
          {!connected && (
            <Flex display="flex" gap="4" align="center">
              <Loader size="xs" />
              <Text size="md" fw={500}>
                接続中
              </Text>
            </Flex>
          )}
        </Group>

        {access === "loading" && <Text>権限を確認しています</Text>}
        {access === "error" && (
          <Alert color="red" role="alert">
            権限を確認できません。<Button onClick={actions.onRetry}>再読み込み</Button>
          </Alert>
        )}
        {access === "denied" && (
          <Alert color="yellow" role="alert">
            注文・会計にはスタッフ権限が必要です。
          </Alert>
        )}

        {access === "allowed" ? (
          <>
            <Flex align="end" justify="start" gap="md">
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
            </Flex>
            <Button variant="light" onClick={actions.onRetry}>
              商品情報を更新
            </Button>

            <Divider />

            {loading && <Text component="output">注文を読み込んでいます</Text>}
            {failed && (
              <Alert color="red" role="alert">
                最新の注文を取得できません。権限と通信状況を確認して再読み込みしてください。
              </Alert>
            )}
            {error && (
              <Alert color="red" role="alert">
                {error}
              </Alert>
            )}

            {!loading && !failed && visibleOrders.length === 0 ? <Text>表示する注文はありません。</Text> : null}

            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {visibleOrders.map(({ order, lines, status }) => (
                <KitchenOrderCardUI
                  key={order.id}
                  order={order}
                  lines={lines}
                  status={status}
                  disabled={disabled}
                  pendingItemIds={pendingLines
                    .filter((line) => line.orderId === order.id)
                    .map((line) => line.menuItemId)}
                  actions={{ onUpdate: (line, to) => actions.onUpdate(order, line, to) }}
                />
              ))}
            </SimpleGrid>
          </>
        ) : null}
      </Stack>
    </Container>
  );
};
