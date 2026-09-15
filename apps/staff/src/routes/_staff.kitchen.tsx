import { createFileRoute } from "@tanstack/react-router";

import { KitchenPage } from "../layers/pages/kitchen";

export const Route = createFileRoute("/_staff/kitchen")({ component: KitchenPage });
