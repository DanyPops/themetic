# @danypops/themetic

An agentic, science-grounded [pi](https://pi.dev) theme generator.

`/skill:themetic <prompt>` (or just describing what you want, in natural
language) turns a mood into a legible pi theme — but the LLM only picks
*seed hues*. Palette generation, token-role assignment, and a pass/fail
quality gate (WCAG contrast with a safety margin, an Ecological Valence
Theory "mud zone" check, and a complementary-color vibration check) are
deterministic code, not model judgment. If the gate fails, the theme is not
written, and the model is expected to revise its seed hues and try again.

This runs as a [pi Skill](https://pi.dev) (`skills/themetic/SKILL.md`), not
a slash command with a hand-rolled prompt-injection step — the skill's full
instructions load directly into the current turn, so the whole research ->
seed -> generate -> gate -> retry loop happens natively in the TUI session.
The skill's instructions also tell the model to use a web-search/fetch tool
for real color research when one is active in the session, rather than
guessing from vibes alone.

Full research backing every rule in the gate — the actual papers, not
opinion — lives in the Papyrus doc
`agentic-pi-theme-maker-color-science-research-architecture-uste`. Read that
before changing `lib/gate.ts` or `lib/generate.ts`.

## Why the split

This project's own `industrial.json` theme (a separate pi-profiles theme,
unrelated package) shipped a saturated red-on-green color combination by
hand, undetected until a screenshot showed it "vibrating." Contrast math
alone didn't catch it. Themetic's gate exists so an LLM freely picking
"pleasant" colors from a prompt can't reproduce that failure mode silently —
every generated theme is checked against the same rules that caught it,
before it ever reaches disk.

## Usage

```
/skill:themetic make an armenian mountains based theme with deep browns, reds and oranges with blue & teal highlights
```

Or, since the skill is model-invocable by default (no `disable-model-
invocation`), just ask in plain language for a theme and the model can load
it on its own when the request matches. Either way, the model researches the
prompt's subject (using a web-search tool if one is active), picks 1-3 seed
hues grounded in real associations — not generic guesses — and calls the
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

Exactly one seed must be `"brand"` — the rest are `"secondary"`.

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

Walking skeleton only (see the task graph rooted at
`pi-theme-maker-agentic-science-grounded-theme-generator-wcnd` — Papyrus
IDs still carry the pre-rename slug, titles/bodies say "themetic"):

- ✅ `skills/themetic/SKILL.md` (`/skill:themetic <prompt>`, or model-invoked
  automatically) + `themetic_generate` tool as its deterministic backend
- ✅ Deterministic palette generator (OKLCH-aware neutral ramp, canonical
  semantic hues independent of the seed, luminance-matched background washes)
- ✅ Quality gate: schema completeness, WCAG contrast on real co-visible
  token pairs, EVT mud-zone check, complementary-vibration check
- ✅ Unit tests proving the gate catches this project's real historical
  red-on-green regression and an EVT mud-zone color
- ❌ Wallpaper-driven seed (`node-vibrant`) — separate task, not started
- ❌ Watch/auto-regenerate mode — separate task, not started
- ❌ Formal pi-profiles tie-in verification — separate task, not started

## License

MIT
