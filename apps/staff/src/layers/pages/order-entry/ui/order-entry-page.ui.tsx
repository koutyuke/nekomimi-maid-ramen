import { Alert, Button, Container, Divider, Flex, Stack, Text, Title } from "@mantine/core";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

import { ErrorAlert, ConnectingIndicator } from "../../../shared/ui";
import { CheckoutPaymentUI } from "./checkout-payment/checkout-payment.ui";
import { OrderConfirmationDialogUI } from "./order-confirmation-dialog/order-confirmation-dialog.ui";
import { OrderItemsUI } from "./order-items/order-items.ui";
import type { MenuItem } from "../../../entities/menu";
import type { Confirmation } from "../api/confirm-order";
import type { DraftLine, Receipt, calculateCheckout, stockShortages } from "../lib/checkout";
import type { MenuState } from "../model/use-order-entry";
import type { OrderConfirmationDialogContent } from "./order-confirmation-dialog/order-confirmation-dialog.ui";

export type OrderEntryPageUIProps = {
  menu: MenuState;
  realtimeConnected: boolean;
  draft: {
    lines: readonly DraftLine[];
    received: number | null;
    checkout: ReturnType<typeof calculateCheckout>;
    shortages: ReturnType<typeof stockShortages>;
  };
  confirmation:
    | { status: "idle" | "pending" }
    | { status: "uncertain"; rejection: Extract<Confirmation, { kind: "rejected" }> | null }
    | { status: "failed"; result: Exclude<Confirmation, { kind: "confirmed" }> }
    | { status: "confirmed"; receipt: Receipt };
  canConfirm: boolean;
  previousOrder: Receipt | null;
  onRefreshMenu: () => void;
  onChangeQuantity: (item: MenuItem, delta: -1 | 1) => void;
  onChangeReceived: (value: number | null) => void;
  onConfirmOrder: () => void;
  onRetryConfirmation: () => void;
  onStartNextOrder: () => void;
};

type DialogSelection =
  | { kind: "closed" }
  | { kind: "confirmation" }
  | { kind: "previous"; opened: boolean; receipt: Receipt };

