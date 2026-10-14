import { Circle, Triangle, X } from "lucide-react";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

import {
  BuckwheatIcon,
  CashewIcon,
  CrabIcon,
  EggIcon,
  MilkIcon,
  PeanutIcon,
  ShrimpIcon,
  WalnutIcon,
  WheatIcon,
} from "../../../../shared/ui";
import { ALLERGENS, EQUIVALENT_ALLERGENS } from "../../model/menu";
import { ProductImage } from "../product-image/product-image";
import type { AllergenId, AllergenStatus, EquivalentAllergenId, MenuItem } from "../../model/menu";

export const PRODUCT_TITLE_ID = "product-detail-title";

const ALLERGEN_ICONS: Record<AllergenId, ComponentType<SVGProps<SVGSVGElement>>> = {
  "allergen-shrimp": ShrimpIcon,
  "allergen-crab": CrabIcon,
  "allergen-cashew-nut": CashewIcon,
  "allergen-walnut": WalnutIcon,
  "allergen-wheat": WheatIcon,
  "allergen-buckwheat": BuckwheatIcon,
  "allergen-egg": EggIcon,
  "allergen-milk": MilkIcon,
  "allergen-peanut": PeanutIcon,
};

const STATUS_DISPLAY: Record<AllergenStatus, { label: string; Icon: LucideIcon; iconClassName: string }> = {
  contains: { label: "使用", Icon: Circle, iconClassName: "size-4" },
  "may-contain": { label: "可能性あり", Icon: Triangle, iconClassName: "size-4" },
  absent: { label: "不使用", Icon: X, iconClassName: "size-5" },
};

const AllergenTable = ({
  label,
  items,
  icons,
  allergens,
}: {
  label: string;
  items: readonly { id: AllergenId | EquivalentAllergenId; name: string }[];
  icons?: Partial<Record<AllergenId | EquivalentAllergenId, ComponentType<SVGProps<SVGSVGElement>>>>;
  allergens: NonNullable<MenuItem["allergens"]>;
}) => (
  <div className="flex flex-col items-center">
    <h4 className="text-sm leading-5 font-bold">
      {label}
      {items.length}品目
    </h4>
    <ul aria-label={label} className="mt-2 flex w-60 flex-col rounded-lg border-2 border-tomato-6 bg-tomato-1 p-2">
      {items.map(({ id, name }, index) => {
        const AllergenIcon = icons?.[id];
        const { label: statusLabel, Icon, iconClassName } = STATUS_DISPLAY[allergens[id]];
        return (
          <li
            key={id}
            aria-label={`${name}: ${statusLabel}`}
            className={`flex items-center gap-1 text-sm leading-5 ${index > 0 ? "mt-2 border-t border-slate-4 pt-2" : ""}`}
          >
            {AllergenIcon ? (
              <span className="flex size-6 items-center justify-center">
                <AllergenIcon className="size-5" />
              </span>
            ) : null}
            <span className={`flex-1 ${AllergenIcon ? "" : "pl-1"}`}>{name}</span>
            <span className="flex size-6 items-center justify-center">
              <Icon className={iconClassName} aria-hidden />
            </span>
          </li>
        );
      })}
    </ul>
  </div>
);

const AllergenTables = ({ allergens }: { allergens: NonNullable<MenuItem["allergens"]> }) => (
  <>
    <AllergenTable label="特定原材料" items={ALLERGENS} icons={ALLERGEN_ICONS} allergens={allergens} />
    <div className="mt-6">
      <AllergenTable label="特定原材料に準ずるもの" items={EQUIVALENT_ALLERGENS} allergens={allergens} />
    </div>
    <p className="mt-2 w-55 text-[10px] text-tomato-12">
      ○：この原材料を使用しています
      <br />
      △：調理過程での接触及び、使用製品での含有の可能性があります
      <br />
      ✕：使用していません
    </p>
  </>
);

export const ProductDetail = ({ item }: { item: MenuItem }) => (
  <div className="flex flex-col items-center p-6 text-tomato-12">
    <ProductImage item={item} className={item.image.kind === "photo" ? "max-h-60 w-3/4" : "h-50"} fit="contain" />
    <motion.div
      className="flex w-full flex-col items-center"
      initial={{ opacity: 0, filter: "blur(6px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, transition: { duration: 0.1 } }}
      transition={{ delay: 0.15, duration: 0.25 }}
    >
      <h2 id={PRODUCT_TITLE_ID} className="mt-4 text-3xl leading-9 font-bold">
        {item.name}
      </h2>
      <p className="text-md mt-2 font-caveat leading-4 font-normal text-tomato-11">{item.subtitle}</p>
      <p className="mt-2 text-3xl leading-9 font-bold text-tomato-10">¥{item.price}</p>
      {item.description !== null && (
        <p className="mx-4 mt-4 text-center text-sm leading-6 whitespace-pre-line">{item.description}</p>
      )}
      <hr className="my-6 w-55 border-t-2 border-dashed border-tomato-6" />
      <h3 className="text-md text-center leading-5">製品に含まれるアレルギー物質</h3>
      <div className="mt-4 flex flex-col items-center">
        {item.allergens === null ? (
          <p className="rounded-lg border-2 border-tomato-6 px-4 py-3 text-sm">特定原材料等は確認中です。</p>
        ) : (
          <AllergenTables allergens={item.allergens} />
        )}
      </div>
    </motion.div>
  </div>
);
