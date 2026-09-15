import { Container, Stack, Title } from "@mantine/core";

import { StaffAccountCard } from "../../../entities/staff";
import { NavigationUI } from "../../../widgets/layout";
import type { Staff } from "../../../entities/staff";

export type HomePageUIProps = {
  staff: Staff;
  logoutError: boolean;
  logoutPending: boolean;
  onRetry: () => void;
  onLogout: () => void;
};

export const HomePageUI = ({ staff, logoutError, logoutPending, onRetry, onLogout }: HomePageUIProps) => (
  <Container py="lg" size="sm">
    <Stack>
      <Title order={1}>スタッフ</Title>
      <StaffAccountCard
        name={staff.name}
        email={staff.email}
        role={staff.role}
        busy={logoutPending}
        failed={logoutError}
        onRetry={onRetry}
        onLogout={onLogout}
      />
      <NavigationUI role={staff.role} />
    </Stack>
  </Container>
);
