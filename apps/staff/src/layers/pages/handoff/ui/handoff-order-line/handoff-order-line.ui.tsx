import { Badge, Button, Flex, Group, Modal, Paper, Stack, Text } from "@mantine/core";
import { useState } from "react";

import { cookingStateLabels } from "../../../../entities/kitchen";
import type { HandoffOrderLine } from "../../../../entities/handoff";
import type { CookingState } from "../../../../entities/kitchen";

type HandoffOrderLineUIProps = {
  line: HandoffOrderLine;
  orderNumber: number;
  // 受け渡し担当が調理を進められるのはドリンクだけなので、それ以外は表示に留める。
  editable: boolean;
  disabled: boolean;
  actions: { onUpdate: (to: CookingState) => void };
};

export const HandoffOrderLineUI = ({
  line,
  orderNumber,
  editable,
  disabled,
  actions: { onUpdate },
}: HandoffOrderLineUIProps) => {
  const [opened, setOpened] = useState(false);
  const canComplete = editable && line.cookingState === "cooking";
  if (opened && !canComplete) {
    setOpened(false);
  }
  return (
    <Paper component="section" aria-label={line.name} withBorder p="sm" radius="sm">
      {canComplete && (
        <Modal
          opened={opened}
          onClose={() => setOpened(false)}
          title="完成にしてよいですか？"
          centered
          closeButtonProps={{ "aria-label": "確認を閉じる" }}
        >
          <Stack>
            <Text fw={700}>
              注文{orderNumber}：{line.name} × {line.quantity}個
            </Text>
            <Text>完成にすると、未調理・調理中には戻せません。</Text>
            <Button
              mih={44}
              disabled={disabled || !opened}
              onClick={() => {
                if (disabled || !opened) {
                  return;
                }
                setOpened(false);
                onUpdate("completed");
              }}
            >
              はい、完成にする
            </Button>
            <Button variant="default" mih={44} data-autofocus onClick={() => setOpened(false)}>
              キャンセル
            </Button>
          </Stack>
        </Modal>
      )}

      <Stack gap="xs">
        <Group justify="space-between">
          <Flex align="center" gap={4}>
            <Text fw={600} size="lg">
              {line.name}
            </Text>
            ×
            <Text fw={600} size="lg">
              {line.quantity}
            </Text>
          </Flex>
          <Badge
            color={line.cookingState === "completed" ? "green" : line.cookingState === "cooking" ? "blue" : "gray"}
          >
            {cookingStateLabels[line.cookingState]}
          </Badge>
        </Group>
        {editable && line.cookingState === "unstarted" && (
          <Button
            mih={44}
            disabled={disabled}
            aria-label={`注文${orderNumber}の${line.name}の調理を開始`}
            onClick={() => onUpdate("cooking")}
          >
            調理を開始
          </Button>
        )}
        {editable && line.cookingState === "cooking" && (
          <Group grow>
            <Button
              mih={44}
              disabled={disabled}
              aria-label={`注文${orderNumber}の${line.name}を完成`}
              onClick={() => setOpened(true)}
            >
              完成
            </Button>

            <Button
              variant="default"
              mih={44}
              disabled={disabled}
              aria-label={`注文${orderNumber}の${line.name}を未調理に戻す`}
              onClick={() => onUpdate("unstarted")}
            >
              未調理に戻す
            </Button>
          </Group>
        )}
      </Stack>
    </Paper>
  );
};
