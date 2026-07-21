/**
 * Color math primitives for themetic's deterministic pipeline.
 *
 * Deliberately built on `culori` rather than hand-rolled: WCAG luminance/
 * contrast math has subtle correctness pitfalls (gamma correction, per-
 * channel coefficients) that this project got wrong-by-omission for hours
 * during manual industrial.json tuning before switching to real luminance
 * math. See docs/agentic-pi-theme-maker research doc for the incident
 * history this module is meant to prevent from recurring.
 */
import { converter, formatHex, parse, wcagContrast, wcagLuminance } from "culori";
import type { Oklch } from "culori";

const toOklch = converter("oklch");
const toHsl = converter("hsl");

export interface HslColor {
	h: number;
	s: number;
	l: number;
}

/**
 * Safety margin added on top of the bare WCAG floor (3:1 large-text/UI, 4.5:1 body text).
 *
 * Found by hand, the expensive way: `industrial.json`'s `dim` token shipped at 1.95:1
 * against its own *assumed, opaque* background — below even the loosest WCAG floor before
 * any real-world factor touched it. A user then reported it unreadable under a transparent
 * terminal compositing with desktop wallpaper, which shifts the effective background away
 * from whatever hex the theme assumed. A token sitting exactly on the bare minimum has zero
 * room for that shift; this margin exists so passing the gate means "readable with some
 * headroom," not "readable in the one exact composited scenario nobody but a screenshot
 * actually tested." `success`/`toolDiffAdded` on `toolSuccessBg` had the same problem (2.01:1,
 * two supposedly-tuned greens re-drifted below the floor against each other without either
 * change alone looking wrong).
 *
 * Shared between the gate (lib/gate.ts, which enforces it) and the generator
 * (lib/generate.ts, which must target it — not just the bare floor — via ensureContrast()
 * below, so generated themes are self-correcting instead of relying on fixed lightness
 * constants that happen to work for one hue/saturation combination and quietly fail another.
 */
export const CONTRAST_MARGIN = 0.5;

/** Parse a hex color into OKLCH (perceptually uniform: lightness/hue behave predictably). */
export function hexToOklch(hex: string): Oklch {
	const parsed = parse(hex);
	if (!parsed) throw new Error(`Invalid color: ${hex}`);
	const result = toOklch(parsed);
	return { mode: "oklch", l: result.l, c: result.c ?? 0, h: result.h ?? 0 };
}

/** Render an OKLCH color back to a hex string (clamped to the sRGB gamut by culori). */
export function oklchToHex(color: { l: number; c: number; h: number }): string {
	return formatHex({ mode: "oklch", l: color.l, c: color.c, h: color.h });
}

/** Parse a hex color into HSL, used specifically for the mud-zone check (see isMudZone). */
export function hexToHsl(hex: string): HslColor {
	const parsed = parse(hex);
	if (!parsed) throw new Error(`Invalid color: ${hex}`);
	const result = toHsl(parsed);
	return { h: result.h ?? 0, s: result.s ?? 0, l: result.l ?? 0 };
}

/** WCAG 2.x contrast ratio between two hex colors (1-21). culori-native, not hand-rolled. */
export function contrastRatio(a: string, b: string): number {
	return wcagContrast(a, b);
}

/** WCAG relative luminance (0-1). Use this to compare "how bright two colors actually look,"
 * never raw HSL/OKLCH lightness numbers — see the toolSuccessBg incident in project history:
 * a saturated green and a saturated orange at "the same lightness" number read as very
 * different brightness on screen. */
export function relativeLuminance(hex: string): number {
	return wcagLuminance(hex);
}

/**
 * Ecological Valence Theory "mud zone" check (Palmer & Schloss 2010; Pantone 448C).
 * A desaturated, hue-ambiguous warm-brown in roughly the 20-60 degree hue range reads as
 * dirt/rot/decay and is reliably disliked, independent of the rest of a palette's harmony.
 * Reference point: Pantone 448C is #4A412A, which is h≈43 s≈28% l≈23% in HSL.
 *
 * The saturation band has a *lower* bound as well as an upper one. Caught during themetic's
 * own walking-skeleton testing: a neutral gray ramp tinted only ~6% toward a warm brand hue
 * (deliberately, for cohesion — see generateDarkTheme) landed in a naive "s < 0.32" check
 * identically to a genuinely dirty 28%-saturated brown. A 6%-saturated color reads as plain
 * gray to the eye, not as mud; below ~12% saturation there isn't enough chroma left for hue
 * to register as an unpleasant color at all, only as a neutral with a faint cast.
 */
