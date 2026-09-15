import { Container, Stack } from "@mantine/core";

import { StaffAccountCard } from "../../../entities/staff";
import { NavigationUI } from "../../../widgets/layout";
import type { Staff } from "../../../entities/staff";

export const HomePageUI = ({ staff }: { staff: Staff }) => (
  <Container py="lg" size="md">
    <Stack>
      <StaffAccountCard name={staff.name} email={staff.email} role={staff.role} />
      <NavigationUI role={staff.role} />
    </Stack>
  </Container>
);
