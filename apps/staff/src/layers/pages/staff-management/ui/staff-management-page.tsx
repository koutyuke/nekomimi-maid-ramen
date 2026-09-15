import { useStaffManagement } from "../model/use-staff-management";
import { StaffManagementPageUI } from "./staff-management-page.ui";

export const StaffManagementPage = () => {
  const state = useStaffManagement();
  if (!state) {
    return null;
  }

  return (
    <StaffManagementPageUI
      currentStaff={state.currentStaff}
      members={state.members}
      roleUpdate={state.roleUpdate}
      onRetry={state.retry}
      onUpdateRole={state.update}
    />
  );
};
