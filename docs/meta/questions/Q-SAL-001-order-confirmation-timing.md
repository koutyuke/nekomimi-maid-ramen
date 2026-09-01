---
schema: question
id: Q-SAL-001
title: 現金受領と注文確定の順序
domain: SAL
priority: high
requirements:
  - REQ-SAL-004
  - REQ-SAL-005
blocks_profiles:
  - PROFILE-INITIAL
---

# Q-SAL-001 現金受領と注文確定の順序

## 問い

現金を受け取ってから注文を確定するか、注文を確定してから現金を受け取るかを決める。

## 選択肢と影響

- 現金受領後に確定すると、未払い注文の調理開始を防ぎやすい一方、確定直前の在庫不足時に会計をやり直す可能性がある。
- 確定後に現金を受け取ると、在庫を先に確保できる一方、支払い不能時の取り消しが必要である。

期限は未定である。
