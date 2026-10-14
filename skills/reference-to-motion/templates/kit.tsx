import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { FONT, HEADER, MED, SEMI, WHITE, ease, easeBack } from "./brand";

/* ================================================================== *
 * The grid
 *
 * Set BEATF from scripts/music.js (frames per beat = 60 / BPM * FPS).
 * Bars and beats are 1-indexed so code reads the same as the shot list:
 * fr(7, 3) is bar 7, beat 3; fr(2, 3.5) is the off-beat after beat 3.
 * Every frame number in the film is the frame a move LANDS on. If the
 * track does not start on a downbeat, add the first-downbeat offset here.
 * ================================================================== */
export const W = 1920;
export const H = 1080;
export const FPS = 30;
export const DURATION = 1800; // frames: seconds x FPS
export const BEATF = 19.3545; // 93 BPM at 30 fps — REPLACE per track
export const fr = (bar: number, beat = 1) =>
  Math.round(((bar - 1) * 4 + (beat - 1)) * BEATF);

/** Headline tracking — take it from the brand CSS (px tracking / font size = em). */
export const TRACK = "-0.03em";
export const MUTED = "rgba(12,10,8,0.5)";

export const easeIn = Easing.in(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);
export const easeOutQuad = Easing.out(Easing.quad);
/** Lands with a small overshoot: the word arrives, it does not drift in. */
export const easeBackSoft = Easing.bezier(0.2, 1.25, 0.4, 1);

/** Clamped two-stop interpolate. */
export const cl = (
  f: number,
  a: number,
  b: number,
  from: number,
  to: number,
  e: (n: number) => number = ease,
) =>
  interpolate(f, [a, b], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: e,
  });

/** A pop that finishes on `at`. */
export const pop = (f: number, at: number, dur = 10) =>
  cl(f, at - dur, at, 0, 1, easeBack);

/* ================================================================== *
 * Words — the reference's text move.
 *
 * Each word rises 0.35em while fading in over 8 frames, 2 frames after
 * the one before. With `land`, the LAST word finishes on that frame.
 * `starts` places every word by hand instead. The exit runs the same
 * way upward, so a line leaving and a line arriving overlap.
 * ================================================================== */
