import { createFileRoute } from "@tanstack/react-router";

import { HomePage } from "../layers/pages/home";

export const Route = createFileRoute("/")({ component: HomePage });
