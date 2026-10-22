import { Button, Group, NumberInput, Table } from "@mantine/core";

import { yen } from "../../../../shared/lib";
import type { MenuItem } from "../../../../entities/menu";

export type PriceTableUIProps = {
  items: readonly MenuItem[];
  busy: boolean;
  updatingMenuItemId: string | null;
  onUpdate: (menuItemId: string, price: number) => void;
};

// スマートフォンの縦向きでも横スクロールせずに操作できるよう、入力欄とボタンの幅を固定する。
export const PriceTableUI = ({ items, busy, updatingMenuItemId, onUpdate }: PriceTableUIProps) => (
  <Table aria-label="商品別価格" highlightOnHover verticalSpacing="sm" withTableBorder>
    <Table.Thead>
      <Table.Tr>
        <Table.Th>商品</Table.Th>
        <Table.Th>現在価格</Table.Th>
        <Table.Th>更新</Table.Th>
      </Table.Tr>
    </Table.Thead>
    <Table.Tbody>
      {items.map((item) => (
        <Table.Tr key={item.id}>
          <Table.Td fw={500}>{item.name}</Table.Td>
          <Table.Td>{yen(item.price)}</Table.Td>
          <Table.Td>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const value = new FormData(event.currentTarget).get("price");
                const price = Number(value);
                if (value !== "" && Number.isSafeInteger(price) && price >= 1) {
                  onUpdate(item.id, price);
                }
              }}
            >
              <Group gap="xs" wrap="nowrap">
                <NumberInput
                  allowDecimal={false}
                  allowNegative={false}
                  aria-label={`${item.name}の価格`}
                  defaultValue={item.price}
                  disabled={busy}
                  hideControls
                  key={item.price}
                  min={1}
                  name="price"
                  w={80}
                />
                <Button
                  aria-label={`${item.name}の価格を更新`}
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
