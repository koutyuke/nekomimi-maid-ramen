import { Effect } from "effect";

import { MenuItemRepository } from "../ports/outbound/menu-item.repository";
import type { PersistenceError } from "../../../../core/domain/persistence-error";

export const getMenuRevision = (): Effect.Effect<number, PersistenceError, MenuItemRepository> =>
  Effect.gen(function* () {
    const repository = yield* MenuItemRepository;
    return yield* repository.getRevision();
  });
