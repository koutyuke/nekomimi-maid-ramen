import { Button, Group, NumberInput, Table } from "@mantine/core";

import type { MenuItem } from "../../../../entities/menu";

export type StockTableUIProps = {
  items: readonly MenuItem[];
  busy: boolean;
  updatingMenuItemId: string | null;
  onUpdate: (menuItemId: string, quantity: number) => void;
};

// スマートフォンの縦向きでも横スクロールせずに操作できるよう、入力欄とボタンの幅を固定する。
export const StockTableUI = ({ items, busy, updatingMenuItemId, onUpdate }: StockTableUIProps) => (
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
                  onUpdate(item.id, quantity);
                }
              }}
            >
              <Group gap="xs" wrap="nowrap">
                <NumberInput
                  allowDecimal={false}
                  allowNegative={false}
                  aria-label={`${item.name}の現在在庫数`}
                  defaultValue={item.quantity}
                  disabled={busy}
                  hideControls
                  key={item.quantity}
                  min={0}
                  name="quantity"
                  w={80}
                />
                <Button
                  aria-label={`${item.name}の在庫を更新`}
                  disabled={busy}
                  loading={busy && updatingMenuItemId === item.id}
                  px="sm"
                  type="submit"
                >
                  更新
                </Button>
              </Group>
            </form>
          </Table.Td>
        </Table.Tr>
      ))}
    </Table.Tbody>
  </Table>
);
