import { useQuery } from "@tanstack/react-query";

import { menuQueryOptions } from "../../../../entities/menu";
import { MenuPageUI } from "./menu-page.ui";

export const MenuPage = () => {
  const { data, isPending, isError, refetch } = useQuery(menuQueryOptions());

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
