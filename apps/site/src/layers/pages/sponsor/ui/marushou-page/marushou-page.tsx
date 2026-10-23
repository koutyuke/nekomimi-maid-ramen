import { InstagramIcon } from "../../../../shared/ui";
import { IMAGES } from "../../model/images";
import { SponsorTopSection } from "../sponsor-top-section/sponsor-top-section";

export const MarushouPage = () => (
  <SponsorTopSection
    name={
      <>
        味噌乃マルショウ
        <br />
        那珂後台店 様
      </>
    }
    photo={IMAGES.marushou}
    photoAlt="味噌乃マルショウ 那珂後台店の外観"
    introduction="茨城県那珂市の後台に店舗をかまえる、“情熱と温もりの千日味噌ラーメン店”。千日たっても忘れられない味を目指した信州味噌の「千日味噌ラーメン」を看板に、辛味噌ラーメンやつけ麺、餃子まで、マルショウならではのメニューをそろえています。"
    features={["千日味噌ラーメン", "辛味噌ラーメン", "鯛塩・醤油ラーメン", "つけ麺", "餃子", "唐揚げ"]}
    information={[
      { label: "店名", value: "味噌乃マルショウ 那珂後台店" },
      { label: "所在地", value: "茨城県那珂市後台3053-13" },
      { label: "営業時間", value: "11:00〜22:00（L.O. 21:30）" },
    ]}
    externalLink={{
      href: "https://www.instagram.com/misonomarusyougodai/",
      label: "Instagram",
      icon: <InstagramIcon className="size-8" />,
      className: "bg-instagram text-white",
    }}
  />
);
