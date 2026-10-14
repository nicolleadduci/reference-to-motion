# Reference to Motion

A [Claude Code](https://claude.com/claude-code) skill for motion designers: hand
Claude a **reference video**, a **script** and a **brand**, and it reverse-engineers
the reference frame by frame, writes a style guide and a shot list, cuts the film to
the **beat of your music**, and builds it in [Remotion](https://www.remotion.dev).

It works for any client and any reference: launch films, teasers, brand stories,
homepage videos, social cutdowns.

> "Here's a reference we love. Make our launch film in this style, in our brand, on the beat of this track."

---

## What it does

| Phase | What happens | You get |
|---|---|---|
| 0. Intake | Claude asks, in one message, for everything missing (list below) | No back-and-forth mid-build |
| 1. Setup | Uses your existing Remotion project or starts one from the templates | |
| 2. Reference breakdown | Detects every cut and motion, makes numbered contact sheets, reads each transition frame by frame, samples colours and grain from full-res frames, identifies the typeface by measurement, times how text enters and exits | `docs/style_guide.md`, ending in a reference → your-brand translation table |
| 3. Brand intake | Pulls colours, fonts and type rules from the brand's site CSS or guide, downloads logos and imagery | `assets/` |
| 4. Music (optional) | Finds tempo, downbeat and song structure; shortens/lengthens the track on the bar line where bars match harmonically; masters the bed to −14 LUFS | `mix.wav` and a beat grid in frames |
| 5. Shot list | Every shot on a bar and beat, with frame numbers, motion, exact copy, copy check, guardrail check and open items. **Stops here for your review** | `docs/shotlist.md` |
| 6. Build | Remotion film where every time is `fr(bar, beat)`; variants (vertical cut, alternate script) in the same file | Compositions |
| 7. Check | Low-res renders read as numbered contact sheets after every change; diffs prove a fix touched nothing else | |
| 8. Deliver | A new version file per feedback round, short change notes, an honest list of what was not checked | `YYYY-MM-DD_Client-Project_vN.mp4` |
| 9. Wrap-up | Offers to add the project's lessons to the skill | A skill that improves with use |

The skill also carries a list of things clients pushed back on in production (slow
pushes on text, over-animated type, shapes behind highlighted words, full-bleed
footage, lingering end cards…) so a new project starts from the lessons, not from zero.

## What you provide

**Must have**
1. The reference video as a **file** (mp4/mov). Streaming links can't be analysed.
2. The script: scenes, timings, exact on-screen copy, VO or music-only.
3. The brand: website and/or brand guide, logo as **SVG**, fonts, colour hex values.
4. Format: length, aspect ratios (16:9, 9:16, 1:1), fps.
5. Output folder and file naming.

**Should have**
6. The music track, if the cut should sit on the beat.
7. Footage, photos, product screens (stock, AI-generated, or site imagery).
8. Guardrails: copy rules, logo rules, anything that must never happen.
9. Open items: unapproved stats, legal lines, third-party marks. These become flagged placeholders, never invented.

## Requirements

- [Claude Code](https://claude.com/claude-code)
- Node.js 18+
- A Remotion project (or let Claude create one: `npx create-video@latest`)
- ffmpeg — either installed (`brew install ffmpeg`) or the one Remotion already bundles; `scripts/ffmpeg-env.sh` finds whichever you have
- Google Chrome (only for the typeface-matching step)

All analysis scripts are plain Node with no dependencies.

## Install

**As a plugin (recommended):** in Claude Code run

```
/plugin marketplace add nicolleadduci/reference-to-motion
/plugin install reference-to-motion@reference-to-motion
```

**As a personal skill:** copy the skill folder into your skills directory

```bash
git clone https://github.com/nicolleadduci/reference-to-motion.git
cp -R reference-to-motion/skills/reference-to-motion ~/.claude/skills/
```

**For one project only:** copy it into `<project>/.claude/skills/` instead.

Restart Claude Code. The skill loads on its own when you describe a matching task,
or call it directly with `/reference-to-motion`.

## Use it

```
/reference-to-motion
Reference: ./reference/brand-film.mp4
Script: ./brief/script.docx (music only, no VO)
Brand: https://example.com, logo SVGs in ./brand/
Music: ./audio/track.mp3 — cut to the beat
Deliver: 60s, 1920x1080 and 1080x1920, into ./deliverables/
```

Claude returns the style guide and shot list first. Review them, then say "build it".
Give feedback in plain language with timestamps ("at 0:12 the copy comes in too late");
each round is saved as a new version.

## What's inside

```
skills/reference-to-motion/
├── SKILL.md                 the workflow Claude follows
├── scripts/
│   ├── ffmpeg-env.sh        find ffmpeg (system or Remotion-bundled)
│   ├── cuts.js              hard cuts, motion runs, holds, activity map of a reference
│   ├── sheet.js             numbered contact sheets from raw frames
│   ├── crop.js              native-resolution crops for reading type and UI
│   ├── colors.js            grounds, accents and grain from full-res frames
│   ├── font-match.html      identify the typeface by measured ratios (headless Chrome)
│   ├── music.js             tempo candidates, downbeat, per-bar energy
│   ├── fold.js              where kick/snare sit in the bar; harmonically matching bars for splices
│   ├── mix.js               build the music bed on the bar grid, −14 LUFS, equal-power joins
│   ├── lufs.js              BS.1770 loudness meter
│   ├── holds.js             still stretches in a render; diff two renders
│   └── png.js               tiny PNG writer used by the above
└── templates/
    ├── kit.tsx              Remotion kit: beat grid fr(bar, beat), Words (word/line text motion), Eyebrow, door wipe, tap, grain, cards
    ├── brand.ts             brand tokens the kit reads (fill from the brand source)
    ├── style_guide.md       reference breakdown template
    └── shotlist.md          beat-synced shot list template
```

The scripts also work by hand, e.g.:

```bash
source skills/reference-to-motion/scripts/ffmpeg-env.sh
$FF -i ref.mp4 -an -vf scale=96:54 -pix_fmt rgb24 -c:v rawvideo -f image2pipe small.rgb
node skills/reference-to-motion/scripts/cuts.js small.rgb 96 54 30

$FF -i track.mp3 -ac 2 -ar 48000 -c:a pcm_s16le music.wav
node skills/reference-to-motion/scripts/music.js music.wav
```

## Limits

- Claude reads the film as frames; it **does not listen**. Audition every music edit yourself.
- Tempo detection can lock onto a related tempo (e.g. 124 instead of 93). The skill checks this by folding the drums onto the bar, but confirm by ear.
- The reference is analysed for *style*. Don't use the skill to copy someone else's film shot for shot or to reuse their assets. Make sure you have the rights to all footage, music and fonts in the final film.
- Font matching ranks fonts you name as candidates; it can't identify a font you don't suggest.

## Contributing

Issues and pull requests are welcome, especially new lessons from client feedback
and fixes for other platforms. Keep examples free of client names and confidential material.

## License

[MIT](LICENSE)
