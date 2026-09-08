import { Button, Container, Group, Loader, Stack, Text, Title } from "@mantine/core";

import { groupByCategory, MENU_CATEGORY_LABEL, MenuItemCardUI } from "../../../entities/menu";
import type { MenuItem } from "../../../entities/menu";

export type MenuPageUIProps = {
  items: readonly MenuItem[];
  loading: boolean;
  failed: boolean;
  actions: {
    onRetry: () => void;
  };
};

export const MenuPageUI = ({ items, loading, failed, actions }: MenuPageUIProps) => (
  <Container py="md" size="sm">
    <Stack gap="lg">
      <Title order={1}>メニュー</Title>

      {loading ? (
        <Group gap="xs">
          <Loader size="sm" />
          <Text>メニューを読み込んでいます</Text>
        </Group>
      ) : null}

      {failed ? (
        <Stack align="flex-start" gap="sm">
          {/* 失敗の原因は来場者の判断に使えないため、次の行動だけを伝える。 */}
          <Text>メニューを表示できません。通信状況を確認して、もう一度お試しください。</Text>
          <Button onClick={actions.onRetry}>再読み込み</Button>
        </Stack>
      ) : null}

      {!loading && !failed && items.length === 0 ? <Text>表示できる商品がありません。</Text> : null}

      {groupByCategory(items).map(({ category, items: categoryItems }) => (
        <Stack gap="sm" key={category}>
          <Title order={2} size="h3">
            {MENU_CATEGORY_LABEL[category]}
          </Title>
          {categoryItems.map((item) => (
            <MenuItemCardUI item={item} key={item.id} />
          ))}
        </Stack>
      ))}
    </Stack>
  </Container>
);
