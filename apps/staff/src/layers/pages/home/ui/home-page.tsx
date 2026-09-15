import { useSuspenseQuery } from "@tanstack/react-query";

import { staffQueries } from "../../../entities/staff";
import { HomePageUI } from "./home-page.ui";

export const HomePage = () => {
  const { data: staff } = useSuspenseQuery(staffQueries.current());
  return staff && <HomePageUI staff={staff} />;
};
