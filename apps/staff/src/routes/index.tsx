import { createFileRoute } from "@tanstack/react-router";

import { StaffPage } from "../layers/pages/staff";
import { AuthGuard } from "../layers/widgets/auth-guard";

const Layout = () => (
  <AuthGuard unauthenticated="login-prompt">
    <StaffPage />
  </AuthGuard>
);

export const Route = createFileRoute("/")({ component: Layout });
