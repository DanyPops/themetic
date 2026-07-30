import type { Theme, ThemeColor } from "@earendil-works/pi-coding-agent";

/** One frame: a glyph plus the theme token that colors it -- not a pre-colored string, so a future tuner can swap the token per frame without touching the glyph sequence. */
export interface SpinnerFrame {
	glyph: string;
	token: ThemeColor;
}

export interface SpinnerPreset {
	name: string;
	frames: SpinnerFrame[];
	intervalMs: number;
}

/**
 * The working indicator originally hand-rolled as a loose, untracked
 * extension file (~/.pi/agent/extensions/blossom-geometry.ts) -- migrated
 * here verbatim (same glyphs, same tokens, same interval) as themetic's
 * first spinner preset.
 */
export const BLOSSOM_PRESET: SpinnerPreset = {
	name: "blossom",
	frames: [
		{ glyph: "▪", token: "dim" },
		{ glyph: "●", token: "border" },
		{ glyph: "◆", token: "success" },
		{ glyph: "■", token: "accent" },
		{ glyph: "▲", token: "warning" },
		{ glyph: "■", token: "accent" },
		{ glyph: "◆", token: "success" },
		{ glyph: "●", token: "border" },
	],
	intervalMs: 160,
};

export const SPINNER_PRESETS: Record<string, SpinnerPreset> = {
	blossom: BLOSSOM_PRESET,
};

export const DEFAULT_SPINNER_PRESET = BLOSSOM_PRESET;

/** Resolves a preset's frames against the active theme's own token colors -- called fresh at session_start so a spinner reflects whichever theme is active, not whichever was active when the preset was defined. */
export function resolveSpinnerFrames(preset: SpinnerPreset, theme: Theme): string[] {
	return preset.frames.map(({ glyph, token }) => theme.fg(token, glyph));
}
