import { Container, Stack, Title } from "@mantine/core";

import { StaffAccountCard } from "../../../entities/staff";
import { NavigationUI } from "../../../widgets/layout";
import type { Staff } from "../../../entities/staff";

export type StaffPageUIProps = {
  staff: Staff;
  onRetry: () => void;
  onLogout: () => void;
};

export const StaffPageUI = ({ staff, onRetry, onLogout }: StaffPageUIProps) => (
  <Container py="lg" size="sm">
    <Stack>
      <Title order={1}>スタッフ</Title>
      <StaffAccountCard name={staff.name} email={staff.email} role={staff.role} onRetry={onRetry} onLogout={onLogout} />
      <NavigationUI role={staff.role} />
    </Stack>
  </Container>
);
