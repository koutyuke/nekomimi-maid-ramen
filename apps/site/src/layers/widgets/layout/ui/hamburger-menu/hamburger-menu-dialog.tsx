import { Dialog } from "@base-ui/react/dialog";
import { Link } from "@tanstack/react-router";
import { CupSoda, HeartHandshake, House, MapPin, Soup, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode, RefObject } from "react";

import brandIcon from "../../../../shared/assets/brand-icon.svg";
import brandLogo from "../../../../shared/assets/brand-logo-start.svg";
import { HOME_SECTION_IDS } from "../../../../shared/config";
import { GitHubIcon, InstagramIcon } from "../../../../shared/ui";

const SECTION_LINKS: readonly { hash: string; label: string; Icon: LucideIcon }[] = [
  { hash: HOME_SECTION_IDS.top, label: "Top", Icon: House },
  { hash: HOME_SECTION_IDS.menu, label: "お料理", Icon: Soup },
  { hash: HOME_SECTION_IDS.drinks, label: "飲み物", Icon: CupSoda },
  { hash: HOME_SECTION_IDS.access, label: "アクセス", Icon: MapPin },
  { hash: HOME_SECTION_IDS.sponsors, label: "ご協賛", Icon: HeartHandshake },
];

const MenuGroup = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="flex flex-col gap-2">
    <h3 className="mb-2 border-b border-dashed border-slate-7 pb-1 text-sm text-slate-8">{title}</h3>
    {children}
  </section>
);

const itemClassName =
  "flex min-h-11 items-center gap-2 rounded-md px-2 text-lg leading-7 text-slate-12 outline-none focus-visible:ring-2 focus-visible:ring-blue-8 bg-none hover:bg-slate-3 transition-[background-color]";

type HamburgerMenuDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: RefObject<HTMLButtonElement | null>;
};

export const HamburgerMenuDialog = ({ open, onOpenChange, trigger }: HamburgerMenuDialogProps) => {
  const close = () => onOpenChange(false);

  return (
    // Base UIは開いた状態で描画が始まると入場アニメーションを省く。読み込みより先に押された場合も同じ動きにするため、`starting:`で補う。
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/40 transition-opacity duration-300 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none starting:opacity-0" />
        <Dialog.Popup
          finalFocus={trigger}
          className="fixed top-4 bottom-4 left-4 flex w-[min(320px,calc(100vw-32px))] flex-col gap-4 overflow-hidden rounded-3xl border-4 border-slate-6 bg-slate-1 p-4 shadow-lg transition-transform duration-300 ease-out outline-none data-ending-style:-translate-x-[calc(100%+16px)] data-starting-style:-translate-x-[calc(100%+16px)] motion-reduce:transition-none starting:-translate-x-[calc(100%+16px)]"
        >
          <Dialog.Title className="sr-only">サイトメニュー</Dialog.Title>
          <div className="-mx-4 -mt-4 flex-1 overflow-y-auto px-4">
            <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between bg-slate-1/70 px-4 pt-4 pb-4 backdrop-blur-lg">
              <span className="flex items-center gap-1">
                <img src={brandIcon} alt="" className="size-12" />
                <img src={brandLogo} alt="猫耳メイドラーメン" className="h-10" />
              </span>
              <Dialog.Close
                aria-label="メニューを閉じる"
                className="flex size-11 items-center justify-center rounded-xl bg-slate-3 text-slate-12 transition-[background-color] outline-none hover:bg-slate-4 focus-visible:ring-2 focus-visible:ring-blue-8"
              >
                <X className="size-8" aria-hidden />
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
            className="relative flex h-12 items-center gap-2.5 rounded-2xl bg-instagram p-2 text-white shadow-xl transition-[scale] duration-300 outline-none hover:scale-105 focus-visible:ring-2 focus-visible:ring-blue-8"
          >
            <InstagramIcon className="size-8" />
            <span className="absolute top-[45%] left-1/2 flex flex-1 -translate-1/2 text-center text-2xl font-bold">
              Instagram
            </span>
          </a>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
