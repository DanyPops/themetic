# Themetic

Generates [pi](https://pi.dev) color themes from a natural-language prompt.

Run `/skill:themetic <prompt>` (or just describe what you want in natural
language). The model only picks *seed hues*. Palette generation, token-role
assignment, and a pass/fail quality gate are deterministic code, not model
judgment: WCAG contrast with a safety margin, an Ecological Valence Theory
"mud zone" check, and a complementary-color vibration check. If the gate
fails, the theme is not written, and the model revises its seed hues and
tries again.

## Packages

- [`packages/themetic`](packages/themetic) (`@danypops/themetic`) — the
  deterministic library: palette generation, the quality gate, color math.
  No model, no Pi dependency. See its
  [`RESEARCH.md`](packages/themetic/RESEARCH.md) for the papers behind every
  gate check — read that before changing `lib/gate.ts` or `lib/generate.ts`.
- [`packages/pi-themetic`](packages/pi-themetic) (`@danypops/pi-themetic`) —
  the installable Pi extension: the `themetic_generate` tool plus the
  `skills/themetic/SKILL.md` skill that drives the research -> seed ->
  generate -> gate -> retry loop. This is the package you install.

## Why the split (extension vs. library)

This project's own `industrial.json` theme shipped a saturated
red-on-green color combination by hand. Nobody caught it until a screenshot
showed the colors visibly "vibrating"; contrast math alone hadn't flagged
it. Themetic's gate exists so an LLM freely picking "pleasant" colors from a
prompt can't reproduce that failure silently. Every generated theme is
checked against the same rules that caught the original mistake, before it
ever reaches disk.

`@danypops/themetic` and `@danypops/pi-themetic` are separate packages so
the deterministic gate/generator logic can be tested, versioned, and reused
(e.g. by the walking-skeleton CLI) independent of the Pi extension surface
that wraps it.

## Install

```bash
pi install npm:@danypops/pi-themetic
```

Or from this local checkout (e.g. while developing against an unpublished
change):

```bash
pi install ~/Projects/themetic
```

## Usage

```
/skill:themetic make an armenian mountains based theme with deep browns, reds and oranges with blue & teal highlights
```

Or, since the skill is model-invocable by default, just ask in plain
language for a theme and the model can load it on its own when the request
matches. Either way, the model researches the prompt's subject (using a
web-search tool if one is active), picks 1-3 seed hues grounded in real
associations, not generic guesses, and calls the `themetic_generate` tool,
retrying with revised seeds if the tool reports a quality-gate failure.
Themes are written to `~/.pi/agent/themes/<name>.json` and can be selected
via `/settings` or `"theme": "<name>"` in `settings.json`.

### Walking-skeleton CLI (no LLM, for testing the deterministic pipeline directly)

```bash
node --experimental-strip-types packages/themetic/scripts/generate-cli.ts packages/themetic/scripts/armenian-mountains.spec.json
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

## Development

```bash
npm install
npm run check    # tsc --noEmit, every package
npm test         # every package's own tests (currently: the gate's regression-catching tests)
```

## License

MIT
