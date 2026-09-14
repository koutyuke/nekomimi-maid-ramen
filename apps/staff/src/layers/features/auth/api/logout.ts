import { api } from "../../../shared/api";

export const logout = async () => {
  const { error } = await api.auth.logout.post();
  if (error) {
    throw new Error("ログアウトできませんでした。");
  }
};
