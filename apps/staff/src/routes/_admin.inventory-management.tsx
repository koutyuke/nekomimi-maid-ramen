import { createFileRoute } from "@tanstack/react-router";

import { InventoryManagementPage } from "../layers/pages/inventory-management";

export const Route = createFileRoute("/_admin/inventory-management")({ component: InventoryManagementPage });
