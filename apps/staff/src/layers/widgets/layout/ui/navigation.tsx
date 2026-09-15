import { NavLink, Paper, SimpleGrid, Stack, Title } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { JSX } from "react/jsx-runtime";

import { getNavigationGroups } from "../model/navigation";
import type { StaffRole } from "../../../entities/staff";

type NavigationProps = {
  role: StaffRole;
};

export const NavigationUI = ({ role }: NavigationProps): JSX.Element => (
  <Stack gap="sm">
    {getNavigationGroups(role).map(({ title, navigations }) => (
      <Stack gap="sm" key={title}>
        <Title order={2} size="h4">
          {title}
        </Title>
        <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
          {navigations.map((navigation) => (
            <Paper key={navigation.href} radius="md" style={{ overflow: "hidden" }} withBorder>
              <NavLink
                aria-label={navigation.label}
                component={Link}
                description={navigation.description}
                h="100%"
                label={navigation.label}
                p="md"
                to={navigation.href}
                rightSection={<ChevronRight size={20} color="var(--mantine-color-dimmed)" />}
              />
            </Paper>
          ))}
        </SimpleGrid>
      </Stack>
    ))}
  </Stack>
);
