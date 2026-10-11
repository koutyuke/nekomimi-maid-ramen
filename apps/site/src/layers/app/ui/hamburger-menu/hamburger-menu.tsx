import { Dialog } from "@base-ui/react/dialog";
import { Link } from "@tanstack/react-router";
import { CupSoda, HeartHandshake, House, MapPin, Soup, X } from "lucide-react";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { HOME_SECTION_IDS } from "../../pages/home";
import brandIcon from "../../shared/assets/brand-icon.svg";
import brandLogo from "../../shared/assets/brand-logo-start.svg";
import { CatMenuIcon, GitHubIcon, InstagramIcon } from "../../shared/ui";

const SECTION_LINKS: readonly { hash: string; label: string; Icon: LucideIcon }[] = [
  { hash: HOME_SECTION_IDS.top, label: "Top", Icon: House },
  { hash: HOME_SECTION_IDS.menu, label: "お料理", Icon: Soup },
  { hash: HOME_SECTION_IDS.drinks, label: "飲み物", Icon: CupSoda },
  { hash: HOME_SECTION_IDS.access, label: "アクセス", Icon: MapPin },
  { hash: HOME_SECTION_IDS.sponsors, label: "ご協賛", Icon: HeartHandshake },
];

// Instagramのブランドカラーに合わせた、黄色から橙と、桃色から紫の2つの放射グラデーション。値はデザインのまま。
const INSTAGRAM_GRADIENT = [
  `url("data:image/svg+xml;utf8,<svg viewBox='0 0 280 48' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect width='100%' height='100%' fill='url(%23g)'/><defs><radialGradient id='g' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(8.904 -2.3904 14.504 1.5877 101.5 46.344)'><stop stop-color='rgba(255,214,0,1)' offset='0'/><stop stop-color='rgba(255,187,12,1)' offset='0.076247'/><stop stop-color='rgba(255,160,24,1)' offset='0.15249'/><stop stop-color='rgba(255,105,48,1)' offset='0.30499'/><stop stop-color='rgba(254,59,54,1)' offset='0.42086'/><stop stop-color='rgba(254,59,54,0)' offset='1'/></radialGradient></defs></svg>")`,
  `url("data:image/svg+xml;utf8,<svg viewBox='0 0 280 48' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect width='100%' height='100%' fill='url(%23g)'/><defs><radialGradient id='g' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(-16.604 -5.8944 51.142 -4.2337 236.6 54.48)'><stop stop-color='rgba(255,27,144,1)' offset='0.24392'/><stop stop-color='rgba(251,15,120,1)' offset='0.3403'/><stop stop-color='rgba(248,2,97,1)' offset='0.43667'/><stop stop-color='rgba(242,1,144,1)' offset='0.56257'/><stop stop-color='rgba(237,0,192,1)' offset='0.68848'/><stop stop-color='rgba(197,0,233,1)' offset='0.77679'/><stop stop-color='rgba(155,12,244,1)' offset='0.83497'/><stop stop-color='rgba(112,23,255,1)' offset='0.89316'/></radialGradient></defs></svg>")`,
].join(", ");

const MenuGroup = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="flex flex-col gap-2">
    <h3 className="border-b border-dashed border-slate-7 pb-1 text-sm text-slate-8">{title}</h3>
    {children}
  </section>
);

const itemClassName =
  "flex min-h-7 items-center gap-2 rounded-md px-2 text-lg leading-7 text-slate-12 outline-none focus-visible:ring-2 focus-visible:ring-blue-8";

export const HamburgerMenu = () => {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label="メニューを開く"
        className="flex size-9 items-center justify-center rounded-lg text-slate-12 outline-none focus-visible:ring-2 focus-visible:ring-blue-8"
      >
        <CatMenuIcon className="size-6" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/40 transition-opacity duration-300 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none" />
        <Dialog.Popup className="fixed top-4 bottom-4 left-4 flex w-[min(320px,calc(100vw-32px))] flex-col gap-4 overflow-hidden rounded-3xl border-4 border-slate-6 bg-slate-1 p-4 shadow-lg outline-none transition-transform duration-300 ease-out data-ending-style:-translate-x-[calc(100%+16px)] data-starting-style:-translate-x-[calc(100%+16px)] motion-reduce:transition-none">
          <Dialog.Title className="sr-only">サイトメニュー</Dialog.Title>
          <div className="-mx-4 -mt-4 flex-1 overflow-y-auto px-4">
            <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between bg-slate-1/70 px-4 pt-4 pb-4 backdrop-blur-lg">
              <span className="flex items-center gap-1">
                <img src={brandIcon} alt="" className="size-11" />
                <img src={brandLogo} alt="猫耳メイドラーメン" className="h-9 w-[71px]" />
              </span>
              <Dialog.Close
                aria-label="メニューを閉じる"
                className="flex size-9 items-center justify-center rounded-lg bg-slate-3 text-slate-12 outline-none focus-visible:ring-2 focus-visible:ring-blue-8"
              >
                <X className="size-6" aria-hidden />
              </Dialog.Close>
            </div>
            <nav aria-label="サイト内" className="flex flex-col gap-4 px-2">
              <MenuGroup title="Sections">
                {SECTION_LINKS.map(({ hash, label, Icon }) => (
                  <Link key={hash} to="/" hash={hash} onClick={close} className={itemClassName}>
                    <Icon className="size-5" aria-hidden />
                    {label}
                  </Link>
                ))}
              </MenuGroup>
              <MenuGroup title="Sponsors">
                <p className="px-2 text-lg leading-8 text-slate-11">Coming soon</p>
              </MenuGroup>
              <MenuGroup title="Site Detail">
                <a
                  href="https://github.com/koutyuke/nekomimi-maid-ramen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={itemClassName}
                >
                  <GitHubIcon className="size-5" />
                  Source Code
                </a>
              </MenuGroup>
            </nav>
          </div>
          <a
            href="https://www.instagram.com/nekomimi_maid_ramen"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 rounded-2xl p-2 text-white shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-blue-8"
            style={{ backgroundImage: INSTAGRAM_GRADIENT }}
          >
            <InstagramIcon className="size-8" />
            <span className="flex-1 text-center text-2xl leading-7 font-black">Instagram</span>
          </a>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
