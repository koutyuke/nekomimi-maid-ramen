import { ActionIcon, Avatar, Drawer } from "@mantine/core";
import { useId, useState } from "react";

import { AccountMenuUI } from "./account-menu.ui";
import type { Staff } from "../../../../entities/staff";

type HamburgerMenuUIProps = {
  staff: Staff | null;
  sessionStatus: "pending" | "error" | "success";
  logoutStatus: "idle" | "pending" | "error" | "success";
  onLogout: () => void;
};

export const HamburgerMenuUI = ({ staff, sessionStatus, logoutStatus, onLogout }: HamburgerMenuUIProps) => {
  const [opened, setOpened] = useState(false);
  const menuId = useId();

  if (opened && (sessionStatus !== "success" || !staff)) {
    setOpened(false);
  }

  if (sessionStatus === "error") {
    return (
      <Avatar
        component="output"
        aria-label="アカウント情報を取得できませんでした"
        variant="light"
        radius="xl"
        color="red"
        src=""
        size={44}
      />
    );
  }

  if (sessionStatus !== "success" || !staff) {
    return (
      <Avatar
        component="output"
        aria-label={sessionStatus === "pending" ? "ログイン状態を確認しています" : "ログインしていません"}
        variant="light"
        radius="xl"
        color="gray"
        src=""
        size={44}
      />
    );
  }

  return (
    <>
      <ActionIcon
        variant="transparent"
        radius="xl"
        size={44}
        aria-label="アカウントメニュー"
        aria-expanded={opened}
        aria-controls={`${menuId}-body`}
        aria-haspopup="dialog"
        onClick={() => setOpened((value) => !value)}
      >
        <Avatar name={staff.name} color="initials" radius="xl" size={44} aria-hidden="true" />
      </ActionIcon>
      <Drawer
        id={menuId}
        title="アカウントメニュー"
        position="right"
        size="sm"
        opened={opened}
        onClose={() => setOpened(false)}
        closeButtonProps={{ "aria-label": "メニューを閉じる", size: 44 }}
      >
        <AccountMenuUI
          staff={staff}
          logoutStatus={logoutStatus}
          onLogout={onLogout}
          onNavigate={() => setOpened(false)}
        />
      </Drawer>
    </>
  );
};
