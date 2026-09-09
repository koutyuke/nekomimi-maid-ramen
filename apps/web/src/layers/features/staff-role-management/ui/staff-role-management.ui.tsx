import { Alert, Button, Group, Loader, NativeSelect, Stack, Table, Text, Title } from "@mantine/core";
import { useState } from "react";
import type { ReactNode } from "react";

import { StaffRoleBadge } from "../../../entities/staff";
import type { Staff, StaffRole } from "../../../entities/staff";

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

export type StaffRoleManagementUIProps = {
  currentStaff: Pick<Staff, "id"> & { role: Extract<StaffRole, "Owner" | "Admin"> };
  members: readonly Staff[];
  loading: boolean;
  failed: boolean;
  busy: boolean;
  updateFailed: boolean;
  updateResult: Pick<Staff, "name" | "role"> | null;
  actions: {
    onRetry: () => void;
    onUpdateRole: (id: string, role: Exclude<StaffRole, "Owner">) => void;
  };
};

export const StaffRoleManagementUI = ({
  currentStaff,
  members,
  loading,
  failed,
  busy,
  updateFailed,
  updateResult: result,
  actions: { onRetry, onUpdateRole },
}: StaffRoleManagementUIProps) => (
  <Stack gap="md">
    <Group align="flex-start" gap="sm" justify="space-between" wrap="wrap">
      <Stack gap={4}>
        <Title order={2} size="h4">
          ロール管理
        </Title>
        <Text c="dimmed" size="sm">
          Staffの付与・剥奪はOwnerとAdminが行えます。Adminの付与・剥奪はOwnerだけが行えます。
          <br />
          権限を外す場合はNoneにしてください。
        </Text>
      </Stack>
      <Button disabled={busy} onClick={onRetry} variant="light">
        利用者一覧を再読み込み
      </Button>
    </Group>

    {failed ? (
      <DismissibleAlert closeButtonLabel="エラーを閉じる" color="red" title="利用者一覧を取得できません">
        権限と通信状況を確認して再試行してください。
      </DismissibleAlert>
    ) : null}
    {updateFailed ? (
      <DismissibleAlert closeButtonLabel="エラーを閉じる" color="red" title="ロールを変更できませんでした">
        権限と通信状況を確認し、もう一度お試しください。
      </DismissibleAlert>
    ) : null}
    {result && !updateFailed ? (
      <DismissibleAlert
        closeButtonLabel="更新結果を閉じる"
        color="green"
        feedbackRole="status"
        title="ロールを変更しました"
      >
        {result.name}のロールを{result.role}に変更しました。
      </DismissibleAlert>
    ) : null}

    {loading ? (
      <Group gap="sm" justify="center" py="lg">
        <Loader size="sm" />
        <Text c="dimmed" component="output">
          利用者一覧を読み込んでいます
        </Text>
      </Group>
    ) : null}

    {!loading && !failed ? (
      <Table.ScrollContainer minWidth={760}>
        <Table aria-label="利用者一覧" highlightOnHover verticalSpacing="sm" withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>氏名</Table.Th>
              <Table.Th>メールアドレス</Table.Th>
              <Table.Th>ロール</Table.Th>
              <Table.Th>ロール変更</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {members.map((member) => (
              <Table.Tr key={member.id}>
                <Table.Td fw={500}>{`${member.name}${member.id === currentStaff.id ? " (You)" : ""}`}</Table.Td>
                <Table.Td c="dimmed">{member.email}</Table.Td>
                <Table.Td>
                  <StaffRoleBadge role={member.role} />
                </Table.Td>
                <Table.Td>
                  {member.role === "Owner" || member.id === currentStaff.id ? (
                    <Text c="dimmed" size="sm">
                      {member.role === "Owner"
                        ? "Ownerのロールは変更できません。"
                        : "自分自身のロールは変更できません。"}
                    </Text>
                  ) : member.role === "Admin" && currentStaff.role !== "Owner" ? (
                    <Text c="dimmed" size="sm">
                      AdminのロールはOwnerだけが変更できます。
                    </Text>
                  ) : (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        const role = new FormData(event.currentTarget).get("role");
                        if (role === "Admin" || role === "Staff" || role === "None") {
                          onUpdateRole(member.id, role);
                        }
                      }}
                    >
                      <Group align="end" gap="sm" wrap="nowrap">
                        <NativeSelect
                          aria-label={`${member.name}のロール`}
                          data={currentStaff.role === "Owner" ? ["None", "Staff", "Admin"] : ["None", "Staff"]}
                          defaultValue={member.role}
                          disabled={busy}
                          key={member.role}
                          name="role"
                          size="sm"
                        />
                        <Button aria-label={`${member.name}のロールを変更`} disabled={busy} size="sm" type="submit">
                          変更する
                        </Button>
                      </Group>
                    </form>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    ) : null}
  </Stack>
);
