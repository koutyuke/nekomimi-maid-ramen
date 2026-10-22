import type { Meta, StoryObj } from "@storybook/react-vite";

import { IMAGES } from "../../model/images";
import { SponsorTopSection } from "./sponsor-top-section";

const meta = {
  title: "Pages/Sponsor/SponsorTopSection",
  component: SponsorTopSection,
  parameters: { layout: "fullscreen" },
  args: {
    name: (
      <>
        イベントショップ
        <br />
        カナイ 様
      </>
    ),
    photo: IMAGES.kanai,
    photoAlt: "イベントショップ カナイの店舗外観",
    introduction: "茨城県那珂市にある、イベントの「なんでも屋さん」。",
    features: ["イベント企画", "設営・撤去"],
    information: [{ label: "会社名", value: "有限会社カナイトレーディング" }],
    externalLink: {
      href: "https://www.es-kanai.com/",
      label: "Home Page",
      icon: null,
      className: "border border-slate-7 bg-slate-2 text-slate-12",
    },
  },
} satisfies Meta<typeof SponsorTopSection>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
