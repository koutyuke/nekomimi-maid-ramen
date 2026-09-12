import { createFileRoute } from "@tanstack/react-router";

import { HandoffPage } from "../layers/pages/handoff";

export const Route = createFileRoute("/_authenticated/handoff")({ component: HandoffPage });
