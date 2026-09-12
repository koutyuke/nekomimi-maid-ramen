import { Schema } from "effect";

import { Staff } from "../../features/staff/public";

export const SessionResponse = Schema.Struct({
  staff: Schema.NullOr(Staff).annotations({ description: "認証中の担当者。未認証の場合はnull" }),
}).annotations({ description: "現在の認証状態" });

export const AuthenticationRequiredResponse = Schema.Struct({
  code: Schema.Literal("authentication_required").annotations({ description: "認証が必要であることを表すコード" }),
}).annotations({ description: "担当者として認証されていない" });

export const ForbiddenResponse = Schema.Struct({
  code: Schema.Literal("forbidden").annotations({ description: "操作が許可されていないことを表すコード" }),
}).annotations({ description: "認証済みの担当者または送信元に操作が許可されていない" });

export const AuthenticationUnavailableResponse = Schema.Struct({
  code: Schema.Literal("authentication_unavailable").annotations({
    description: "認証を開始できないことを表すコード",
  }),
}).annotations({ description: "認証サービスを利用できない" });

export const GoogleSignInResponse = Schema.Struct({
  url: Schema.String.annotations({ description: "Googleの認証画面URL" }),
  redirect: Schema.Boolean.annotations({ description: "呼び出し側で認証画面へ移動する必要があるか" }),
}).annotations({ description: "Google認証の開始情報" });
