# @danypops/themetic

Generates [pi](https://pi.dev) color themes from a natural-language prompt.

Run `/skill:themetic <prompt>` (or just describe what you want in natural
language). The model only picks *seed hues*. Palette generation, token-role
assignment, and a pass/fail quality gate are deterministic code, not model
judgment: WCAG contrast with a safety margin, an Ecological Valence Theory
"mud zone" check, and a complementary-color vibration check. If the gate
fails, the theme is not written, and the model revises its seed hues and
tries again.

This ships as a [pi Skill](https://pi.dev) (`skills/themetic/SKILL.md`)
rather than a slash command with a hand-rolled prompt-injection step. The
skill's full instructions load directly into the current turn, so the whole
research -> seed -> generate -> gate -> retry loop happens natively in the
TUI session. Those instructions also tell the model to use a web-search or
fetch tool for real color research when one is active in the session,
instead of guessing from vibes.

The research behind every rule in the gate, the actual papers rather than
opinion, lives in [`RESEARCH.md`](./RESEARCH.md). Read that before changing
`lib/gate.ts` or `lib/generate.ts`.

## Why the split

This project's own `industrial.json` theme (a separate pi-profiles theme,
in an unrelated package) shipped a saturated red-on-green color combination
by hand. Nobody caught it until a screenshot showed the colors visibly
"vibrating"; contrast math alone hadn't flagged it. Themetic's gate exists
so an LLM freely picking "pleasant" colors from a prompt can't reproduce
that failure silently. Every generated theme is checked against the same
rules that caught the original mistake, before it ever reaches disk.

## Usage

```
/skill:themetic make an armenian mountains based theme with deep browns, reds and oranges with blue & teal highlights
```

Or, since the skill is model-invocable by default (no `disable-model-
invocation`), just ask in plain language for a theme and the model can load
it on its own when the request matches. Either way, the model researches the
prompt's subject (using a web-search tool if one is active), picks 1-3 seed
hues grounded in real associations, not generic guesses, and calls the
`themetic_generate` tool, retrying with revised seeds if the tool reports a
quality-gate failure. Themes are written to `~/.pi/agent/themes/<name>.json`
and can be selected via `/settings` or referenced from a `pi-profiles`
profile's `theme` field.

### Walking-skeleton CLI (no LLM, for testing the deterministic pipeline directly)

```bash
node --experimental-strip-types scripts/generate-cli.ts scripts/armenian-mountains.spec.json
```

Spec file shape:

```json
{
  "name": "kebab-case-theme-name",
  "seeds": [
    { "hue": 8, "name": "pomegranate/flag-red", "role": "brand" },
    { "hue": 32, "name": "apricot/flag-orange", "role": "secondary" },
    { "hue": 190, "name": "teal-blue highlight", "role": "secondary" }
  ]
}
```

Exactly one seed must be `"brand"`; the rest are `"secondary"`.

## Install

Published on npm as `@danypops/themetic`:

```bash
pi install npm:@danypops/themetic
```

Or from this local checkout (e.g. while developing against an unpublished
change):

```bash
pi install ~/Projects/themetic
```

For local iteration without a full package install (extension + skill
together):

```bash
pi -e ~/Projects/themetic/index.ts --skill ~/Projects/themetic/skills/themetic
```

## Development

```bash
npm install
npm run check    # tsc --noEmit
npm test         # node --test, includes the gate's regression-catching tests
```

## Status

Walking skeleton:

Built:
- `skills/themetic/SKILL.md` (`/skill:themetic <prompt>`, or model-invoked
  automatically), with `themetic_generate` as its deterministic backend
- Deterministic palette generator (OKLCH-aware neutral ramp, canonical
  semantic hues independent of the seed, luminance-matched background washes)
- Quality gate: schema completeness, WCAG contrast on real co-visible
  token pairs, EVT mud-zone check, complementary-vibration check
- Unit tests proving the gate catches this project's real historical
  red-on-green regression and an EVT mud-zone color

Not started:
- Wallpaper-driven seed (`node-vibrant`)
- Watch/auto-regenerate mode
- Formal pi-profiles tie-in verification

## License

MIT
