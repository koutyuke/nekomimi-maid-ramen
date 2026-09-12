import { Alert, Anchor, Button, Container, Divider, Flex, Group, Loader, Stack, Text, Title } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { CheckoutPaymentUI } from "../checkout-payment/checkout-payment.ui";
import { OrderConfirmationDialogUI } from "../order-confirmation-dialog/order-confirmation-dialog.ui";
import { OrderItemsUI } from "../order-items/order-items.ui";
import type { MenuItem } from "../../../../entities/menu";
import type { Confirmation } from "../../api/confirm-order";
import type { DraftLine, Receipt, calculateCheckout, stockShortages } from "../../model/checkout";

export type OrderEntryPageUIProps = {
  access: "loading" | "error" | "allowed" | "denied";
  items: readonly MenuItem[];
  menuLoading: boolean;
  menuFailed: boolean;
  connected: boolean;
  lines: readonly DraftLine[];
  received: string;
  checkout: ReturnType<typeof calculateCheckout>;
  shortages: ReturnType<typeof stockShortages>;
  submission: {
    pending: boolean;
    uncertain: boolean;
    locked: boolean;
    canConfirm: boolean;
    canSubmit: boolean;
  };
  result: Confirmation | null;
  previousOrder: Receipt | null;
  actions: {
    onRetry: () => void;
    onStep: (item: MenuItem, delta: -1 | 1) => void;
    onReceived: (value: string) => void;
    onSubmit: () => void;
    onNext: () => void;
  };
};

export const OrderEntryPageUI = ({
  access,
  items,
  menuLoading,
  menuFailed,
  connected,
  lines,
  received,
  checkout,
  shortages,
  submission: { pending, uncertain, locked, canConfirm, canSubmit },
  result,
  previousOrder,
  actions,
}: OrderEntryPageUIProps) => {
  const [dialog, setDialog] = useState({ opened: false, receipt: false });
  const confirmed = result?.kind === "confirmed";
  const showReceipt = !!previousOrder && (confirmed || dialog.receipt);
  const unavailable = shortages.length > 0;
  const closeReceipt = () => {
    if (pending) {
      return;
    }
    setDialog({ opened: false, receipt: showReceipt });
    if (confirmed) {
      actions.onNext();
    }
  };

  return (
    <Container size="sm" py="lg">
      <Stack>
        <Anchor component={Link} to="/">
          ← スタッフページへ戻る
        </Anchor>
        <Group justify="space-between">
          <Title order={1}>注文・会計</Title>
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

        {access === "allowed" && (
          <>
            <OrderConfirmationDialogUI
              opened={dialog.opened || pending || confirmed}
              showReceipt={showReceipt}
              confirmed={confirmed}
              pending={pending}
              cannotConfirm={!canConfirm}
              previousOrder={previousOrder}
              lines={lines}
              received={received}
              checkout={checkout}
              actions={{
                onClose: closeReceipt,
                onCancel: () => setDialog({ opened: false, receipt: false }),
                onSubmit: () => {
                  setDialog({ opened: false, receipt: false });
                  actions.onSubmit();
                },
              }}
            />

            <Group justify="space-between">
              {previousOrder && (
                <Button
                  variant="default"
                  disabled={pending || uncertain}
                  onClick={() => setDialog({ opened: true, receipt: true })}
                  flex={1}
                >
                  前回の注文を確認
                </Button>
              )}

              <Button variant="light" disabled={locked} onClick={actions.onRetry} flex={1}>
                商品情報を更新
              </Button>
            </Group>

            <Divider />

            {!locked && !menuFailed && shortages.length > 0 && (
              <Alert color="red" role="alert" title="在庫が不足しています">
                {shortages.map((shortage) => (
                  <Text key={shortage.menuItemId}>
                    {shortage.name}：希望{shortage.requested}個／販売可能{shortage.available}個
                  </Text>
                ))}
                <Text>選択数を減らすか、商品を外して確認してください。</Text>
              </Alert>
            )}

            {uncertain ? (
              <Alert color="red" role="alert">
                確定結果を確認できません。画面を閉じず、同じ注文の結果を再確認してください。確認が終わるまで返金や別の注文入力をしないでください。
              </Alert>
            ) : null}

            {result?.kind === "shortage" ? (
              <Alert color="red" role="alert" title="在庫不足のため確定できません">
                <Stack>
                  {result.shortages.map((shortage) => (
                    <Text key={shortage.menuItemId}>
                      {lines.find((line) => line.item.id === shortage.menuItemId)?.item.name ?? shortage.menuItemId}
                      ：希望{shortage.requested}個／販売可能{shortage.available}個
                    </Text>
                  ))}
                  <Text>受け取った現金を返し、個数を減らして入力し直してください。</Text>
                </Stack>
              </Alert>
            ) : null}

            {result?.kind === "rejected" ? (
              <Alert color="red" role="alert">
                {result.message}
              </Alert>
            ) : null}

            <OrderItemsUI
              items={items}
              lines={lines}
              loading={menuLoading}
              failed={menuFailed}
              disabled={locked}
              actions={{
                onStep: actions.onStep,
              }}
            />
            <CheckoutPaymentUI
              checkout={checkout}
              received={received}
              locked={locked}
              unavailable={unavailable}
              confirmed={confirmed}
              pending={pending}
              uncertain={uncertain}
              canSubmit={canSubmit}
              actions={{
                onReceived: actions.onReceived,
                onConfirm: () => {
                  if (uncertain) {
                    actions.onSubmit();
                  } else {
                    setDialog({ opened: true, receipt: false });
                  }
                },
              }}
            />
          </>
        )}
      </Stack>
    </Container>
  );
};
