import { House } from "lucide-react";

import { IMAGES } from "../../model/images";
import { KanaiPartTimeSection } from "../kanai-part-time-section/kanai-part-time-section";
import { SponsorTopSection } from "../sponsor-top-section/sponsor-top-section";

export const KanaiPage = () => (
  <>
    <SponsorTopSection
      name={
        <>
          イベントショップ
          <br />
          カナイ 様
        </>
      }
      photo={IMAGES.kanai}
      photoAlt="イベントショップ カナイの店舗外観"
      introduction="茨城県那珂市にある、イベントの「なんでも屋さん」。夏祭りや学園祭、市民祭りなどの企画から、テント・音響・照明の設営撤去、機材のレンタル、看板やのぼりの製作まで、地域のイベントを丸ごと支えています。"
      features={[
        "イベント企画",
        "設営・撤去",
        "機材レンタル",
        "オリジナルグッズ",
        "遊具レンタル・運営",
        "音響・照明",
        "看板・のぼり旗",
      ]}
      information={[
        { label: "会社名", value: "有限会社カナイトレーディング" },
        { label: "所在地", value: "〒311-0134 茨城県那珂市飯田2706-5" },
        { label: "エリア", value: "茨城県全域" },
      ]}
      externalLink={{
        href: "https://www.es-kanai.com/",
        label: "Home Page",
        icon: <House className="size-8" aria-hidden />,
        className: "border border-slate-7 bg-slate-2 text-slate-12",
      }}
    />
    <KanaiPartTimeSection />
  </>
);
