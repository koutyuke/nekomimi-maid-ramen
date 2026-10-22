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
  // 取得失敗時もメニューを開けるようにし、ログアウトで壊れたセッションを捨てられるようにする。
  const menuKind = sessionStatus === "error" ? "error" : sessionStatus === "success" && staff ? "account" : null;
  const [shownMenuKind, setShownMenuKind] = useState(menuKind);
  if (menuKind !== shownMenuKind) {
    setShownMenuKind(menuKind);
    setOpened(false);
  }

  if (!menuKind) {
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
  const account = menuKind === "account" ? staff : null;
  return (
    <>
      <ActionIcon
        variant="transparent"
        radius="xl"
        size={44}
        aria-label={account ? "アカウントメニュー" : "アカウントメニュー（アカウント情報を取得できませんでした）"}
        aria-expanded={opened}
        aria-controls={`${menuId}-body`}
        aria-haspopup="dialog"
        onClick={() => setOpened((value) => !value)}
      >
        {account ? (
          <Avatar name={account.name} color="initials" radius="xl" size={44} aria-hidden="true" />
        ) : (
          <Avatar variant="light" radius="xl" color="red" src="" size={44} aria-hidden="true" />
        )}
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
          staff={account}
          logoutStatus={logoutStatus}
          onLogout={onLogout}
          onNavigate={() => setOpened(false)}
        />
      </Drawer>
    </>
  );
};
