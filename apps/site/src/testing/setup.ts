import { cleanup } from "@testing-library/react";
import { MotionGlobalConfig } from "motion/react";
import { afterEach } from "vitest";

// 試験環境のWeb Animationsは途中で破棄すると未処理のエラーになる。
MotionGlobalConfig.skipAnimations = true;

afterEach(() => {
  cleanup();
});