export function isMudZone(hex: string): boolean {
	const { h, s, l } = hexToHsl(hex);
	const inHueRange = h >= 20 && h <= 60;
	const perceptiblyMuddySaturation = s >= 0.12 && s < 0.32;
	const lowMidLightness = l >= 0.12 && l <= 0.42;
	return inHueRange && perceptiblyMuddySaturation && lowMidLightness;
}

/** Shortest angular distance between two hues (0-360), result in [0, 180]. */
export function hueDistance(h1: number, h2: number): number {
	const diff = Math.abs(h1 - h2) % 360;
	return diff > 180 ? 360 - diff : diff;
}

/**
 * Complementary-vibration check (Material Design dark-theme guidance; Orbix Studio's color
 * palette guide). Two colors that are near-complementary in hue AND both highly saturated
 * "vibrate" against each other regardless of their individual contrast ratio — this is
 * exactly the bug this project shipped by hand (saturated red text on saturated green
 * background) before catching it via a screenshot, not via contrast math.
 */
export function isVibrating(hexA: string, hexB: string): boolean {
	const a = hexToHsl(hexA);
	const b = hexToHsl(hexB);
	// Threshold set from this project's actual regression, not the textbook 180-degree
	// definition of "complementary": pure red (h=0) and pure green (h=120) are only
	// 120 degrees apart, yet that exact pairing is what vibrated on screen and prompted
	// this whole check. Triadic-or-wider hue separation with both colors saturated is
	// the empirically-relevant risk zone, not just true 180-degree complements.
	const hueSeparated = hueDistance(a.h, b.h) >= 90;
	const bothSaturated = a.s >= 0.6 && b.s >= 0.6;
	return hueSeparated && bothSaturated;
}

/** Return a copy of a hex color with saturation scaled by `factor` (0-1), same hue/lightness. */
export function desaturate(hex: string, factor: number): string {
	const { h, s, l } = hexToHsl(hex);
	return formatHex({ mode: "hsl", h, s: s * factor, l });
}

/** Build a hex color directly from HSL components (h in degrees, s/l in 0-1). */
export function hsl(h: number, s: number, l: number): string {
	return formatHex({ mode: "hsl", h, s, l });
}

/**
 * Nudge a color's lightness (keeping hue/saturation) until it reaches `minRatio` contrast
 * against `bgHex`, searching toward lighter or darker as needed. Exists so the generator
 * *guarantees* the gate's thresholds rather than relying on fixed lightness constants that
 * happen to work for one hue/saturation combination and quietly fail for another — which is
 * exactly what happened with the neutral ramp's `dim`/`muted` roles across different seed hues.
 */
export function ensureContrast(hex: string, bgHex: string, minRatio: number): string {
	if (contrastRatio(hex, bgHex) >= minRatio) return hex;
	const { h, s, l } = hexToHsl(hex);
	const bgIsDark = relativeLuminance(bgHex) < 0.5;
	// If the background is dark, go lighter to gain contrast; if light, go darker.
	let lo = bgIsDark ? l : 0;
	let hi = bgIsDark ? 1 : l;
	let candidate = hex;
	for (let i = 0; i < 40; i++) {
		const mid = (lo + hi) / 2;
		candidate = hsl(h, s, mid);
		const ratio = contrastRatio(candidate, bgHex);
		if (ratio >= minRatio) {
			if (bgIsDark) hi = mid;
			else lo = mid;
		} else {
			if (bgIsDark) lo = mid;
			else hi = mid;
		}
	}
	// `hi`/`lo` converge on the boundary; return the side guaranteed to meet the ratio.
	return hsl(h, s, bgIsDark ? hi : lo);
}
