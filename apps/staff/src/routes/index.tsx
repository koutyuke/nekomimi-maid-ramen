import { createFileRoute } from "@tanstack/react-router";

import { HomePage } from "../layers/pages/home";
import { AuthGuard } from "../layers/widgets/auth-guard";

const Layout = () => (
  <AuthGuard unauthenticated="login-prompt">
    <HomePage />
  </AuthGuard>
);

export const Route = createFileRoute("/")({ component: Layout });
