import { cleanup } from "@testing-library/react";
import { MotionGlobalConfig } from "motion/react";
import { afterEach } from "vitest";

// 試験環境のWeb Animationsは途中で破棄されると未処理のエラーになるため、Motionのアニメーションはすぐに完了させる。
MotionGlobalConfig.skipAnimations = true;

// 1つの試験ファイルで複数回描画するため、試験ごとにDOMを捨てる。
afterEach(() => {
  cleanup();
});
