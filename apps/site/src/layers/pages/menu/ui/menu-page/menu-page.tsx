import { useEffect, useState } from "react";

import { getMenu } from "../../api/get-menu";
import { MenuPageUI } from "./menu-page.ui";
import type { MenuState } from "./menu-page.ui";

export const MenuPage = () => {
  const [state, setState] = useState<MenuState>({ status: "loading" });
  const [request, setRequest] = useState(getMenu);

  useEffect(() => {
    let active = true;
    request.then(
      (items) => active && setState({ status: "success", items }),
      () => active && setState({ status: "error" }),
    );
    return () => {
      active = false;
    };
  }, [request]);

  const retry = () => {
    setState({ status: "loading" });
    setRequest(getMenu());
  };

  return <MenuPageUI state={state} onRetry={retry} />;
};
