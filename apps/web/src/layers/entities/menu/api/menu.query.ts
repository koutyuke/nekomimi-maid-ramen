import { queryOptions } from "@tanstack/react-query";

import { getMenu } from "./get-menu";

export const menuQueryScopes = {
  all: () => ["menu"] as const,
};

export const menuQueries = {
  list: () =>
    queryOptions({
      queryKey: [...menuQueryScopes.all(), "list"] as const,
      queryFn: getMenu,
    }),
};
