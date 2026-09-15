import { Alert, Button, Container, Group, Stack, Text, Title } from "@mantine/core";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

import { LoadingNotice } from "../../../shared/ui";
import { StaffTableUI } from "./staff-table/staff-table.ui";
import type { StaffListState, RoleUpdateState } from "../model/use-staff-management";
import type { StaffTableUIProps } from "./staff-table/staff-table.ui";

const DismissibleAlert = ({
  children,
  closeButtonLabel,
  color,
  title,
  feedbackRole = "alert",
}: {
  children: ReactNode;
  closeButtonLabel: string;
  color: "green" | "red";
  title: string;
  feedbackRole?: "alert" | "status";
}) => {
  const [visible, setVisible] = useState(true);
  return visible ? (
    <Alert
      closeButtonLabel={closeButtonLabel}
      color={color}
      onClose={() => setVisible(false)}
      role={feedbackRole}
      title={title}
      variant="light"
      withCloseButton
    >
      {children}
    </Alert>
  ) : null;
};

export type StaffManagementPageUIProps = Pick<StaffTableUIProps, "currentStaff" | "onUpdateRole"> & {
  members: StaffListState;
  roleUpdate: RoleUpdateState;
  onRetry: () => void;
};

export const StaffManagementPageUI = ({
  currentStaff,
  members,
  roleUpdate,
  onUpdateRole,
  onRetry,
}: StaffManagementPageUIProps) => (
  <Container py="xl" size="lg">
    <Stack>
      <Group align="flex-end" gap="sm" justify="space-between">
        <Title order={1}>スタッフ管理</Title>
        <Button
          aria-label="再読み込み"
          disabled={roleUpdate.status === "pending"}
          onClick={onRetry}
          variant="light"
          h={44}
          w={44}
          p={0}
        >
          <RefreshCw size={20} />
        </Button>
      </Group>
      <Stack gap="md">
        <Text c="dimmed" size="sm">
          Staffの付与・剥奪はOwnerとAdminが行えます。Adminの付与・剥奪はOwnerだけが行えます。
          <br />
          権限を外す場合はNoneにしてください。
        </Text>

        {members.status === "error" && (
          <DismissibleAlert closeButtonLabel="エラーを閉じる" color="red" title="利用者一覧を取得できません">
            権限と通信状況を確認して再試行してください。
          </DismissibleAlert>
        )}
        {roleUpdate.status === "error" && (
          <DismissibleAlert closeButtonLabel="エラーを閉じる" color="red" title="ロールを変更できませんでした">
            権限と通信状況を確認し、もう一度お試しください。
          </DismissibleAlert>
        )}
        {roleUpdate.status === "success" && (
          <DismissibleAlert
            closeButtonLabel="更新結果を閉じる"
            color="green"
            feedbackRole="status"
            title="ロールを変更しました"
          >
            {roleUpdate.result.name}のロールを{roleUpdate.result.role}に変更しました。
          </DismissibleAlert>
        )}

        {members.status === "pending" && <LoadingNotice>利用者一覧を読み込んでいます</LoadingNotice>}

        {members.status === "success" && (
          <StaffTableUI
            currentStaff={currentStaff}
            members={members.data}
            busy={roleUpdate.status === "pending"}
            onUpdateRole={onUpdateRole}
          />
        )}
      </Stack>
    </Stack>
  </Container>
);
