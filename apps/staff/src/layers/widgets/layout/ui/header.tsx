import { Anchor, Button, Container, Group, Paper, Stack } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useId, useState } from "react";

import { StaffAccountCard, staffQueries } from "../../../entities/staff";
import { useAuth } from "../../../features/auth";
import { NavigationUI } from "./navigation";

export const Header = () => {
  const [opened, setOpened] = useState(false);
  const menuId = useId();
  const staff = useQuery(staffQueries.current());
  const { logout, logoutError, logoutPending } = useAuth();
  return (
    <Container component="header" py="md" w="100%" size="md">
      <Stack>
        <Group justify="space-between">
          <Anchor component={Link} to="/">
            猫耳メイドラーメン スタッフ
          </Anchor>
          <Button variant="default" aria-expanded={opened} aria-controls={menuId} onClick={() => setOpened(!opened)}>
            メニュー
          </Button>
        </Group>
        {opened && (
          <Paper component="section" aria-label="スタッフメニュー" id={menuId} p="md" withBorder>
            <Stack>
              {staff.data ? (
                <>
                  <StaffAccountCard
                    name={staff.data.name}
                    email={staff.data.email}
                    role={staff.data.role}
                    busy={logoutPending}
                    failed={logoutError}
                    onRetry={() => void staff.refetch()}
                    onLogout={logout}
                  />
                  <NavigationUI role={staff.data.role} />
                </>
              ) : (
                <Anchor component={Link} to="/">
                  ログイン画面へ
                </Anchor>
              )}
            </Stack>
          </Paper>
        )}
      </Stack>
    </Container>
  );
};
