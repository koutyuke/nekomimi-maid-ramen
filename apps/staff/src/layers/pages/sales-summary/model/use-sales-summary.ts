import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { match } from "ts-pattern";

import { getOrdersRevision } from "../../../entities/orders";
import { useRealtime } from "../../../features/sync-data";
import { isAccessDenied } from "../../../shared/api";
import { currentBusinessDate } from "../../../shared/lib";
import { salesSummaryQuery } from "../api/sales-summary.query";
import type { SalesSummary } from "./sales-summary";

export type SalesSummaryState =
  | { status: "pending" }
  | { status: "denied" }
  | { status: "error" }
  | { status: "success"; data: SalesSummary };

export const useSalesSummary = () => {
  const [businessDate, setBusinessDate] = useState(currentBusinessDate);

  const options = salesSummaryQuery(businessDate);
  const realtime = useRealtime({
    scope: "orders",
    queryKey: options.queryKey,
    checkRevision: getOrdersRevision,
  });
  const query = useQuery({ ...options, enabled: !realtime.denied });

  // 照合や再取得に失敗した間は、古い集計を現在の売上と誤認しないよう表示しない。
  const summary = match(query)
    .returnType<SalesSummaryState>()
    .when(
      () => realtime.denied || isAccessDenied(query.error),
      () => ({ status: "denied" }),
    )
    .when(
      () => realtime.failed,
      () => ({ status: "error" }),
    )
    .with({ status: "error" }, () => ({ status: "error" }))
    .with({ status: "pending" }, () => ({ status: "pending" }))
    .with({ status: "success" }, ({ data }) => ({ status: "success", data }))
    .exhaustive();

  const retry = () => {
    realtime.retry();
    void query.refetch();
  };

  return { businessDate, changeBusinessDate: setBusinessDate, summary, realtimeConnected: realtime.connected, retry };
};
