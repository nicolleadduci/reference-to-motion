# Style guide — reference film

**Reference:** `<path to reference file>` (<what it is>)
**Format:** <W × H>, <fps> fps, <frames> frames, <secs> s.

How this was made: the file was decoded to every frame and read frame by frame.
Colours are sampled from full-resolution frames, timings are frame counts, and the
typeface was matched by measuring the headline against candidate fonts rendered in
Chrome. Anything judged by eye rather than measured is marked *(by eye)*.

---

## 1. The look in one paragraph
<grounds, type family, hero object, how scenes change (cuts or none), how UI is drawn>

## 2. Palette (sampled)
### Grounds
| Ground | Hex | Share of runtime | Where |
### Type colours
### Accents (each used once, for one job)

## 3. Type
| Role | Family / weight | Size at 1080p | Tracking | Leading | Case |
How the family was identified (ratios measured vs candidates).

## 4. Shot lengths
Hard cuts: <n>. Motion runs: <n>. Median hold <s>. Table of scenes with start frame,
length, ground, content.

## 5. Transition types
| Type | Count | Length (frames) | Easing | Example frames |

## 6. Camera moves
Pushes (% per second), trucks, parallax, holds that drift or not.

## 7. Texture and grain
Flat-patch std per ground; temporal noise; vignette; gradients.

## 8. How text enters and exits
### Enter — <frames per word, stagger, rise in em, blur, overshoot>
### Hold — <minimum read time measured>
### Exit — <direction, frames, overlap with next line>
### Variants
### Logo

## 9. Translating the style to <Brand>
| Reference | <Brand> | Note |
|---|---|---|
| Ground near-black #… | <brand dark> #… | |
| Light ground #… | <brand light> #… | |
| Accent #… | <brand accent> #… | |
| Typeface … | <brand font> … | tracking converted from site CSS |
| Hero object (…) | <brand hero object> | the bridge between scenes |
| Text motion … | … | |
