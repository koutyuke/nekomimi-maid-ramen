import { useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import type { PointerEvent } from "react";

import { BlurImage } from "../../../../shared/ui";
import instaxDoodle from "../../assets/instax-doodle.svg";
import { IMAGES } from "../../model/images";

const MAX_TILT_DEG = 12;
// これ以上指が動いたら「なぞった」とみなし、離したときに裏返さない。
const DRAG_THRESHOLD_PX = 8;

// 写真の紙の質感。細かいノイズを乗算で重ねる。
const PAPER_TEXTURE = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;

const faceClassName = "absolute inset-0 overflow-hidden rounded-lg shadow-xl backface-hidden";

// 触れている位置に光が当たっているように見せる反射。傾けている間だけ現れる。
const Glare = () => (
  <span
    aria-hidden
    className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity duration-300 group-data-tilting:opacity-100"
    style={{
      backgroundImage:
        "radial-gradient(circle at var(--light-x) var(--light-y), rgb(255 255 255 / 0.9), rgb(255 255 255 / 0) 55%)",
    }}
  />
);

const Front = () => (
  <div className={`${faceClassName} border border-[#d9d9d9] bg-[#f0f0f0]`}>
    <BlurImage
      src={IMAGES.maidIllustration.src}
      placeholder={IMAGES.maidIllustration.placeholder}
      alt="ラーメンの丼を持つ猫耳メイドのイラスト"
      loading="eager"
      className="absolute top-6 left-4 h-62 w-46 bg-[#f7cbe5]"
    />
    <span
      aria-hidden
      className="pointer-events-none absolute top-6 left-4 h-62 w-46 opacity-30 mix-blend-multiply"
      style={{ backgroundImage: PAPER_TEXTURE }}
    />
    <img src={instaxDoodle} alt="" className="pointer-events-none absolute inset-0 size-full" />
    <Glare />
  </div>
);

const Back = () => (
  <div className={`${faceClassName} rotate-y-180 border border-[#3e63dd] bg-[#fcfcfc]`}>
    <div className="h-6 bg-[#3e63dd]" />
    <div className="relative h-62 bg-black">
      <div className="absolute inset-y-0 left-4 w-46 bg-[#1c2024]" />
    </div>
    <p className="flex h-18 items-center justify-center bg-[#3e63dd] font-caveat text-xl font-bold text-white">
      Nekomimi Maid Ramen
    </p>
    <Glare />
  </div>
);

export const InstaxCard = () => {
  const [flipped, setFlipped] = useState(false);
  const reduceMotion = useReducedMotion();
  const sceneRef = useRef<HTMLDivElement>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);

  // 傾いた要素の矩形は回転で変わるため、回転しない外側の要素で位置を測る。毎回の描画を避けるため、CSS変数を直接書き換える。
  const tiltToward = (event: PointerEvent) => {
    const scene = sceneRef.current;
    if (!scene || reduceMotion) {
      return;
    }
    const rect = scene.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    scene.dataset["tilting"] = "";
    scene.style.setProperty("--tilt-x", `${(0.5 - y) * MAX_TILT_DEG * 2}deg`);
    scene.style.setProperty("--tilt-y", `${(x - 0.5) * MAX_TILT_DEG * 2}deg`);
    scene.style.setProperty("--light-x", `${x * 100}%`);
    scene.style.setProperty("--light-y", `${y * 100}%`);
  };

  const resetTilt = () => {
    const scene = sceneRef.current;
    if (!scene) {
      return;
    }
    delete scene.dataset["tilting"];
    scene.style.setProperty("--tilt-x", "0deg");
    scene.style.setProperty("--tilt-y", "0deg");
  };

  return (
    <div ref={sceneRef} className="group perspective-[1000px]">
      <div
        className="transition-transform duration-500 ease-out transform-3d group-data-tilting:duration-100 motion-reduce:transition-none"
        style={{ transform: "rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))" }}
      >
        <button
          type="button"
          aria-label="チェキを裏返す"
          aria-pressed={flipped}
          className={`relative block h-86 w-54 cursor-pointer touch-none rounded-lg transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] outline-none transform-3d focus-visible:ring-4 focus-visible:ring-blue-8 motion-reduce:transition-none ${flipped ? "rotate-y-180" : ""}`}
          onPointerDown={(event) => {
            pointerStart.current = { x: event.clientX, y: event.clientY };
            dragged.current = false;
            event.currentTarget.setPointerCapture?.(event.pointerId);
          }}
          onPointerMove={(event) => {
            tiltToward(event);
            const start = pointerStart.current;
            if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > DRAG_THRESHOLD_PX) {
              dragged.current = true;
            }
          }}
          onPointerUp={(event) => {
            pointerStart.current = null;
            // マウスは乗せている間だけ傾け、指は離したら元へ戻す。
            if (event.pointerType !== "mouse") {
              resetTilt();
            }
          }}
          onPointerCancel={resetTilt}
          onPointerLeave={resetTilt}
          onClick={() => {
            if (dragged.current) {
              dragged.current = false;
              return;
            }
            setFlipped((current) => !current);
          }}
        >
          <Front />
          <Back />
        </button>
      </div>
    </div>
  );
};
