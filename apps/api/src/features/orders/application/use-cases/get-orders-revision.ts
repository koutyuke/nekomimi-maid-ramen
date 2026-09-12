import { Effect } from "effect";

import { OrderRepository } from "../ports/outbound/order.repository";

export const getOrdersRevision = () =>
  Effect.gen(function* () {
    const repository = yield* OrderRepository;
    return yield* repository.getRevision();
  });
