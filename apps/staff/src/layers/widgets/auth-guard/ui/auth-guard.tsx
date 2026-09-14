import { QueryErrorResetBoundary, useSuspenseQuery } from "@tanstack/react-query";
import { CatchBoundary, Navigate } from "@tanstack/react-router";
import { Suspense } from "react";
import type { ComponentProps, ReactNode } from "react";

import { staffQueries } from "../../../entities/staff";
import { AuthError } from "./auth-error/auth-error";
import { AuthLoadingUI } from "./auth-loading/auth-loading.ui";
import { LoginPrompt } from "./login-prompt/login-prompt";

type AuthenticatedProps = {
  children: ReactNode;
  unauthenticated?: "redirect" | "login-prompt";
  redirectTo: ComponentProps<typeof Navigate>["to"];
};

const Authenticated = ({ children, unauthenticated, redirectTo = "/" }: AuthenticatedProps) => {
  const { data: staff, error, isFetching } = useSuspenseQuery(staffQueries.current());

  // キャッシュがある再取得エラーも扱い、再試行中は古い認証情報で子を表示しない。
  if (error) {
    if (!isFetching) {
      throw error;
    }
    return <AuthLoadingUI />;
  }

  if (staff === null) {
    return unauthenticated === "login-prompt" ? <LoginPrompt /> : <Navigate to={redirectTo} replace />;
  }
  return children;
};

type AuthGuardProps = {
  children: ReactNode;
  unauthenticated?: "redirect" | "login-prompt";
  redirectTo?: ComponentProps<typeof Navigate>["to"];
};

export const AuthGuard = ({ children, unauthenticated = "redirect", redirectTo = "/" }: AuthGuardProps) => (
  <QueryErrorResetBoundary>
    <CatchBoundary getResetKey={() => "auth"} errorComponent={AuthError}>
      <Suspense fallback={<AuthLoadingUI />}>
        <Authenticated unauthenticated={unauthenticated} redirectTo={redirectTo}>
          {children}
        </Authenticated>
      </Suspense>
    </CatchBoundary>
  </QueryErrorResetBoundary>
);
