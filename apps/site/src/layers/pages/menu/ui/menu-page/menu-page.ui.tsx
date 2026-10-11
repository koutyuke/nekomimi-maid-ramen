import { MENU_CATEGORY_LABEL } from "../../model/menu";
import type { MenuItem } from "../../model/menu";

export type MenuState = { status: "loading" } | { status: "error" } | { status: "success"; items: readonly MenuItem[] };

const allergenLabel = (item: MenuItem): string =>
  item.allergenCheckState === "unchecked"
    ? "未確認"
    : item.containedAllergens.map((allergen) => allergen.name).join("・") || "含まれない";

const MenuContent = ({ state, onRetry }: { state: MenuState; onRetry: () => void }) => {
  if (state.status === "loading") {
    return <p>メニューを読み込んでいます</p>;
  }
  if (state.status === "error") {
    return (
      <>
        <p>メニューを表示できません。通信状況を確認して、もう一度お試しください。</p>
        <button type="button" onClick={onRetry}>
          再読み込み
        </button>
      </>
    );
  }
  if (state.items.length === 0) {
    return <p>表示できる商品がありません。</p>;
  }
  return [...Map.groupBy(state.items, (item) => item.category)].map(([category, items]) => (
    <section key={category}>
      <h2>{MENU_CATEGORY_LABEL[category]}</h2>
      {items.map((item) => (
        <article key={item.id}>
          <h3>{item.name}</h3>
          <p>{item.price.toLocaleString("ja-JP")}円</p>
          <strong>{item.sellable ? "販売中" : "売り切れ"}</strong>
          {item.description !== null && <p>{item.description}</p>}
          <p>特定原材料: {allergenLabel(item)}</p>
        </article>
      ))}
    </section>
  ));
};

export const MenuPageUI = ({ state, onRetry }: { state: MenuState; onRetry: () => void }) => (
  <>
    <h1>メニュー</h1>
    <div aria-live="polite" aria-busy={state.status === "loading"}>
      <MenuContent state={state} onRetry={onRetry} />
    </div>
  </>
);
