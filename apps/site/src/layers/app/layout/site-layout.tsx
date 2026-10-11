import { HeadContent, Link, Outlet } from "@tanstack/react-router";

import { SiteHeader } from "../ui/site-header";

export const SiteLayout = () => (
  <>
    <HeadContent />
    <div className="mx-auto max-w-3xl p-5">
      <SiteHeader />
      <main className="my-8">
        <Outlet />
      </main>
      <footer className="border-t border-gray-6 pt-4">
        <nav aria-label="規約とポリシー" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link className="inline-flex min-h-11 items-center" to="/privacy">
            プライバシーポリシー
          </Link>
          <Link className="inline-flex min-h-11 items-center" to="/terms">
            利用規約
          </Link>
        </nav>
      </footer>
    </div>
  </>
);
