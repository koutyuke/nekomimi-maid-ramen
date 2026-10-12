import { HeadContent, Outlet } from "@tanstack/react-router";

import { SiteFooter, SiteHeader } from "../../widgets/layout";

export const SiteLayout = () => (
  <>
    <HeadContent />
    <SiteHeader />
    <div className="mx-auto flex min-h-svh max-w-135 flex-col bg-slate-1">
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  </>
);
