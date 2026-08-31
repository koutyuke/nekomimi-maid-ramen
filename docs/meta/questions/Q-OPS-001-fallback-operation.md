---
schema: question
id: Q-OPS-001
title: 通信・端末・電源障害時の代替運用
domain: OPS
priority: high
requirements:
  - REQ-OPS-002
  - REQ-SYS-002
blocks_profiles:
  - PROFILE-INITIAL
---

# Q-OPS-001 通信・端末・電源障害時の代替運用

## 問い

システム停止と判断する条件、紙などによる代替受付、在庫共有、復旧後の入力・照合、切り替えと復帰の責任者を決める。

## 影響

決定しない場合、混雑時に注文受付全体が停止するか、復旧後に重複注文や在庫不一致が発生する可能性がある。

決定者と期限は未定である。
