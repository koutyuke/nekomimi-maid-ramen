import { Button, Paper, SimpleGrid, Stack, Text } from "@mantine/core";

import { yen } from "../../lib/format-yen";
import type { calculateCheckout } from "../../model/checkout";

type CheckoutPaymentUIProps = {
  checkout: ReturnType<typeof calculateCheckout>;
  received: string;
  locked: boolean;
  unavailable: boolean;
  confirmed: boolean;
  pending: boolean;
  uncertain: boolean;
  canSubmit: boolean;
  actions: {
    onReceived: (value: string) => void;
    onConfirm: () => void;
  };
};

export const CheckoutPaymentUI = ({
  checkout,
  received,
  locked,
  unavailable,
  confirmed,
  pending,
  uncertain,
  canSubmit,
  actions: { onReceived, onConfirm },
}: CheckoutPaymentUIProps) => {
  const hundreds = received === "" ? "" : String(Number(received) / 100);
  return (
    <Paper withBorder p="md">
      <Stack>
        <Text fw={700} fz={32}>
          合計：{checkout.total === null ? "—" : yen(checkout.total)}
        </Text>
        <Stack gap={0}>
          <Text id="received-label" fw={600}>
            受取金額
          </Text>
          <Text
            component="output"
            aria-labelledby="received-label"
            aria-live="polite"
            fw={700}
            fz={40}
            ta="right"
            style={{ overflowWrap: "anywhere" }}
          >
            {hundreds || "—"}
            <Text component="span" c="dimmed" fz={28}>
              00 円
            </Text>
          </Text>
          <Text size="xs" c="dimmed">
            100円単位・末尾00は自動入力
          </Text>
        </Stack>
        <SimpleGrid cols={3} spacing="xs">
          {[100, 500, 1000, 5000, 10000].map((amount) => (
            <Button
              key={amount}
              variant="light"
              size="md"
              px="xs"
              disabled={locked}
              onClick={() => onReceived(String(Number(received) + amount))}
            >
              +{yen(amount)}
            </Button>
          ))}
        </SimpleGrid>
        <SimpleGrid cols={3} spacing="xs">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <Button
              key={digit}
              size="lg"
              variant="default"
              disabled={locked}
              aria-label={`受取金額に${digit}を入力`}
              onClick={() => onReceived(String(Number(hundreds + digit) * 100))}
            >
              {digit}
            </Button>
          ))}
          <Button size="lg" px="xs" color="red" variant="light" disabled={locked} onClick={() => onReceived("")}>
            クリア
          </Button>
          <Button
            size="lg"
            variant="default"
            disabled={locked}
            aria-label="受取金額に0を入力"
            onClick={() => onReceived(String(Number(hundreds + "0") * 100))}
          >
            0
          </Button>
          <Button
            size="lg"
            variant="light"
            disabled={locked}
            aria-label="1桁削除"
            onClick={() => onReceived(hundreds.length > 1 ? String(Number(hundreds.slice(0, -1)) * 100) : "")}
          >
            ⌫
          </Button>
        </SimpleGrid>
        {received !== "" && checkout.total !== null && checkout.change === null && (
          <Text c="red">受取金額が不足しています。</Text>
        )}
        <Text aria-live="polite" fw={700} size="xl">
          お釣り：{checkout.change === null ? "—" : yen(checkout.change)}
        </Text>

        {unavailable && <Text c="red">在庫が不足している商品の選択数を減らすか、商品を外してください。</Text>}
        {!confirmed && <Text size="sm">現金とお釣りのやり取りを終えてから確定してください。</Text>}
        {confirmed && <Text size="sm">注文が確定されました。別の注文をする場合は読み込み直してください。</Text>}

        <Button size="lg" fullWidth loading={pending} disabled={!canSubmit || confirmed} onClick={onConfirm}>
          {uncertain ? "同じ注文の結果を再確認" : "注文を確定"}
        </Button>
      </Stack>
    </Paper>
  );
};
