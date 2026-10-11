import { HeadContent, Outlet } from "@tanstack/react-router";

import { SiteFooter } from "../ui/site-footer";
import { SiteHeader } from "../ui/site-header";

export const SiteLayout = () => (
  <>
    <HeadContent />
    <SiteHeader />
    <div className="mx-auto flex min-h-svh max-w-[540px] flex-col bg-slate-1">
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  </>
);
