import { Effect } from "effect";

import { OrderRepository } from "../ports/outbound/order.repository";

export const getSalesSummary = (businessDate: string) =>
  Effect.gen(function* () {
    const orderRepository = yield* OrderRepository;
    return yield* orderRepository.summarizeSales(businessDate);
  });
