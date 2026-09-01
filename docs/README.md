# 猫耳メイドラーメン

文化祭のクラス出店において、来場者への情報提供と、注文受付から調理、受け渡しまでの連携を支援する Web アプリケーションである。

注文は、来場者が注文兼会計口で商品と個数を伝え、会計担当者が画面へ入力する。注文確定時に在庫を減らし、調理担当者へ共有する。

現在の要件はすべて草案である。実装判断の前に、[リリースを止めている未決事項](meta/releases/PROFILE-INITIAL.toml)を確認する。

## 文書の構成

| 場所                              | 役割                   | 主な内容                                       | 正本の形式     |
| --------------------------------- | ---------------------- | ---------------------------------------------- | -------------- |
| [`product/`](product/overview.md) | プロジェクトを理解する | 目的、利用者、体験、ユースケース、用語         | Markdown       |
| [`meta/`](meta/requirements/)     | 要件と判断を管理する   | 要件、判断、未決事項、根拠、機能計画、提供範囲 | TOML、Markdown |
| [`specs/`](specs/sales.md)        | 振る舞いを定義する     | 操作、状態、データ、例外、品質条件、受け入れ例 | Markdown       |

同じ内容を複数の層へ書かない。要件は`REQ-*`、検証可能な振る舞いは`SPEC-*`を正本とし、IDで関連付ける。

## 読み方

- 初めて参加する人は、[プロジェクト概要](product/overview.md) → [利用者](product/users.md) → [体験](product/experience.md)の順に読む。
- 要件を判断する人は、対象領域の[`meta/requirements/`](meta/requirements/)と[`meta/questions/`](meta/questions/)を確認する。
- 実装・検証する人は、要件の`specs`に記載された`SPEC-*`を対象領域の[`specs/`](specs/sales.md)から確認する。
- 文書を更新する人とAgentは、先に[ドキュメント管理](documentation-management.md)を読む。
- 変更を提案する人とAgentは、[変更管理](change-management.md)を読む。
