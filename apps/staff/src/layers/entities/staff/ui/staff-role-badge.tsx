import { Badge } from "@mantine/core";

import type { StaffRole } from "../model/staff";

const roleColor: Record<StaffRole, string> = { Owner: "grape", Admin: "red", Staff: "blue", None: "gray" };

export const StaffRoleBadge = ({ role }: { role: StaffRole }) => <Badge color={roleColor[role]}>{role}</Badge>;
