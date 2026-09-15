import { Paper, Stack, Text } from "@mantine/core";

import { yen } from "../../lib/format-yen";
import { ReceivedAmountInputUI } from "./received-amount-input.ui";
import type { calculateCheckout } from "../../lib/checkout";

type CheckoutPaymentUIProps = {
  checkout: ReturnType<typeof calculateCheckout>;
  received: number | null;
  disabled: boolean;
  onChangeReceived: (value: number | null) => void;
};

export const CheckoutPaymentUI = ({ checkout, received, disabled, onChangeReceived }: CheckoutPaymentUIProps) => (
  <Paper withBorder p="md">
    <Stack>
      <Text fw={700} fz={32}>
        合計：{checkout.total === null ? "—" : yen(checkout.total)}
      </Text>
      <ReceivedAmountInputUI value={received} disabled={disabled} onChange={onChangeReceived} />
      {received !== null && checkout.total !== null && checkout.change === null && (
        <Text c="red">受取金額が不足しています。</Text>
      )}
      <Text aria-live="polite" fw={700} size="xl">
        お釣り：{checkout.change === null ? "—" : yen(checkout.change)}
      </Text>
    </Stack>
  </Paper>
);
