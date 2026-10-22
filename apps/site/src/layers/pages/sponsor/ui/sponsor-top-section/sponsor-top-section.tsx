import { Fragment } from "react";
import type { ReactNode } from "react";

import { BlurImage } from "../../../../shared/ui";
import type { OptimizedImage } from "../../../../shared/ui";

type SponsorTopSectionProps = {
  name: ReactNode;
  photo: OptimizedImage;
  photoAlt: string;
  introduction: string;
  features: readonly string[];
  information: readonly { label: string; value: string }[];
  externalLink: { href: string; label: string; icon: ReactNode; className: string };
};

export const SponsorTopSection = ({
  name,
  photo,
  photoAlt,
  introduction,
  features,
  information,
  externalLink,
}: SponsorTopSectionProps) => (
  <section className="flex flex-col items-center bg-slate-1 bg-dots px-6 pt-24 pb-32 text-slate-12 [--grid-color:var(--slate-4)]">
    <div className="w-full max-w-content">
      <p className="text-center text-lg leading-7 font-bold">ご協賛企業様</p>
      <h1 className="text-center text-2xl leading-9 font-bold">{name}</h1>
      <BlurImage
        {...photo}
        alt={photoAlt}
        loading="eager"
        className="mt-6 aspect-4/3 w-full squircle-4xl border-4 border-orange-6 shadow-lg"
      />
      <p className="mt-6 text-base leading-6">{introduction}</p>
      <ul className="mt-4 flex flex-wrap gap-1.5">
        {features.map((feature) => (
          <li
            key={feature}
            className="flex h-6 items-center rounded-full border border-slate-6 bg-slate-1 px-2.5 text-sm leading-5 text-slate-12"
          >
            {feature}
          </li>
        ))}
      </ul>
      <dl className="mt-4 grid grid-cols-[64px_1fr] gap-2 rounded-lg border border-slate-6 bg-slate-1 p-4 text-sm leading-5">
        {information.map(({ label, value }) => (
          <Fragment key={label}>
            <dt className="text-slate-10">{label}</dt>
            <dd className="whitespace-pre-line text-slate-12">{value}</dd>
          </Fragment>
        ))}
      </dl>
      <a
        href={externalLink.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`relative mt-4 flex h-12 items-center rounded-2xl p-2 shadow-lg transition-[scale] duration-300 outline-none hover:scale-105 focus-visible:ring-2 focus-visible:ring-blue-8 ${externalLink.className}`}
      >
        {externalLink.icon}
        <span className="absolute left-1/2 -translate-x-1/2 text-2xl font-bold whitespace-nowrap">
          {externalLink.label}
        </span>
      </a>
    </div>
  </section>
);
