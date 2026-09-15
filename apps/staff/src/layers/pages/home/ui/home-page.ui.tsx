import { Container, Stack, Title } from "@mantine/core";

import { StaffAccountCard } from "../../../entities/staff";
import { NavigationUI } from "../../../widgets/layout";
import type { Staff } from "../../../entities/staff";

export type HomePageUIProps = {
  staff: Staff;
  logoutStatus: "idle" | "pending" | "error" | "success";
  onRetry: () => void;
  onLogout: () => void;
};

export const HomePageUI = ({ staff, logoutStatus, onRetry, onLogout }: HomePageUIProps) => (
  <Container py="lg" size="sm">
    <Stack>
      <Title order={1}>スタッフ</Title>
      <StaffAccountCard
        name={staff.name}
        email={staff.email}
        role={staff.role}
        busy={logoutStatus === "pending"}
        failed={logoutStatus === "error"}
        onRetry={onRetry}
        onLogout={onLogout}
      />
      <NavigationUI role={staff.role} />
    </Stack>
  </Container>
);
