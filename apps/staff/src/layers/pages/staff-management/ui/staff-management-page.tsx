import { useQuery } from "@tanstack/react-query";

import { staffQueries } from "../../../entities/staff";
import { StaffRoleManagement } from "../../../features/staff-role-management";
import { AdminGuard } from "../../../widgets/admin-guard";
import { StaffManagementPageUI } from "./staff-management-page.ui";

export const StaffManagementPage = () => {
  const staff = useQuery(staffQueries.current());
  const administrator =
    staff.data?.role === "Owner" || staff.data?.role === "Admin" ? { id: staff.data.id, role: staff.data.role } : null;

  return (
    <AdminGuard>
      {administrator ? (
        <StaffManagementPageUI
          administrator={administrator}
          onRetry={() => void staff.refetch()}
          slots={{
            roleManagement: <StaffRoleManagement currentStaff={administrator} />,
          }}
        />
      ) : null}
    </AdminGuard>
  );
};
