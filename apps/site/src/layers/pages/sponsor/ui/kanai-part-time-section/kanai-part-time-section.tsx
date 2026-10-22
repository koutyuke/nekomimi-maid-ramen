import { CircleCheck } from "lucide-react";

import { BlurImage, Wave } from "../../../../shared/ui";
import HeadingUnderline from "../../assets/heading-underline.svg?react";
import { IMAGES } from "../../model/images";

export const KanaiPartTimeSection = () => (
  <section
    aria-label="アルバイト募集"
    className="bg-dashed-grid relative flex flex-col items-center bg-crimson-3 px-6 pt-6 pb-32 text-slate-12 [--grid-color:var(--crimson-4)]"
  >
    <Wave className="bg-dashed-grid bg-crimson-3 [--grid-color:var(--crimson-4)]" />
    <div className="w-full max-w-content">
      <h2 className="text-center text-5xl leading-12 font-bold text-crimson-9">
        アルバイト
        <br />
        募集中！
      </h2>
      <div className="relative mt-6">
        <BlurImage
          {...IMAGES.stage}
          alt="屋外イベント会場に設置されたステージとテント"
          className="aspect-4/3 w-full squircle-4xl shadow-lg"
        />
        <p className="absolute -top-4.75 -right-4 rotate-5 rounded-2xl bg-yellow-9 p-2 text-center text-xs leading-4 text-black">
          お給料は
          <br />
          その日に現金で！
        </p>
      </div>
      <p className="mt-4 text-base leading-6">
        お祭り、ステージ、学園祭。
        <br />
        みんなが楽しむあの場所を、裏側からいっしょにつくるお仕事です。
      </p>
      <div className="mt-8 text-center">
        <p className="font-caveat text-xl text-crimson-9">Work</p>
        <h3 className="text-2xl leading-9 font-bold">どんなお仕事？</h3>
        <HeadingUnderline className="mx-auto h-2.5 w-30 text-crimson-9" aria-hidden />
      </div>
      <div className="mt-6 flex flex-col gap-6">
        <article className="overflow-hidden rounded-2xl bg-slate-1 shadow-lg">
          <BlurImage
            {...IMAGES.setup}
            alt="イベント会場でのテント撤去作業"
            objectPosition="bottom"
            className="h-40 w-full"
          />
          <div className="flex flex-col items-start gap-2 p-4">
            <span className="flex h-6 items-center rounded-full bg-crimson-9 px-2.5 text-sm text-crimson-1">
              設営・撤去
            </span>
            <h4 className="text-base font-bold">テント・音響・ステージの組み立て</h4>
            <p className="text-sm leading-5 text-slate-11">
              会場にテントを張り、スピーカーなどの音響機材やステージを設置します。イベントが終わったら解体して、トラックに積んで撤収するまでがお仕事です。
            </p>
          </div>
        </article>
        <article className="overflow-hidden rounded-2xl bg-slate-1 shadow-lg">
          <div className="flex h-40 items-center justify-center gap-2.5 bg-yellow-9 text-center text-sm text-black">
            <span className="flex size-20.5 items-center justify-center rounded-full bg-white">射的</span>
            <span className="flex size-20.5 items-center justify-center rounded-full bg-white">輪投げ</span>
            <span className="flex size-20.5 items-center justify-center rounded-full bg-white">
              スーパー
              <br />
              ボール
              <br />
              すくい
            </span>
          </div>
          <div className="flex flex-col items-start gap-2 p-4">
            <span className="flex h-6 items-center rounded-full bg-crimson-9 px-2.5 text-sm text-crimson-1">
              縁日の運営
            </span>
            <h4 className="text-base font-bold">お祭りの縁日コーナーを盛り上げる</h4>
            <p className="text-sm leading-5 text-slate-11">
              お客さんの受付や遊び方の案内、景品の受け渡しをします。子どもたちの「やった！」をいちばん近くで見られる持ち場です。
            </p>
          </div>
        </article>
      </div>
      <div className="mt-12 text-center">
        <p className="font-caveat text-xl text-crimson-9">Wanted</p>
        <h3 className="text-2xl leading-9 font-bold">こんな人を待っています</h3>
        <HeadingUnderline className="mx-auto h-2.5 w-30 text-crimson-9" aria-hidden />
      </div>
      <ul className="mt-6 flex flex-col gap-4">
        {[
          { title: "イベントやお祭りが好きな人", description: "にぎやかな現場の空気が好きなら、きっと楽しめます。" },
          { title: "車で現場まで移動できる人", description: "会場は茨城県内の各地。日によって行き先が変わります。" },
        ].map(({ title, description }) => (
          <li key={title} className="flex gap-2.5 rounded-2xl bg-crimson-1 px-4 py-3">
            <CircleCheck className="size-6 shrink-0 text-crimson-9" aria-hidden />
            <div>
              <p className="text-base font-bold text-slate-12">{title}</p>
              <p className="mt-2 text-sm leading-5 text-slate-11">{description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </section>
);
