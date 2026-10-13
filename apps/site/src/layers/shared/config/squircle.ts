const SUPPORTS_SQUIRCLE = CSS.supports("corner-shape", "squircle");

export const squircleRadius = (radius: number) => (SUPPORTS_SQUIRCLE ? radius : radius / 2);
