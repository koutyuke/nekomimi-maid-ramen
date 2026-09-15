import { NavLink, Paper, SimpleGrid, Stack, Title } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { getNavigationGroups } from "../../model/navigation";
import type { StaffRole } from "../../../../entities/staff";

type NavigationUIProps = {
  role: StaffRole;
  onNavigate?: (() => void) | undefined;
};

export const NavigationUI = ({ role, onNavigate }: NavigationUIProps) => {
  return (
    <Stack gap="sm">
      {getNavigationGroups(role).map(({ title, navigations }) => (
        <Stack gap="sm" key={title}>
          <Title order={2} size="h4">
            {title}
          </Title>
          <SimpleGrid type="container" cols={{ base: 1, "30em": 2 }} spacing="sm">
            {navigations.map((navigation) => (
              <Paper key={navigation.href} radius="md" style={{ overflow: "hidden" }} withBorder>
                <NavLink
                  component={Link}
                  to={navigation.href}
                  onClick={() => onNavigate?.()}
                  aria-label={navigation.label}
                  description={navigation.description}
                  h="100%"
                  label={navigation.label}
                  p="md"
                  rightSection={<ChevronRight size={20} color="var(--mantine-color-dimmed)" aria-hidden="true" />}
                />
              </Paper>
            ))}
          </SimpleGrid>
        </Stack>
      ))}
    </Stack>
  );
};
