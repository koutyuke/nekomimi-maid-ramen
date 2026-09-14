import { useQueryClient, useQueryErrorResetBoundary } from "@tanstack/react-query";
import type { ErrorComponentProps } from "@tanstack/react-router";

import { staffQueries } from "../../../../entities/staff";
import { AuthErrorUI } from "./auth-error.ui";

export const AuthError = ({ error, reset }: ErrorComponentProps) => {
  const client = useQueryClient();
  const queryErrorReset = useQueryErrorResetBoundary();

  if (error !== client.getQueryState(staffQueries.current().queryKey)?.error) {
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
