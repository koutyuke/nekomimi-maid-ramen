import { Effect } from "effect";

import { OrderRepository } from "../ports/outbound/order.repository";
import type { OrderLookup } from "../ports/outbound/order.repository";

export const listOrders = (lookup?: OrderLookup) =>
  Effect.gen(function* () {
    const orderRepository = yield* OrderRepository;
    return yield* orderRepository.list(lookup);
  });
