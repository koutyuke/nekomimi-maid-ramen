import { Link } from "@tanstack/react-router";

import brandIcon from "../../../../shared/assets/brand-icon.svg";
import brandLogo from "../../../../shared/assets/brand-logo-center.svg";
import { HOME_SECTION_IDS } from "../../../../shared/config";
import { Wave } from "../../../../shared/ui";

const linkClassName =
  "rounded text-base leading-6 text-slate-11 outline-none hover:text-slate-12 focus-visible:ring-2 focus-visible:ring-blue-8";

export const SiteFooter = () => (
  <footer className="relative flex flex-col items-center bg-tomato-1 px-4 pt-2 pb-18">
    <Wave className="bg-tomato-1" variant="inverted" />
    <p className="text-center font-black text-slate-12">
      <span className="text-lg leading-7">
        \ <span className="text-pink">萌え♥</span>・<span className="text-tomato-9">燃え🔥</span>/
      </span>
      <br />
      <span className="text-2xl leading-9">
        猫耳メイドラーメンを
        <br />
        ご賞味あれ！
      </span>
    </p>
    <div className="mt-6 flex w-full max-w-86 gap-6 p-2.5">
      <div className="flex w-30 shrink-0 flex-col items-center">
        <img src={brandIcon} alt="" className="-mb-3 size-25" />
        <img src={brandLogo} alt="猫耳メイドラーメン" className="h-[51px] w-25" />
      </div>
      <nav aria-label="フッター" className="flex flex-1 flex-col items-start gap-1 pt-2.5">
        <p className="text-sm leading-5 font-black text-slate-10">猫耳メイドラーメン</p>
        <Link to="/" hash={HOME_SECTION_IDS.top} className={linkClassName}>
          Top
        </Link>
        <Link to="/" hash={HOME_SECTION_IDS.menu} className={linkClassName}>
          メニュー
        </Link>
        <Link to="/" hash={HOME_SECTION_IDS.access} className={linkClassName}>
          アクセス
        </Link>
        <Link to="/" hash={HOME_SECTION_IDS.sponsors} className={linkClassName}>
          ご協賛
        </Link>
        <Link to="/privacy" className={linkClassName}>
          プライバシーポリシー
        </Link>
        <Link to="/terms" className={linkClassName}>
          利用規約
        </Link>
      </nav>
    </div>
    <p className="mt-6 text-xs leading-4 text-slate-11">&copy; Nekomimi Maid Ramen</p>
  </footer>
);
