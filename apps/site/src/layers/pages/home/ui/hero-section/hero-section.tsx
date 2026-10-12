import { HOME_SECTION_IDS } from "../../../../shared/config";
import { ScribbleArrow } from "../../../../shared/ui";
import { InstaxCard } from "./instax-card/instax-card";

export const HeroSection = () => (
  <section
    id={HOME_SECTION_IDS.top}
    aria-labelledby="hero-title"
    className="flex scroll-mt-24 flex-col items-center justify-center bg-slate-1 bg-dots px-5 pt-32 pb-34 text-center [--grid-color:var(--slate-4)]"
  >
    <p className="font-caveat text-2xl font-[400] text-pink">welcome home, master!</p>
    <h1 id="hero-title" className="text-3xl leading-10 font-black text-slate-12">
      猫耳メイドの
      <br />
      <span className="text-tomato-9">ラーメン</span>屋さん！？
    </h1>
    <p className="text-md mt-6 text-slate-11">
      猫耳をつけたメイドさんが給仕する
      <br />
      超本格ラーメン屋さんです！
      <br />
      茨香祭の2日間の限定開催！
      <br />
      ぜひ、ご賞味あれ！！
    </p>
    <div className="mt-8">
      <InstaxCard />
    </div>
    <p className="mt-4 flex -rotate-4 flex-col items-center font-caveat text-2xl font-[400] text-slate-11">
      <ScribbleArrow className="h-6 w-2.5" />
      <span className="px-1">Tap to flip!</span>
    </p>
  </section>
);
