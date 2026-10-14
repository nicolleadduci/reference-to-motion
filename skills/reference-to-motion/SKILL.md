---
name: reference-to-motion
description: Build a brand motion-graphics film (launch film, teaser, brand story, homepage video) in Remotion by reverse-engineering a reference video the user supplies — measure its structure, palette, type, shot lengths, transitions, camera and text motion frame by frame, write a style guide and a bar/beat shot list, translate it to the client's brand, optionally cut everything to the music's beat grid, then build, check frame by frame, and iterate in saved versions. Use when the user sends a reference video and says "reference to motion", "make something like this for <brand>", "match this style", "launch film", "brand teaser", "motion graphics video", "cut it to the music", or starts any new Remotion motion-graphics video project.
---

# Motion graphics film from a reference

Built from a real production: a :60 music-only launch film matched to a
client-supplied reference, taken through more than ten client feedback rounds
to approval. The method: **measure the reference, don't eyeball it;
write it down before building; put every move on the music's grid; check
every render by reading frames.**

Run the phases in order. Phases 1–4 end in two documents the user reviews
before anything is built. Do not skip to building.

---

## Phase 0 — Intake. Ask for everything at once

Check the conversation and folders first; only ask for what is missing. Use
one message listing the gaps (not a drip of questions).

**Must have**
1. **Reference video** as a local file (mp4/mov). If they send a YouTube/Vimeo
   link, say up front that it cannot be opened and ask for a download.
2. **Script**: scene-by-scene table with timing, visual description, exact
   on-screen copy, and VO (say whether VO is used or it is music-only).
3. **Brand source**: website URL and/or brand guide/Figma file — logo as
   **SVG masters** (site PNGs are often tiny), font names, colour hex values.
4. **Format and length**: duration, aspect(s) (16:9 web, 9:16 stories, 1:1),
   fps (default 30), where it will play.
5. **Output folder** and file naming (default
   `YYYY-MM-DD_<Client>-<Project>_v<N>.mp4`).

**Should have**
6. **Music track** (mp3/wav) if the cut should sit on the beat. Ask whether
   the picture must follow the music's beat (recommended for music-only films).
7. **Footage/photos**: stock, AI-generated clips, product screenshots. Say what
   each scene will use if none are given (site imagery, rebuilt vector UI).
8. **Creative direction and guardrails**: what must never happen (e.g. logo
   never split, no italics, exact copy only, no invented claims).
9. **Open client items**: unapproved stats, legal/source lines, third-party
   marks (Apple Pay, partner logos), stand-in names. These become placeholders
   that are flagged, never invented.

Also check any notes from earlier projects for this client/brand (brand
tokens, logo paths, the user's standing preferences).

---

## Phase 1 — Set up

- Reuse the client's existing Remotion project if there is one (add a new
  composition + `src/<film>/` folder) rather than starting fresh; check its
  brand kit file first (fonts, colours, logo component, easing helpers).
