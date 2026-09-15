import { Alert, Button, Group, Modal, Stack, Text, Title } from "@mantine/core";

import { yen } from "../../lib/format-yen";
import type { DraftLine, Receipt, calculateCheckout } from "../../lib/checkout";

export type OrderConfirmationDialogContent =
  | {
      kind: "confirmation";
      lines: readonly DraftLine[];
      received: number | null;
      checkout: ReturnType<typeof calculateCheckout>;
      submission: "ready" | "blocked" | "pending";
    }
  | { kind: "confirmed" | "previous"; receipt: Receipt };

type OrderConfirmationDialogUIProps = {
  opened: boolean;
  content: OrderConfirmationDialogContent;
  onClose: () => void;
  onConfirm: () => void;
};

const OrderReceiptUI = ({ receipt }: { receipt: Receipt }) => (
  <>
    <Title order={2} ta="center" fz={36}>
      注文番号：{receipt.order.orderNumber}
    </Title>
    {receipt.order.lines.map((line) => (
      <Group key={line.menuItemId} justify="space-between">
        <Text>
          {receipt.names[line.menuItemId] ?? line.menuItemId} × {line.quantity}個
        </Text>
        <Text>{yen(line.subtotal)}</Text>
      </Group>
    ))}
    <Text fw={700}>確定金額：{yen(receipt.order.totalAmount)}</Text>
    <Text>受取金額：{yen(receipt.received)}</Text>
    <Text>
      お釣り：
      {receipt.received >= receipt.order.totalAmount
        ? yen(receipt.received - receipt.order.totalAmount)
        : "受取金額が不足しています"}
    </Text>
    {receipt.order.totalAmount !== receipt.quotedTotal && (
      <Alert color="red">入力時と確定時の金額が異なります。差額を精算してください。</Alert>
    )}
    <Text>注文番号を紙に書いて渡してください。</Text>
  </>
);

export const OrderConfirmationDialogUI = ({ opened, content, onClose, onConfirm }: OrderConfirmationDialogUIProps) => {
  const pending = content.kind === "confirmation" && content.submission === "pending";
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        content.kind === "confirmation"
          ? "注文を確定してよいですか？"
          : content.kind === "confirmed"
            ? "注文を確定しました"
            : "前回の注文"
      }
      centered
      withCloseButton={!pending}
      closeOnClickOutside={!pending}
      closeOnEscape={!pending}
      closeButtonProps={{ "aria-label": content.kind === "confirmation" ? "確認を閉じる" : "閉じる" }}
    >
      <Stack>
        {content.kind === "confirmation" ? (
          <>
            {content.lines.map((line) => (
              <Group key={line.item.id} justify="space-between">
                <Text>
                  {line.item.name} × {line.quantity}個
                </Text>
                <Text>{yen(line.item.price * Number(line.quantity))}</Text>
              </Group>
            ))}
            <Text fw={700} fz={32}>
              合計：{content.checkout.total === null ? "—" : yen(content.checkout.total)}
            </Text>
            <Text>受取金額：{content.received === null ? "—" : yen(content.received)}</Text>
            <Text>お釣り：{content.checkout.change === null ? "—" : yen(content.checkout.change)}</Text>
            <Text>現金とお釣りのやり取りが完了したことを確認してください。</Text>
            {content.submission === "blocked" && <Alert color="red">商品情報と会計内容を確認し直してください。</Alert>}
            <Button size="lg" disabled={content.submission !== "ready"} loading={pending} onClick={onConfirm}>
              はい、確定する
            </Button>
            <Button variant="default" size="lg" disabled={pending} onClick={onClose}>
              入力に戻る
            </Button>
          </>
        ) : (
          <>
            <OrderReceiptUI receipt={content.receipt} />
            <Button size="lg" onClick={onClose}>
              {content.kind === "confirmed" ? "番号を控えて次の注文" : "確認しました"}
            </Button>
          </>
        )}
      </Stack>
    </Modal>
  );
};
