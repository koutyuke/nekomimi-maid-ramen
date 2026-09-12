import { Effect } from "effect";

import { MenuItemRepository } from "../ports/outbound/menu-item.repository";
import type { PersistenceError } from "../../../../core/domain/persistence-error";
import type { Snapshot } from "../../../../public";
import type { MenuItem } from "../../domain/menu-item";

type StaffMenuEntry = Snapshot<
  {
    readonly menuItem: MenuItem;
    readonly quantity: number;
    readonly sellable: boolean;
  }[]
>;

export const listStaffMenu = (): Effect.Effect<StaffMenuEntry, PersistenceError, MenuItemRepository> =>
  Effect.gen(function* () {
    const repository = yield* MenuItemRepository;
    const { data, revision } = yield* repository.list();
    return {
      revision,
      data: data.map(({ menuItem, quantity }) => ({
        menuItem,
        quantity,
        sellable: quantity > 0,
      })),
    };
  });
