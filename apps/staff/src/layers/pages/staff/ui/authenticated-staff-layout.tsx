import { Alert, Button, Container, Stack, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet } from "@tanstack/react-router";

import { staffQueries } from "../../../entities/staff";

export const AuthenticatedStaffLayout = () => {
  const staff = useQuery(staffQueries.current());
  if (staff.isPending) {
    return (
      <Container py="xl">
        <Text component="output">ログイン状態を確認しています</Text>
      </Container>
    );
  }
  if (staff.isError) {
    return (
      <Container py="xl">
        <Alert color="red" title="ログイン状態を確認できません" role="alert">
          <Stack align="flex-start">
            <Text>通信状況を確認して、もう一度お試しください。</Text>
            <Button
              onClick={() => {
                void staff.refetch();
              }}
            >
              再読み込み
            </Button>
          </Stack>
        </Alert>
      </Container>
    );
  }
  return staff.data === null ? <Navigate to="/" replace /> : <Outlet />;
};
