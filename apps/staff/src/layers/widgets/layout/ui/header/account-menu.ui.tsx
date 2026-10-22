import { Button, Stack } from "@mantine/core";

import { StaffAccountCard } from "../../../../entities/staff";
import { ErrorAlert } from "../../../../shared/ui";
import { NavigationUI } from "../navigation/navigation.ui";
import type { Staff } from "../../../../entities/staff";

type AccountMenuUIProps = {
  // `null`はアカウント情報を取得できなかった状態を表す。
  staff: Staff | null;
  logoutStatus: "idle" | "pending" | "error" | "success";
  onLogout: () => void;
  onNavigate?: (() => void) | undefined;
};

export const AccountMenuUI = ({ staff, logoutStatus, onLogout, onNavigate }: AccountMenuUIProps) => {
  return (
    <Stack>
      {staff ? (
        <>
          <StaffAccountCard name={staff.name} email={staff.email} role={staff.role} />
          <NavigationUI role={staff.role} onNavigate={onNavigate} />
        </>
      ) : (
        <ErrorAlert title="アカウント情報を取得できませんでした">
          再読み込みで回復しない場合は、ログアウトしてからログインし直してください。
        </ErrorAlert>
      )}
      {logoutStatus === "error" && (
        <ErrorAlert title="ログアウトできませんでした">通信状況を確認して、もう一度お試しください。</ErrorAlert>
      )}
      <Button
        loading={logoutStatus === "pending"}
        disabled={logoutStatus === "pending"}
        onClick={onLogout}
        color="red"
        mih={44}
      >
        ログアウト
      </Button>
    </Stack>
  );
};
