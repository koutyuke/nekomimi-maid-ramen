import { Anchor, Container, Group } from "@mantine/core";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

type HeaderUIProps = {
  hamburgerMenu: ReactNode;
};

export const HeaderUI = ({ hamburgerMenu }: HeaderUIProps) => {
  return (
    <Container size="md" h="100%">
      <Group justify="space-between" h="100%">
        <Anchor
          component={Link}
          to="/"
          c="gray.7"
          fw={700}
          size="2rem"
          underline="never"
          miw={44}
          mih={44}
          display="inline-flex"
          style={{ alignItems: "center" }}
        >
          Staff
        </Anchor>
        {hamburgerMenu}
      </Group>
    </Container>
  );
};
