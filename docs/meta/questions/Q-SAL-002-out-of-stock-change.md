---
schema: question
id: Q-SAL-002
title: 在庫不足時の注文変更
domain: SAL
priority: high
requirements:
  - REQ-SAL-001
  - REQ-INV-002
blocks_profiles:
  - PROFILE-INITIAL
---

# Q-SAL-002 在庫不足時の注文変更

## 問い

会計時に在庫が不足した場合、会計担当者による商品削除、個数変更、代替商品への変更のどこまでを許可するかを決める。

## 影響

許可する変更によって、注文・会計画面の操作、価格の再計算、来場者の待ち時間が変わる。

決定者と期限は未定である。
