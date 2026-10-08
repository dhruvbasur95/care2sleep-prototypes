# Consumer Portal illustration assets

All committed Figma exports (file `s6OLTSd4nc9V9W9lT1oBTO`). Nothing here is
hand-drawn — see this project's standing rule about icons and illustrations.

## The two flat source exports are kept on purpose

`pillow-mascot.svg` (sleeping, 210.646 x 188) and `pillow-awake.svg` (awake,
138.158 x 90) have **no code references**. They are the originals that every
split layer below was extracted from, byte for byte, and they are the only way to
re-split without a fresh export. Do not delete them as orphans.

## Split layers, and why they exist

Each was produced by lifting `<path>` elements verbatim out of a flat export and
giving them that file's own unmodified `<svg>` open tag — so every layer keeps
its source's full coordinate space and the set stacks in perfect register with no
offsets to transcribe.

Sleeping pillow (welcome screen):
  pillow-body.svg      body, minus face and zzz
  pillow-face.svg      closed eyes, nose, mouth
  pillow-brows.svg     eyebrows (twitch on their own clock)
  z-small/-medium/-large.svg   the three zzz glyphs, animated in sequence

Awake pillow (Home):
  awake-body.svg       body, minus face
  awake-features.svg   nose + mouth
  awake-eyes.svg       eyes only — split so they can flip for the sleep state
  awake-brows.svg      eyebrows

The zzz glyphs are shared: Home's awake pillow renders them in a scaled box when
it naps, via the `Z_*` constants exported from `ConsumerCanvasWave`.

## Unreferenced but deliberately retained

  coach-card-blob.svg  the yellow blob the coach card used before frame
                       `771:3665` replaced it with a flat band. One line to
                       restore; documented in `design-tokens.md` §84.10.