- New project: `templates/kit.tsx` + `templates/brand.ts` go into `src/<film>/`.
- ffmpeg: `source scripts/ffmpeg-env.sh <remotion-project>` → `$FF`, `$FFPROBE` (system ffmpeg if installed, else Remotion's bundled one).
  Remotion's bundled build needs its library path set (the script does it),
  has **no rawvideo muxer** (use `-c:v rawvideo -f image2pipe`, as every
  command here does) and almost no filters — the analysis is done in Node.
- Work files (raw dumps, contact sheets) go in the session scratchpad.
  Scripts here are plain Node, no dependencies.

---

## Phase 2 — Take the reference apart (→ `docs/style_guide.md`)

Every number in the style guide is measured. Mark anything judged by eye as
*(by eye)*.

1. **Probe**: `$FFPROBE` duration, fps, size, audio streams.
2. **Structure** — tiny dump + cut/motion detector:
   ```
   $FF -i ref.mp4 -an -vf scale=96:54 -pix_fmt rgb24 -c:v rawvideo -f image2pipe small.rgb
   node scripts/cuts.js small.rgb 96 54 30
   ```
   Gives hard cuts with shot lengths (a reference with **zero** cuts — every change
   a move or morph — tells you the whole film must be built without cuts), every motion
   run (start, length in frames), hold lengths, activity per half second.
3. **Overview sheets** — one frame every 0.5 s, numbered:
   ```
   $FF -i ref.mp4 -an -vf scale=384:216 -pix_fmt rgb24 -c:v rawvideo -f image2pipe mid.rgb
   node scripts/sheet.js mid.rgb ov0.png 0 15 25 5     # repeat with start += 375
   ```
   Read every sheet. Write the scene map: what is on screen, ground colour,
   hero object, where copy sits.
4. **Transition close-ups** — for every motion run from step 2, a sheet at
   step 1–2 frames (`sheet.js mid.rgb t<start>.png <start> 2 25 5`). From these
   record: transition type (wipe, morph, push, door, match-move, through an
   object), its length in frames, easing feel, what leads/follows.
5. **Text motion** — on the headline transitions count: frames per word,
   stagger between words, rise distance (in em of the type size), blur,
   overshoot, how the old line leaves (direction, overlap with the next).
6. **Palette, grain** — full-res frames from each ground:
   ```
   $FF -ss <sec> -i ref.mp4 -frames:v 1 -pix_fmt rgb24 -c:v rawvideo -f image2pipe 400.rgb
   node scripts/colors.js 1920 1080 400.rgb 401.rgb
   ```
   Dominant colours = grounds, saturated = accents, flat-patch std = grain
   (two consecutive frames → animated-grain check).
7. **Type** — native crops (`scripts/crop.js out.png 1920 400.rgb:x:y:w:h`) to
   read the letterforms; then identify family + weight with
   `scripts/font-match.html` in headless Chrome (ratios of ink width,
   x-height and x-band coverage vs the same ratios on the crop). Measure
   tracking and leading from the crop.
8. **Camera** — pushes (scale per second), trucks, parallax, whether held
   frames drift. Note any slow push — and see the preferences below before
   copying it.

Write `docs/style_guide.md` from `templates/style_guide.md`: the look in one
paragraph, palette, type, shot lengths, transition types, camera moves,
texture/grain, how text enters and exits, logo handling, and **section 9:
translation table, reference → client brand** (ground for ground, font for
font, accent for accent, hero object for hero object).

---

## Phase 3 — Take the brand in

- Fetch the site's HTML (browser UA) and stylesheet: `:root` variables,
  `@font-face`, h1–h4 / eyebrow / button rules → exact hex, font, weight,
  tracking (convert px tracking to em).
- Download the site's images, icons and logos into `<output>/assets/site/`
  and make small previews to look at them. Note sizes — upscaled PNG logos
  look soft; use SVG masters.
- Map each script scene to assets (site photo, stock, AI clip, rebuilt vector
  UI). Rebuild product UI as vector cards in code; never screen-record or
  upscale small GIFs.
- Brand rules are hard rules: lockup never split or re-coloured, only brand
  colours in transitions, exact copy.

---

## Phase 4 — The music (optional, recommended for music-only films)

```
$FF -i track.mp3 -ac 2 -ar 48000 -c:a pcm_s16le music.wav
node scripts/music.js music.wav                 # tempo candidates, downbeat, per-bar energy
node scripts/fold.js music.wav <beat_s> <downbeat_s> 3-10 11-14   # where kick/snare sit, splice pairs
```

- **Do not trust the top tempo blindly.** Bass patterns alias (a 93 BPM track can read as
  124 — a 3-against-4 alias from the bass). Pick the candidate whose fold shows
  snare/hats on beats 2 and 4, then re-run `music.js` with that beat length.
- From the per-bar table, write the structure: intro, groove entries, breaks,
  accented downbeats, the real ending. Phrase length (usually 2 or 4 bars).
- **Fit the track to the film length on the bar line**: drop or repeat whole
  bars where `fold.js` shows two bars are harmonically identical, keep the
  track's real ending. Build the bed:
  `node scripts/mix.js music.wav public/<film>/mix.wav <secs> <beat_s> <downbeat_s> 1:1,21:25`
  (−14 LUFS, −1.2 dBFS ceiling, 10 ms equal-power joins). Check with
  `node scripts/lufs.js`.
- Set `BEATF` in `kit.tsx` (beat in frames). From here every time in the film
  is `fr(bar, beat)`, never a typed frame number.
- **Beat rules** that worked: moves *land* on the beat (start early by their
  duration); scene changes on bar 1 of a phrase; pops/taps/words on the snare
  (2 and 4); payoffs on accented downbeats; in a break, follow the hits not
  the grid; end-card accents on the track's last real hits.
- Say clearly the edit has not been listened to; the user must audition it.

---

## Phase 5 — Shot list (→ `docs/shotlist.md`), then stop for review

From `templates/shotlist.md`: format table; music map (film bars ↔ track bars
↔ what the music does ↔ scene); beat rules; design constants (grounds, type
sizes, cards, phone/hero object, text enter/exit spec); asset table; then
**one table per scene: shot · bar.beat · frame · picture and motion · copy**.
End with a copy check against the script (word for word), a guardrail check,
and open items (placeholders, unapproved stats, marks).

Readability check before handing over: every line must be fully on screen long
enough to read (≈ 0.3 s per word, 1.2 s minimum); first frame not blank.

Deliver both docs and wait for the go-ahead.

---

## Phase 6 — Build

- One composition per deliverable in `Root.tsx`. Variants (vertical cut,
  alternate script, reordered scenes) are **React contexts in the same film
  file** (`VCtx`, `AltCtx`…), so every earlier version stays reproducible and
  a fix flows to all cuts.
- `kit.tsx` gives `fr()`, `cl()` clamped interpolate, `Words` (word-by-word or
  `whole` line-by-line, `lineLands` per line, `snap` for a key word, `tint`
  for colour, `scaleOf` for a beat pulse), `Eyebrow`, `doorClip` (scene opens
  from a line), `Tap`, `Grain`, `card`, `ui`.
- One hero object carries the film between scenes (e.g. the reference's
  product card → the client's phone): scenes open from it, it moves, it swipes to change sides.
- `<Freeze frame={map(f)}>` around later scenes is the clean way to retime
  part of a film (insert holds, shift a section) without touching its code.
- Gotchas: z-index on children needs `zIndex: 0` on the parent; an outgoing
  line needs ~16 frames to clear before the next arrives; `interpolate`
  ranges must be strictly increasing (guard when a variant moves a stop).

---

## Phase 7 — Check every render by looking at frames

```
npx remotion render <Comp> out.mp4 --scale=0.2 --concurrency=8 --crf=18 --log=error --muted   # ~10 s
$FF -i out.mp4 -pix_fmt rgb24 -c:v rawvideo -f image2pipe prev.rgb
node scripts/sheet.js prev.rgb o0.png 0 15 24 6          # overview
node scripts/sheet.js prev.rgb t1.png <frame> 2 24 6     # each transition / changed stretch
```
- Read every sheet; fix overlaps, clipped text, blank frames, things too small
  (nothing in UI under ~26 px at 1080p). Use `npx remotion still` at half size
  for detail.
- After a change, prove nothing else moved: `node scripts/holds.js old.raw new.raw`
  (≈0.01 mean = identical). `holds.js one.raw` lists still stretches — where
  time can be added or removed safely.
- Final: `npx remotion render <Comp> "<out>" --concurrency=8 --crf=17 --log=error`,
  then `ffprobe` frames/duration and `lufs.js` on the decoded audio.

---

## Phase 8 — Deliver and iterate

- Each feedback round = **new version file** (`_v2`, `_v3`…) unless the user
  says "same version". Back up the source as `Film_v<N>.tsx.txt` each time.
- Report tersely: path, what changed, anything that is my call, anything not
  checked (always: "not listened to").
- Keep a project notes file (or memory) updated with versions, rejected ideas
  and why, so the next session does not repeat a rejected idea.

### Lessons from client feedback (start here next time)
- **No slow zoom/push on text or the hero object** — "twitch and glitch",
  even though the reference does it.
- Text motion **calm**: rise ~0.3 em, no overshoot, light blur, nothing flying
  in from the sides. Animate **by line**, not by word, except a title moment.
- Copy must arrive **fast** after its graphic (logo alone on screen felt long);
  stretches where graphics take over with **no copy**, then copy returns, read
  as dynamic.
- Key words highlighted by **colour of the text**, not a shape behind it.
- Footage sits **in a rounded frame on brand colour**, not full-bleed;
  transitions between clips use brand colours/shapes only.
- Don't morph one object into a different one (square → phone was rejected).
- Literal over clever for concept beats (a simple step A —— step B diagram
  beat a clever word morph).
- When retiming, **spread** the time across scenes; the end card must not linger.

---

## Phase 9 — Wrap-up (always)

When the video is delivered or the user says they are stopping work on it,
ask: **"Do you want me to update the reference-to-motion skill with what we
learned on this project?"** If yes, add new rejections/preferences to the list
above, new gotchas to Phase 6/7, and any new reusable script to `scripts/`.
