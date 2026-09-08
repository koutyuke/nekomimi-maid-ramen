import { Badge, Card, Group, Stack, Text } from "@mantine/core";

import type { MenuItem } from "../../model/menu";

export type MenuItemCardUIProps = {
  item: MenuItem;
};

// 未確認の商品へ「含まれない」と表示すると、食べられない商品を食べられると誤読させる。
const allergenLabel = ({ allergenCheckState, containedAllergens }: MenuItem): string => {
  if (allergenCheckState === "unchecked") {
    return "未確認";
  }

  if (containedAllergens.length === 0) {
    return "含まれない";
  }

  return containedAllergens.map((allergen) => allergen.name).join("・");
};

export const MenuItemCardUI = ({ item }: MenuItemCardUIProps) => (
  <Card withBorder padding="md" radius="md">
    <Stack gap="xs">
      <Group align="flex-start" justify="space-between" wrap="nowrap">
        <Text component="h3" fw={700} size="lg">
          {item.name}
        </Text>
        <Text fw={700} size="lg" style={{ whiteSpace: "nowrap" }}>
          {item.price.toLocaleString("ja-JP")}円
        </Text>
      </Group>

      <Group gap="xs">
        {/* 色を判別できない環境でも読めるよう、販売可否は文字で示す。 */}
        <Badge color={item.sellable ? "teal" : "gray"} variant="light">
          {item.sellable ? "販売中" : "売り切れ"}
        </Badge>
      </Group>

      {item.description === null ? null : (
        <Text c="dimmed" size="sm">
          {item.description}
        </Text>
      )}

      <Text size="sm">特定原材料: {allergenLabel(item)}</Text>
    </Stack>
  </Card>
);
