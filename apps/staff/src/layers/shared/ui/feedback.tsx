import { Alert, Flex, Group, Loader, Text } from "@mantine/core";
import type { ReactNode } from "react";

export const ErrorAlert = ({ children, title }: { children: ReactNode; title?: string }) => (
  <Alert color="red" role="alert" title={title}>
    {children}
  </Alert>
);

export const ConnectingIndicator = () => (
  <Flex display="flex" gap="4" align="center">
    <Loader size="xs" />
    <Text size="md" fw={500}>
      接続中
    </Text>
  </Flex>
);

export const LoadingNotice = ({ children }: { children: ReactNode }) => (
  <Group gap="sm" justify="center" py="lg">
    <Loader size="sm" />
    <Text c="dimmed" component="output">
      {children}
    </Text>
  </Group>
);
