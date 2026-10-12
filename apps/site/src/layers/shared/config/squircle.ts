const SUPPORTS_SQUIRCLE = CSS.supports("corner-shape", "squircle");

/*
 * Motionの`style`へ渡す角丸の半径。拡大・縮小中の角丸の補正はpxの値にしか効かないため、CSSの`squircle-*`を使えない要素で使う。
 * 非対応のブラウザでは、squircleと近い見た目になる半分の半径の円にする。
 */
export const squircleRadius = (radius: number) => (SUPPORTS_SQUIRCLE ? radius : radius / 2);