export const Words: React.FC<{
  lines: string[];
  size: number;
  land?: number;
  starts?: number[];
  out?: number;
  color?: string;
  weight?: number;
  align?: "left" | "center";
  lineHeight?: number;
  /** word index -> frame it snaps on (no rise). */
  snap?: Record<number, number>;
  /** word index -> colour override. */
  tint?: (k: number, f: number) => string | undefined;
  from?: "below" | "left" | "right";
  to?: "above" | "left" | "right";
  /** Each LINE arrives and leaves as one piece; lines follow each other and the last lands on `land`. */
  whole?: boolean;
  /** With `whole`: the frame each line lands on, when lines should hit specific beats. */
  lineLands?: number[];
  /** word index -> extra scale, for a beat on one word. */
  scaleOf?: (k: number, f: number) => number;
}> = ({
  lines,
  size,
  land,
  starts,
  out,
  color = WHITE,
  weight = MED,
  align = "center",
  lineHeight = 1.1,
  snap = {},
  tint,
  from = "below",
  to = "above",
  whole = false,
  lineLands,
  scaleOf,
}) => {
  const f = useCurrentFrame();
  const all = lines.map((l) => l.split(" "));
  const total = all.reduce((n, ws) => n + ws.length, 0);
  const outStep = whole ? 0 : Math.min(2, 10 / total);
  let k = 0;
  return (
    <div
      style={{
        fontFamily: FONT,
        fontWeight: weight,
        fontSize: size,
        letterSpacing: TRACK,
        lineHeight,
        color,
        textAlign: align,
        whiteSpace: "nowrap",
      }}
    >
      {all.map((ws, li) => (
        <div key={li}>
          {ws.map((w, wi) => {
            const i = k++;
            const s = whole ? (lineLands ? lineLands[li] : (land ?? 0) - (all.length - 1 - li) * 7) - 10 : starts ? starts[i] : (land ?? 0) - 8 - (total - 1 - i) * 2;
            const snapAt = snap[i];
            const tin = snapAt !== undefined ? (f >= snapAt ? 1 : 0) : cl(f, s, s + 8, 0, 1);
            const lift = snapAt !== undefined ? tin : cl(f, s, s + 10, 0, 1);
            const e =
              out === undefined
                ? 0
                : cl(f, out + (whole ? li * 3 : i * outStep), out + (whole ? li * 3 : i * outStep) + 6, 0, 1, easeIn);
            const sc = (snapAt !== undefined ? cl(f, snapAt, snapAt + 4, 1.03, 1) : 1) * (scaleOf?.(i, f) ?? 1);
            return (
              <span
                key={wi}
                style={{
                  display: "inline-block",
                  marginRight: wi < ws.length - 1 ? "0.25em" : 0,
                  opacity: tin * (1 - e),
                  transform: `translate(${((from === "left" ? -1 : from === "right" ? 1 : 0) * (1 - lift) + (to === "left" ? -1 : to === "right" ? 1 : 0) * e) * 0.4}em, ${(from === "below" ? (1 - lift) * 0.3 : 0) - (to === "above" ? e * 0.3 : 0)}em) scale(${sc})`,
                  filter: tin < 1 || e > 0 ? `blur(${((1 - tin) * 2.5 + e * 2.5).toFixed(2)}px)` : undefined,
                  color: tint?.(i, f),
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/** The small uppercase label. The only capitals in the film. */
export const Eyebrow: React.FC<{
  text: string;
  land: number;
  out?: number;
  color?: string;
}> = ({ text, land, out, color = MUTED }) => {
  const f = useCurrentFrame();
  const tin = cl(f, land - 8, land, 0, 1);
  const e = out === undefined ? 0 : cl(f, out, out + 7, 0, 1, easeIn);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        fontFamily: FONT,
        fontWeight: SEMI,
        fontSize: 30,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color,
        whiteSpace: "nowrap",
        opacity: tin * (1 - e),
        transform: `translateY(${(1 - tin) * 10 - e * 10}px)`,
        filter: tin < 1 || e > 0 ? `blur(${((1 - tin) * 2 + e * 2).toFixed(2)}px)` : undefined,
      }}
    >
      {text}
    </div>
  );
};

/** The slow push every held frame gets: about 2% a second. */
export const Push: React.FC<{
  from: number;
  rate?: number;
  origin?: string;
  children: React.ReactNode;
}> = ({ from, rate = 0.02, origin = "50% 50%", children }) => {
  const f = useCurrentFrame();
  const s = 1 + (rate * Math.max(0, f - from)) / FPS;
  return (
    <AbsoluteFill style={{ transform: `scale(${s})`, transformOrigin: origin }}>
      {children}
    </AbsoluteFill>
  );
};

/** Dither-level grain. Only ever drawn over the aurora, which bands without it. */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.03 }) => {
  const f = useCurrentFrame();
  const seed = Math.floor(f / 2) % 8;
  return (
    <AbsoluteFill style={{ opacity, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <filter id={`fg-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} seed={seed} />
        </filter>
        <rect width={W} height={H} filter={`url(#fg-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

/** A check mark, tick only, in any colour. Swap in the brand's own icon if it has one. */
export const Check: React.FC<{ size: number; color: string; stroke?: number }> = ({
  size,
  color,
  stroke = 2.2,
}) => (
  <svg width={size} height={size} viewBox="4.5 2.5 12 10" fill="none">
    <path
      d="M6.75 8.25L9 10.5L15 4.5"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** A touch shown as a soft dot rather than a hand. */
export const Tap: React.FC<{ at: number; x: number; y: number }> = ({ at, x, y }) => {
  const f = useCurrentFrame();
  if (f < at - 9 || f > at + 12) return null;
  const s = cl(f, at - 8, at, 1.5, 1);
  const o = cl(f, at - 8, at - 2, 0, 1) * cl(f, at + 4, at + 11, 1, 0);
  return (
    <div
      style={{
        position: "absolute",
        left: x - 30,
        top: y - 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        background: "rgba(0,0,0,0.3)",
        boxShadow: "0 0 0 2px rgba(255,255,255,0.55)",
        opacity: o,
        transform: `scale(${s})`,
      }}
    />
  );
};

/**
 * The barn door. A scene's ground opens from a vertical line at centre
 * (the hero object — e.g. a phone or card — seen edge-on) and can close back to it.
 */
export const doorClip = (
  f: number,
  drop: [number, number],
  open: [number, number],
  close?: [number, number],
  w = W,
  h = H,
) => {
  const lineH = cl(f, drop[0], drop[1], 0, h, easeIn);
  let half = cl(f, open[0], open[1], 3, w / 2 + 2, easeInOut);
  if (close && f >= close[0]) half = cl(f, close[0], close[1], w / 2 + 2, 3, easeInOut);
  const side = Math.max(0, w / 2 - half);
  return `inset(0px ${side}px ${Math.max(0, h - lineH)}px ${side}px)`;
};

export const card = (r = 24): React.CSSProperties => ({
  background: WHITE,
  borderRadius: r,
  boxShadow: "0 6px 28px rgba(12,10,8,0.07), 0 1px 2px rgba(12,10,8,0.05)",
});

export const ui = (size: number, weight = 400, color = HEADER): React.CSSProperties => ({
  fontFamily: FONT,
  fontSize: size,
  fontWeight: weight,
  color,
  letterSpacing: "-0.01em",
  lineHeight: 1.3,
});
