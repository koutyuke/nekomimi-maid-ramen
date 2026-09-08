import { queryOptions } from "@tanstack/react-query";

import { getMenu } from "../api/get-menu";

export const menuQueryOptions = () =>
  queryOptions({
    queryKey: ["menu"],
    queryFn: getMenu,
  });
