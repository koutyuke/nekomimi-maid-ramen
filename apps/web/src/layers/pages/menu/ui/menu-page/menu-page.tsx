import { useQuery } from "@tanstack/react-query";

import { menuQueries } from "../../../../entities/menu";
import { MenuPageUI } from "./menu-page.ui";

export const MenuPage = () => {
  const { data, isPending, isError, refetch } = useQuery(menuQueries.list());

  return (
    <MenuPageUI
      actions={{
        onRetry: () => {
          void refetch();
        },
      }}
      failed={isError}
      items={data ?? []}
      loading={isPending}
    />
  );
};
