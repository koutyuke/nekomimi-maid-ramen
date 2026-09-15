import { useMutation } from "@tanstack/react-query";

import { login } from "../../../../features/auth";
import { LoginPromptUI } from "./login-prompt.ui";

export const LoginPrompt = () => {
  const loginMutation = useMutation({ mutationFn: login });
  const loginFailed = loginMutation.isError || new URLSearchParams(window.location.search).has("error");

  return (
    <LoginPromptUI loginFailed={loginFailed} busy={loginMutation.isPending} onLogin={() => loginMutation.mutate()} />
  );
};
