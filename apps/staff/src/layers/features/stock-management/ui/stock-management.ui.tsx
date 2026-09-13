import { Alert, Button, Group, Loader, NumberInput, Stack, Table, Text, Title } from "@mantine/core";

import type { MenuItem } from "../../../entities/menu";

export type StockManagementUIProps = {
  items: readonly MenuItem[];
  loading: boolean;
  failed: boolean;
  busy: boolean;
  updateFailed: boolean;
  updateResult: { name: string; previousQuantity: number; quantity: number } | null;
  updatingMenuItemId: string | null;
  actions: {
    onRetry: () => void;
    onUpdate: (menuItemId: string, quantity: number) => void;
  };
};

export const StockManagementUI = ({
  items,
  loading,
  failed,
  busy,
  updateFailed,
  updateResult,
  updatingMenuItemId,
  actions,
}: StockManagementUIProps) => (
  <Stack gap="md">
    <Group align="flex-start" gap="sm" justify="space-between" wrap="wrap">
      <Stack gap={4}>
        <Title order={2} size="h4">
          現在在庫
        </Title>
        <Text c="dimmed" size="sm">
          実在庫を数え直した現在の数量を入力してください。
        </Text>
      </Stack>
      <Button disabled={busy} onClick={actions.onRetry} variant="light">
        在庫を再読み込み
      </Button>
    </Group>

    {failed ? (
      <Alert color="red" role="alert" title="在庫を取得できません">
        権限と通信状況を確認して再試行してください。
      </Alert>
    ) : null}
    {updateFailed ? (
      <Alert color="red" role="alert" title="在庫を更新できませんでした">
        権限と通信状況を確認し、もう一度お試しください。
      </Alert>
    ) : null}
    {updateResult ? (
      <Alert color="green" component="output" title="在庫を更新しました">
        {updateResult.name}の在庫を{updateResult.previousQuantity}個から{updateResult.quantity}個へ更新しました。
      </Alert>
    ) : null}

    {loading ? (
      <Group gap="sm" justify="center" py="lg">
        <Loader size="sm" />
        <Text c="dimmed" component="output">
          在庫を読み込んでいます
        </Text>
      </Group>
    ) : null}

    {!loading && !failed ? (
      <Table.ScrollContainer minWidth={560}>
        <Table aria-label="商品別在庫" highlightOnHover verticalSpacing="sm" withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>商品</Table.Th>
              <Table.Th>現在数</Table.Th>
              <Table.Th>更新</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.map((item) => (
              <Table.Tr key={item.id}>
                <Table.Td fw={500}>{item.name}</Table.Td>
                <Table.Td>{item.quantity}個</Table.Td>
                <Table.Td>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      const value = new FormData(event.currentTarget).get("quantity");
                      const quantity = Number(value);
                      if (value !== "" && Number.isSafeInteger(quantity) && quantity >= 0) {
                        actions.onUpdate(item.id, quantity);
                      }
                    }}
                  >
                    <Group align="end" gap="sm" wrap="nowrap">
                      <NumberInput
                        allowDecimal={false}
                        allowNegative={false}
                        aria-label={`${item.name}の現在在庫数`}
                        defaultValue={item.quantity}
                        disabled={busy}
                        key={item.quantity}
                        min={0}
                        name="quantity"
                      />
                      <Button
                        aria-label={`${item.name}の在庫を更新`}
                        disabled={busy}
                        loading={busy && updatingMenuItemId === item.id}
                        type="submit"
                      >
                        更新する
                      </Button>
                    </Group>
                  </form>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    ) : null}
  </Stack>
);
