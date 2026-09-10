import { Alert, Anchor, Button, Container, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";

import { calculateCheckout } from "../model/checkout";
import { CheckoutPaymentUI } from "./checkout-payment.ui";
import { OrderConfirmationDialogUI } from "./order-confirmation-dialog.ui";
import { OrderItemsUI } from "./order-items.ui";
import type { MenuItem } from "../../../entities/menu";
import type { Confirmation } from "../api/confirm-order";
import type { DraftLine, Receipt } from "../model/checkout";

export type OrderEntryPageUIProps = {
  access: "loading" | "error" | "allowed" | "denied";
  items: readonly MenuItem[];
  menuLoading: boolean;
  menuFailed: boolean;
  lines: readonly DraftLine[];
  received: string;
  pending: boolean;
  uncertain: boolean;
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
  lines,
  received,
  pending,
  uncertain,
  result,
  previousOrder,
  actions,
}: OrderEntryPageUIProps) => {
  const [dialog, setDialog] = useState({ opened: false, receipt: false });
  const checkout = calculateCheckout(lines, received);
  const confirmed = result?.kind === "confirmed";
  const showReceipt = !!previousOrder && (confirmed || dialog.receipt);
  const locked = pending || uncertain || confirmed;
  const unavailable = lines.some((line) => !items.some((item) => item.id === line.item.id && item.sellable));
  const cannotConfirm = locked || checkout.change === null || unavailable || menuLoading || menuFailed;
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
        <Anchor href="/staff">← スタッフページへ戻る</Anchor>
        <Title order={1}>注文・会計</Title>
        {access === "loading" ? <Text>権限を確認しています</Text> : null}
        {access === "error" ? (
          <Alert color="red" role="alert">
            権限を確認できません。<Button onClick={actions.onRetry}>再読み込み</Button>
          </Alert>
        ) : null}
        {access === "denied" ? (
          <Alert color="yellow" role="alert">
            注文・会計にはスタッフ権限が必要です。
          </Alert>
        ) : null}
        {access === "allowed" ? (
          <>
            {previousOrder ? (
              <Button
                variant="default"
                disabled={pending || uncertain}
                onClick={() => setDialog({ opened: true, receipt: true })}
              >
                前回の注文を確認
              </Button>
            ) : null}
            <OrderConfirmationDialogUI
              opened={dialog.opened || pending || confirmed}
              showReceipt={showReceipt}
              confirmed={confirmed}
              pending={pending}
              cannotConfirm={cannotConfirm}
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
              menuLoading={menuLoading}
              menuFailed={menuFailed}
              locked={locked}
              actions={{ onRetry: actions.onRetry, onStep: actions.onStep }}
            />
            <CheckoutPaymentUI
              checkout={checkout}
              received={received}
              locked={locked}
              unavailable={unavailable}
              confirmed={confirmed}
              pending={pending}
              uncertain={uncertain}
              menuLoading={menuLoading}
              menuFailed={menuFailed}
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
        ) : null}
      </Stack>
    </Container>
  );
};
