# Shot list — <Brand> <film> (<format>, <length>, <VO / music only>)

Built in the style documented in [`style_guide.md`](style_guide.md).

| | |
|---|---|
| **Format** | <W × H>, <fps> fps, **<frames> frames, <secs> s** |
| **Sound** | <music only / VO + music> |
| **Music** | `<path>` |
| **Copy** | The script's on-screen column, word for word. Nothing else is written in |
| **Cuts** | <none — every change is a move/morph/wipe, or as the reference> |

---

## 1. The music, and how the picture sits on it
Measured: **<BPM>**, beat <s> = **<f> frames**, bar <s> = **<f> frames**, first
downbeat <s>. Where the kick and snare sit. Phrase length.

### Structure and the edit
| Film bars | Film time | Track bars | What the music does | Scene |
|---|---|---|---|---|

**The splice:** <which bars are dropped/kept, harmonic similarity, crossfade>.
Master <LUFS>, <ceiling>.

### Rules for putting motion on the beat
1. Land on the beat, do not start on it. Every frame below is the frame a move *finishes*.
2. Beat 1 of a bar: scene changes and the biggest arrival. Beats 2 and 4: pops.
3. Accented downbeats carry the payoffs: <list>.
4. Frames come from `fr(bar, beat) = round(((bar − 1) × 4 + (beat − 1)) × <beat frames>)`.

Notation: **7.3** = bar 7, beat 3. **2.3½** = the off-beat after beat 3.

## 2. Design constants
| | |
|---|---|
| Grounds | |
| Headline | |
| Eyebrow | |
| UI text | |
| Cards | |
| Hero object | |
| Text enter / exit | |
| Grain | |

## 3. Assets
| Use | File | Note |
|---|---|---|

## 4. Scenes
### Scene 1 — <name>
Bars <a–b> · frames <x–y> · <time> · <ground>

| Shot | Beat | Frame | Picture and motion | On-screen copy |
|---|---|---|---|---|

Full line as read: *<copy>*

## 5. Copy check against the script
| Scene | Script copy | On screen | Match |

## 6. Guardrail check
| Guardrail | How the film meets it |

## 7. Open items
Placeholders, unapproved stats/claims, third-party marks, stand-in names, asset gaps.
