import { Badge, Button, Group, Paper, Stack, Text } from "@mantine/core";

import { cookingStateLabels } from "../../../../entities/kitchen";
import type { HandoffOrderLine } from "../../../../entities/handoff";
import type { CookingState } from "../../../../entities/kitchen";

const cookingStateColors = { unstarted: "gray", cooking: "orange", completed: "green" } as const;

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
}: HandoffOrderLineUIProps) => (
  <Paper component="section" aria-label={line.name} withBorder p="sm" radius="sm">
    <Stack gap="xs">
      <Group justify="space-between">
        <Text style={{ overflowWrap: "anywhere" }}>
          {line.name} × {line.quantity}
        </Text>
        <Badge color={cookingStateColors[line.cookingState]}>{cookingStateLabels[line.cookingState]}</Badge>
      </Group>
      {editable && line.cookingState === "unstarted" ? (
        <Button
          color="blue.8"
          mih={44}
          disabled={disabled}
          aria-label={`注文${orderNumber}の${line.name}の調理を開始`}
          onClick={() => onUpdate("cooking")}
        >
          調理を開始
        </Button>
      ) : null}
      {editable && line.cookingState === "cooking" ? (
        <Group grow>
          <Button
            color="blue.8"
            mih={44}
            disabled={disabled}
            aria-label={`注文${orderNumber}の${line.name}を完成`}
            onClick={() => onUpdate("completed")}
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
      ) : null}
    </Stack>
  </Paper>
);
