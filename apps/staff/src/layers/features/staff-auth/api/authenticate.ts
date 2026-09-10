import { api } from "../../../shared/api";

export const signIn = async () => {
  const { data, error } = await api.auth.google.post();
  if (error) {
    throw new Error("ログインを開始できませんでした。");
  }
  window.location.assign(data.url);
};

export const signOut = async () => {
  const { error } = await api.auth.logout.post();
  if (error) {
    throw new Error("ログアウトできませんでした。");
  }
};
