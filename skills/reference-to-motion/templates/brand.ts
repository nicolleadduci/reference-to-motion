/**
 * Brand tokens for the film. Fill every value from the brand's own source
 * (site CSS :root vars, Figma variables, brand guide) — never by eye.
 * kit.tsx imports from here.
 */
import { Easing, interpolate } from "remotion";
// Pick the brand font from @remotion/google-fonts, or load a local file with
// @remotion/fonts if the brand font is not on Google Fonts.
import { loadFont } from "@remotion/google-fonts/DMSans";

const { fontFamily } = loadFont();
export const FONT = fontFamily;

export const WHITE = "#ffffff";
export const HEADER = "#111111"; // darkest text colour — REPLACE
export const INK = "#141414"; // dark ground — REPLACE
export const LIGHT = "#f4f4f4"; // light ground — REPLACE
export const ACCENT = "#ff5a1f"; // the one accent — REPLACE
export const ACCENT_2 = "#ff8a5c"; // REPLACE

export const MED = 500;
export const SEMI = 600;

/** Arrives fast, settles slowly. */
export const ease = Easing.bezier(0.16, 1, 0.3, 1);
/** Small overshoot, for pops only. */
export const easeBack = Easing.bezier(0.34, 1.56, 0.64, 1);

/** Multi-stop clamped interpolate, for holds and round trips. */
export const path = (
  frame: number,
  stops: number[],
  values: number[],
  easing: (n: number) => number = ease,
) =>
  interpolate(frame, stops, values, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