export const OrderEntryPageUI = ({
  menu,
  realtimeConnected,
  draft,
  confirmation,
  canConfirm,
  previousOrder,
  onRefreshMenu,
  onChangeQuantity,
  onChangeReceived,
  onConfirmOrder,
  onRetryConfirmation,
  onStartNextOrder,
}: OrderEntryPageUIProps) => {
  const [dialog, setDialog] = useState<DialogSelection>({ kind: "closed" });
  const { lines, received, checkout, shortages } = draft;
  const pending = confirmation.status === "pending";
  const uncertain = confirmation.status === "uncertain";
  const confirmed = confirmation.status === "confirmed";
  const locked = pending || uncertain || confirmed;
  const result =
    confirmation.status === "failed"
      ? confirmation.result
      : confirmation.status === "uncertain"
        ? confirmation.rejection
        : null;
  const items = menu.data ?? [];
  const content: OrderConfirmationDialogContent =
    confirmation.status === "confirmed"
      ? { kind: "confirmed", receipt: confirmation.receipt }
      : dialog.kind === "previous"
        ? { kind: "previous", receipt: dialog.receipt }
        : {
            kind: "confirmation",
            lines,
            received,
            checkout,
            submission: pending ? "pending" : canConfirm ? "ready" : "blocked",
          };
  const opened =
    pending ||
    confirmed ||
    (dialog.kind === "confirmation" && menu.status !== "denied") ||
    (dialog.kind === "previous" && dialog.opened);

  const closeDialog = () => {
    if (pending) {
      return;
    }
    // 閉じるアニメーション中も注文結果を残し、入力内容への切り替わりを防ぐ。
    setDialog(
      content.kind === "confirmation"
        ? { kind: "closed" }
        : { kind: "previous", opened: false, receipt: content.receipt },
    );
    if (confirmed) {
      onStartNextOrder();
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      });
    }
  };

  return (
    <Container size="md" py="lg">
      <Stack>
        <Flex gap="xs" align="center">
          <Title order={1}>注文・会計</Title>
          <Flex flex={1} align="center" justify="end">
            {!realtimeConnected && (menu.status === "pending" || menu.status === "success") && <ConnectingIndicator />}
          </Flex>
          <Button
            aria-label="商品情報を更新"
            variant="light"
            disabled={locked}
            onClick={onRefreshMenu}
            h={44}
            w={44}
            p={0}
          >
            <RefreshCw size={20} />
          </Button>
        </Flex>
        <Button
          variant="default"
          disabled={pending || uncertain || !previousOrder}
          onClick={() => {
            if (!previousOrder) {
              return;
            }
            setDialog({ kind: "previous", opened: true, receipt: previousOrder });
          }}
        >
          前回の注文を確認
        </Button>
        <Divider />

        {!locked && menu.status === "success" && shortages.length > 0 && (
          <ErrorAlert title="在庫が不足しています">
            {shortages.map((shortage) => (
              <Text key={shortage.menuItemId}>
                {shortage.name}：希望{shortage.requested}個／販売可能{shortage.available}個
              </Text>
            ))}
            <Text>選択数を減らすか、商品を外して確認してください。</Text>
          </ErrorAlert>
        )}
        {uncertain && (
          <ErrorAlert>
            確定結果を確認できません。画面を閉じず、同じ注文の結果を再確認してください。確認が終わるまで返金や別の注文入力をしないでください。
          </ErrorAlert>
        )}
        {result?.kind === "shortage" && (
          <ErrorAlert title="在庫不足のため確定できません">
            <Stack>
              {result.shortages.map((shortage) => (
                <Text key={shortage.menuItemId}>
                  {lines.find((line) => line.item.id === shortage.menuItemId)?.item.name ?? shortage.menuItemId}
                  ：希望{shortage.requested}個／販売可能{shortage.available}個
                </Text>
              ))}
              <Text>受け取った現金を返し、個数を減らして入力し直してください。</Text>
            </Stack>
          </ErrorAlert>
        )}

        {result?.kind === "rejected" && <ErrorAlert>{result.message}</ErrorAlert>}
        {menu.status === "pending" && <Text>商品を読み込んでいます</Text>}
        {menu.status === "error" && (
          <ErrorAlert>商品情報を取得できません。再読み込みしてから確定してください。</ErrorAlert>
        )}
        {menu.status === "denied" && (
          <Alert color="yellow" role="alert">
            商品情報へのアクセスが拒否されました。ログイン状態とスタッフ権限を確認してください。
          </Alert>
        )}
        {menu.status === "success" && items.length === 0 && <Text>販売中の商品はありません。</Text>}
        {menu.status !== "denied" && (
          <>
            <OrderItemsUI
              items={items}
              lines={lines}
              disabled={locked}
              canIncrease={menu.status === "success"}
              onChangeQuantity={onChangeQuantity}
            />
            <CheckoutPaymentUI
              checkout={checkout}
              received={received}
              disabled={locked}
              onChangeReceived={onChangeReceived}
            />
            {shortages.length > 0 && (
              <Text c="red">在庫が不足している商品の選択数を減らすか、商品を外してください。</Text>
            )}
            {!confirmed && <Text size="sm">現金とお釣りのやり取りを終えてから確定してください。</Text>}
          </>
        )}
        {uncertain ? (
          <Button size="lg" fullWidth onClick={onRetryConfirmation}>
            同じ注文の結果を再確認
          </Button>
        ) : (
          menu.status !== "denied" && (
            <Button
              size="lg"
              fullWidth
              loading={pending}
              disabled={!canConfirm || locked}
              onClick={() => {
                if (canConfirm && !locked) {
                  setDialog({ kind: "confirmation" });
                }
              }}
            >
              注文を確定
            </Button>
          )
        )}
      </Stack>
      <OrderConfirmationDialogUI
        opened={opened}
        content={content}
        onClose={closeDialog}
        onConfirm={() => {
          if (!canConfirm) {
            return;
          }
          setDialog({ kind: "closed" });
          onConfirmOrder();
        }}
      />
    </Container>
  );
};
