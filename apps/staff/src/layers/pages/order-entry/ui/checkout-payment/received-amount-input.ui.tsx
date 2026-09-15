import { Button, SimpleGrid, Stack, Text } from "@mantine/core";
import { Delete } from "lucide-react";
import { useId } from "react";

import { yen } from "../../lib/format-yen";

type ReceivedAmountInputUIProps = {
  value: number | null;
  disabled: boolean;
  onChange: (value: number | null) => void;
};

export const ReceivedAmountInputUI = ({ value, disabled, onChange }: ReceivedAmountInputUIProps) => {
  const labelId = useId();
  const appendDigit = (digit: number) => onChange((value ?? 0) * 10 + digit * 100);
  const deleteDigit = () => onChange(value === null || value < 1000 ? null : Math.floor(value / 1000) * 100);

  return (
    <>
      <Stack gap={0}>
        <Text id={labelId} fw={600}>
          受取金額
        </Text>
        <Text
          component="output"
          aria-labelledby={labelId}
          aria-live="polite"
          fw={700}
          fz={40}
          ta="right"
          style={{ overflowWrap: "anywhere" }}
        >
          {value === null ? "—" : value / 100}
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
            disabled={disabled}
            onClick={() => onChange((value ?? 0) + amount)}
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
            disabled={disabled}
            aria-label={`受取金額に${digit}を入力`}
            onClick={() => appendDigit(digit)}
          >
            {digit}
          </Button>
        ))}
        <Button size="lg" px="xs" color="red" variant="light" disabled={disabled} onClick={() => onChange(null)}>
          クリア
        </Button>
        <Button
          size="lg"
          variant="default"
          disabled={disabled}
          aria-label="受取金額に0を入力"
          onClick={() => appendDigit(0)}
        >
          0
        </Button>
        <Button size="lg" variant="light" disabled={disabled} aria-label="1桁削除" onClick={deleteDigit}>
          <Delete />
        </Button>
      </SimpleGrid>
    </>
  );
};
