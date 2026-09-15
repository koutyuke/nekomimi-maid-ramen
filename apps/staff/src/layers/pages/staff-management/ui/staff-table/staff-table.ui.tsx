import { Button, Group, NativeSelect, Table, Text } from "@mantine/core";

import { StaffRoleBadge } from "../../../../entities/staff";
import type { Staff, StaffRole } from "../../../../entities/staff";

export type StaffTableUIProps = {
  currentStaff: Pick<Staff, "id"> & { role: Extract<StaffRole, "Owner" | "Admin"> };
  members: readonly Staff[];
  busy: boolean;
  onUpdateRole: (id: string, role: Exclude<StaffRole, "Owner">) => void;
};

export const StaffTableUI = ({ currentStaff, members, busy, onUpdateRole }: StaffTableUIProps) => (
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
                  {member.role === "Owner" ? "Ownerのロールは変更できません。" : "自分自身のロールは変更できません。"}
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
);
