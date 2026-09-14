import { Container } from "@mantine/core";

import { LoadingNotice } from "../../../../shared/ui";

export const AuthLoadingUI = () => (
  <Container py="xl">
    <LoadingNotice>ログイン状態を確認しています</LoadingNotice>
  </Container>
);
