import { lazy, Suspense, useRef, useState } from "react";

import { CatMenuIcon } from "../../../../shared/ui";

// メニューの中身(Base UIのDialog)は初期表示に不要なため、ボタンに触れたときに読み込む。
const loadDialog = () => import("./hamburger-menu-dialog");
const HamburgerMenuDialog = lazy(() => loadDialog().then((module) => ({ default: module.HamburgerMenuDialog })));
const preloadDialog = () => void loadDialog();

export const HamburgerMenu = () => {
  const [open, setOpen] = useState(false);
  // 閉じるアニメーションの間も中身を残すため、一度開いた後は描画し続ける。
  const [opened, setOpened] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-label="メニューを開く"
        aria-haspopup="dialog"
        aria-expanded={open}
        onPointerEnter={preloadDialog}
        onFocus={preloadDialog}
        onClick={() => {
          setOpened(true);
          setOpen(true);
        }}
        className="flex size-11 items-center justify-center rounded-xl bg-none text-slate-12 transition-[background-color] outline-none hover:bg-slate-3 focus-visible:ring-2 focus-visible:ring-blue-8"
      >
        <CatMenuIcon className="size-7 text-slate-11" />
      </button>
      {opened && (
        <Suspense fallback={null}>
          <HamburgerMenuDialog open={open} onOpenChange={setOpen} trigger={trigger} />
        </Suspense>
      )}
    </>
  );
};
