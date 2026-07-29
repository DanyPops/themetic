# Research behind the gate

This is the actual research grounding every check in `lib/gate.ts` and
`lib/generate.ts`, not general opinion about "nice" colors.

## Why a gate exists at all

Themetic's `industrial.json` theme, hand-tuned for an earlier, unrelated
`pi-profiles` project, shipped a saturated red-on-green combination that
went undetected until a screenshot showed it visibly "vibrating." Contrast
math alone hadn't caught it, because the problem wasn't contrast; it was two
colors that are individually fine but clash as a pair. That gap is what the
mud-zone and vibration checks below exist to close.

## 1. Palette compatibility is a trained, data-driven model

O'Donovan, Agarwala & Hertzmann, ["Color Compatibility From Large
Datasets"](https://www.dgp.toronto.edu/~donovan/color/colorcomp.pdf) (2011).
Human ratings of thousands of 5-color palettes from Adobe Kuler and
COLOURLovers, tested against classical harmony theories, then used to train
a model that scores a palette's aesthetic quality. It's evidence that palette
quality is a property of color *combinations*, not colors in isolation,
which matches the actual failure this project hit: neither red nor green was
wrong on its own.

## 2. There's a deterministic algorithm for fixing disharmony

Cohen-Or, Sorkine, et al., ["Color
Harmonization"](https://www.cs.tau.ac.il/~dcor/articles/2006/Color-Harmonization.pdf)
(SIGGRAPH 2006). Harmonious palettes cluster into a small set of geometric
"hue templates" on the color wheel (one dominant hue sector, plus optional
secondary sectors at fixed angular offsets). Their correction step builds a
hue histogram, finds the best-fitting template, and nudges each color's hue
toward the nearest template sector. A reference implementation exists at
[fin-ger/color-harmonization](https://github.com/fin-ger/color-harmonization).

## 3. Some colors read as universally ugly, and there's a reason why

Palmer & Schloss, ["An Ecological Valence Theory of Human Color
Preference"](https://www.pnas.org/doi/10.1073/pnas.0906172107) (PNAS, 2010).
Color preference tracks the average emotional valence of the real-world
objects people associate with a color, not the wavelength itself. This is
the account behind Pantone 448C, market-research's "world's ugliest color":
a desaturated, hue-ambiguous olive-brown that testers associated with dirt,
tar, and rot. `isMudZone()` in `lib/color-math.ts` encodes this directly: a
warm hue (roughly 20-60 degrees) desaturated below about 32% risks landing
in that zone, unless it has enough saturation left (the lower bound this
project's own regression test caught) to read as a color rather than mud.

## 4. LLMs are validated at the prompt-to-color-association task specifically

["Large Language Models estimate fine-grained human color-concept
associations"](https://arxiv.org/html/2406.17781v1) (2024). GPT-4 predicts
human color-concept associations (what hue "cherry blossom" evokes, for
example) from language alone, at accuracy comparable to image-based methods,
with no special training. This is why the skill asks the model for seed
hues instead of assuming that job needs a different kind of system.

## Established baselines the gate also relies on

- WCAG 2.x contrast ratios (4.5:1 body text, 3:1 large text/UI): the
  industry-standard floor, with a margin added on top (`CONTRAST_MARGIN` in
  `lib/gate.ts`) since exact-floor tokens have no headroom for real-world
  factors like terminal transparency.
- Material Design's dark-theme guidance: saturated colors visually vibrate
  against dark surfaces, so reserve full saturation for one sparse accent
  and desaturate everything else
  (`m2.material.io/design/color/dark-theme.html`).
- HSL lightness is not perceptually uniform. A saturated green and a
  saturated orange at "the same" HSL lightness can differ noticeably in
  actual brightness; use WCAG relative luminance (or OKLCH) instead of
  raw HSL lightness when two backgrounds need to read as equally dark.
  This is why `generate.ts` matches background washes by luminance via
  binary search rather than by a fixed lightness constant
  (`hamvocke.com/blog/lets-create-a-terminal-color-scheme`).

## What this project deliberately doesn't do yet

It doesn't reimplement the O'Donovan trained model; the WCAG contrast,
mud-zone, and vibration checks in `lib/gate.ts` approximate it with
concrete, explainable rules instead. It doesn't do wallpaper-driven color
extraction (`node-vibrant` would be the natural tool for that); seed hues
currently come only from the model's own research into the prompt.
