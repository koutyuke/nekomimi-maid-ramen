import { useQueryClient, useQueryErrorResetBoundary } from "@tanstack/react-query";
import { useState } from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";

import { staffQueries } from "../../../../entities/staff";
import { AuthErrorUI } from "./auth-error.ui";

export const AuthError = ({ error, reset }: ErrorComponentProps) => {
  const client = useQueryClient();
  const queryErrorReset = useQueryErrorResetBoundary();
  // 別の購読元が再取得しても、境界で捕捉したエラーの分類を変えない。
  const [isSessionError] = useState(() => error === client.getQueryState(staffQueries.current().queryKey)?.error);

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
