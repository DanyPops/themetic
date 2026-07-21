---
name: themetic
description: Generates a legible, science-grounded pi color theme from a natural-language prompt (e.g. a place, culture, material, mood). Use when asked to create, generate, or design a pi theme or color scheme, or when the user runs /themetic or /skill:themetic.
metadata:
  package: "@danypops/themetic"
---

# Themetic

You generate pi color themes. Your job stops at picking **seed hues** grounded
in real associations — you do not pick final colors, and you do not write the
theme file directly. Palette generation, token-role assignment, and a
pass/fail quality gate are deterministic code in the `themetic_generate` tool,
not your judgment. This split exists because this project shipped a
saturated red-on-green color combination by hand before a screenshot caught
it — contrast math alone didn't, and free-form color choices don't self-audit.
Do not try to shortcut the tool by describing colors in prose instead of
calling it.

## 1. Research the subject — use search if you have it

If a web search or web-fetch tool is active in your current tool set, use it
before picking seed hues. Look for concrete, verifiable color references for
the prompt's subject: a flag, a national symbol, a native plant or mineral,
an architectural material, a well-known landmark's actual coloring. One real
fact beats a vague adjective — e.g. Armenia's flag is literally red/blue/
apricot-orange, and apricot (*Prunus armeniaca*) is named for Armenia; that's
a better seed basis than guessing "warm mountain colors" from vibes alone.

If no search tool is active, reason from what you already know, but hold
yourself to the same bar: name a specific real reference (a flag, a fruit, a
mineral, a landmark), not a generic mood word. This is a validated LLM
strength (language models predict human color-concept associations at
accuracy comparable to image-based methods — see the themetic research doc),
but only when grounded in something specific enough to have an actual hue.

## 2. Pick 1-3 seed hues

Convert your research into 1-3 hues (0-360 degrees on the color wheel).
Mark exactly one as `"brand"` — the single most central/saturated hue,
reserved for the theme's sparse accent color. Mark the rest `"secondary"`.

Do not pick more than 3. Do not try to encode every color mentioned in the
prompt as a separate seed — e.g. "deep browns, reds, oranges, blue and teal
highlights" is one warm hue family (browns are what the neutral ramp looks
like once tinted toward a red/orange brand hue, not a separate seed) plus a
cool highlight family; you don't need five discrete seeds to honor five color
words.

## 3. Call `themetic_generate`

Call the tool with a kebab-case `name` and your seed hues. It runs the
deterministic pipeline and a quality gate (WCAG contrast with a safety
margin, an Ecological Valence Theory "mud zone" check, a complementary-color
vibration check) before writing anything.

**If it throws with gate failure reasons: read them, adjust your seed hues
accordingly, and call it again.** This is expected, not an error state to
give up on — it's the gate doing its job. Do not retry blindly; the failure
message names the specific check and tokens involved. Do not fall back to
describing colors in prose instead of continuing to call the tool.

## 4. Report the result

Once it succeeds, tell the user the theme name and that it's been written to
`~/.pi/agent/themes/<name>.json`. Mention it can be selected via `/settings`,
`"theme": "<name>"` in `settings.json`, or referenced from a `pi-profiles`
profile's `theme` field.
