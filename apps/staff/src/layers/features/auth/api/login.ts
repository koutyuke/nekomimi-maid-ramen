import { api } from "../../../shared/api";

export const login = async () => {
  const { data, error } = await api.auth.google.post();
  if (error) {
    throw new Error("ログインを開始できませんでした。");
  }
  window.location.assign(data.url);
};
