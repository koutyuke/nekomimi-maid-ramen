import { Anchor, Button, Container, Group } from "@mantine/core";
// import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useId, useState } from "react";

// import { staffQueries } from "../../../entities/staff";

export const Header = () => {
  const [opened, setOpened] = useState(false);
  const menuId = useId();
  // const staff = useQuery(staffQueries.current());
  return (
    <Container component="header" py="md" w="100%">
      <Group justify="space-between">
        <Anchor component={Link} to="/">
          猫耳メイドラーメン スタッフ
        </Anchor>
        <Button variant="default" aria-expanded={opened} aria-controls={menuId} onClick={() => setOpened(!opened)}>
          メニュー
        </Button>
      </Group>
    </Container>
  );
};
