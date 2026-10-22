import { useQuery, useQueryClient, useQueryErrorResetBoundary } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";

import { staffQueries } from "../../../../entities/staff";
import { AuthErrorUI } from "./auth-error.ui";

export const AuthError = ({ error, reset }: ErrorComponentProps) => {
  const client = useQueryClient();
  const queryErrorReset = useQueryErrorResetBoundary();
  // 別の購読元が再取得しても、境界で捕捉したエラーの分類を変えない。
  const [isSessionError] = useState(() => error === client.getQueryState(staffQueries.current().queryKey)?.error);
  // 取得はせず、ヘッダーからのログアウトで未ログインが確定したことだけを受け取り、ログイン案内へ戻す。
  const session = useQuery({ ...staffQueries.current(), enabled: false });
  const loggedOut = session.status === "success" && session.data === null;

  useEffect(() => {
    if (isSessionError && loggedOut) {
      queryErrorReset.reset();
      reset();
    }
  }, [isSessionError, loggedOut, queryErrorReset, reset]);

  if (!isSessionError) {
    throw error;
  }

  return (
    <AuthErrorUI
      onRetry={() => {
        queryErrorReset.reset();
        reset();
      }}
    />
  );
};
