import { createFileRoute } from "@tanstack/react-router";

import { ProductManagementPage } from "../layers/pages/product-management";

export const Route = createFileRoute("/_admin/product-management")({ component: ProductManagementPage });
