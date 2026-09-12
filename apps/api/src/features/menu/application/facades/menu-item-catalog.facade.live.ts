import { Effect, Layer } from "effect";

import { MenuItemCatalogFacade } from "../ports/inbound/menu-item-catalog.facade";
import { MenuItemRepository } from "../ports/outbound/menu-item.repository";

export const MenuItemCatalogFacadeLive = Layer.effect(
  MenuItemCatalogFacade,
  Effect.gen(function* () {
    const repository = yield* MenuItemRepository;

    return MenuItemCatalogFacade.of({
      findPrices: (menuItemIds) => {
        const requestedIds = new Set(menuItemIds);

        return repository.findMany().pipe(
          Effect.map(({ data }) =>
            data.flatMap(({ menuItem }) =>
              requestedIds.has(menuItem.id)
                ? [
                    {
                      menuItemId: menuItem.id,
                      price: menuItem.price,
                    },
                  ]
                : [],
            ),
          ),
        );
      },
    });
  }),
);
