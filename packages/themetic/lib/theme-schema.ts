/**
 * pi's theme color token contract, hardcoded rather than read from
 * pi-coding-agent's internal files.
 *
 * This was a real bug, caught live: gate.ts originally reached into
 * `node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/theme/
 * theme-schema.json` via a relative path from lib/. That happened to exist in
 * local dev (a plain `npm install` installs peerDependencies too), but broke
 * the moment the package was actually installed via `pi install` — pi
 * provides `@earendil-works/pi-coding-agent` and friends to extensions itself
 * (see pi's packages.md: these are peer dependencies specifically so
 * packages do NOT bundle or expect to find their own copy), and in that real
 * runtime there was no such file anywhere on disk at all, not just a
 * different path.
 *
 * pi-coding-agent's public export surface (its package.json `exports` map)
 * also doesn't expose this data at runtime — `ThemeColor` is a compile-time
 * type re-exported from the main entry, not a runtime value. So there is no
 * robust way to *read* this list from the installed package; the required
 * token set is a stable, documented public contract (docs/themes.md, "Color
 * Tokens") instead. If it ever changes, update this file the same way any
 * consumer of a documented API contract would.
 */
export const REQUIRED_THEME_COLOR_KEYS = [
	"accent",
	"border",
	"borderAccent",
	"borderMuted",
	"success",
	"error",
	"warning",
	"muted",
	"dim",
	"text",
	"thinkingText",
	"selectedBg",
	"userMessageBg",
	"userMessageText",
	"customMessageBg",
	"customMessageText",
	"customMessageLabel",
	"toolPendingBg",
	"toolSuccessBg",
	"toolErrorBg",
	"toolTitle",
	"toolOutput",
	"mdHeading",
	"mdLink",
	"mdLinkUrl",
	"mdCode",
	"mdCodeBlock",
	"mdCodeBlockBorder",
	"mdQuote",
	"mdQuoteBorder",
	"mdHr",
	"mdListBullet",
	"toolDiffAdded",
	"toolDiffRemoved",
	"toolDiffContext",
	"syntaxComment",
	"syntaxKeyword",
	"syntaxFunction",
	"syntaxVariable",
	"syntaxString",
	"syntaxNumber",
	"syntaxType",
	"syntaxOperator",
	"syntaxPunctuation",
	"thinkingOff",
	"thinkingMinimal",
	"thinkingLow",
	"thinkingMedium",
	"thinkingHigh",
	"thinkingXhigh",
	"bashMode",
] as const;

/** Optional per docs/themes.md: falls back to thinkingXhigh when omitted. */
export const OPTIONAL_THEME_COLOR_KEYS = ["thinkingMax"] as const;
