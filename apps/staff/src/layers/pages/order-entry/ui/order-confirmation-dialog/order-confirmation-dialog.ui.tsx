import { Alert, Button, Group, Modal, Stack, Text, Title } from "@mantine/core";

import { yen } from "../../lib/format-yen";
import type { DraftLine, Receipt, calculateCheckout } from "../../model/checkout";

type OrderConfirmationDialogUIProps = {
  opened: boolean;
  showReceipt: boolean;
  confirmed: boolean;
  pending: boolean;
  cannotConfirm: boolean;
  previousOrder: Receipt | null;
  lines: readonly DraftLine[];
  received: string;
  checkout: ReturnType<typeof calculateCheckout>;
  actions: { onClose: () => void; onCancel: () => void; onSubmit: () => void };
};

export const OrderConfirmationDialogUI = ({
  opened,
  showReceipt,
  confirmed,
  pending,
  cannotConfirm,
  previousOrder,
  lines,
  received,
  checkout,
  actions,
}: OrderConfirmationDialogUIProps) => (
  <Modal
    opened={opened}
    onClose={actions.onClose}
    title={showReceipt ? (confirmed ? "注文を確定しました" : "前回の注文") : "注文を確定してよいですか？"}
    centered
    withCloseButton={!pending}
    closeOnClickOutside={!pending}
    closeOnEscape={!pending}
    closeButtonProps={{ "aria-label": showReceipt ? "閉じる" : "確認を閉じる" }}
  >
    {showReceipt && previousOrder ? (
      <Stack>
        <Title order={2} ta="center" fz={36}>
          注文番号：{previousOrder.order.orderNumber}
        </Title>
        {previousOrder.order.lines.map((line) => (
          <Group key={line.menuItemId} justify="space-between">
            <Text>
              {previousOrder.names[line.menuItemId] ?? line.menuItemId} × {line.quantity}個
            </Text>
            <Text>{yen(line.subtotal)}</Text>
          </Group>
        ))}
        <Text fw={700}>確定金額：{yen(previousOrder.order.totalAmount)}</Text>
        <Text>受取金額：{yen(previousOrder.received)}</Text>
        <Text>
          お釣り：
          {previousOrder.received >= previousOrder.order.totalAmount
            ? yen(previousOrder.received - previousOrder.order.totalAmount)
            : "受取金額が不足しています"}
        </Text>
        {previousOrder.order.totalAmount !== previousOrder.quotedTotal ? (
          <Alert color="red">入力時と確定時の金額が異なります。差額を精算してください。</Alert>
        ) : null}
        <Text>注文番号を紙に書いて渡してください。</Text>
        <Button size="lg" onClick={actions.onClose}>
          {confirmed ? "番号を控えて次の注文" : "確認しました"}
        </Button>
      </Stack>
    ) : (
      <Stack>
        {lines.map((line) => (
          <Group key={line.item.id} justify="space-between">
            <Text>
              {line.item.name} × {line.quantity}個
            </Text>
            <Text>{yen(line.item.price * Number(line.quantity))}</Text>
          </Group>
        ))}
        <Text fw={700} fz={32}>
          合計：{checkout.total === null ? "—" : yen(checkout.total)}
        </Text>
        <Text>受取金額：{yen(Number(received))}</Text>
        <Text>お釣り：{checkout.change === null ? "—" : yen(checkout.change)}</Text>
        <Text>現金とお釣りのやり取りが完了したことを確認してください。</Text>
        {cannotConfirm && !pending ? <Alert color="red">商品情報と会計内容を確認し直してください。</Alert> : null}
        <Button
          size="lg"
          disabled={cannotConfirm}
          loading={pending}
          onClick={() => {
            if (cannotConfirm) {
              return;
            }
            actions.onSubmit();
          }}
        >
          はい、確定する
        </Button>
        <Button variant="default" size="lg" disabled={pending} onClick={actions.onCancel}>
          入力に戻る
        </Button>
      </Stack>
    )}
  </Modal>
);
