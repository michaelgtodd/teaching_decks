# Authoring a deck

You write one file, `decks/NN-name/deck.mjs`. The builder turns it into slide files and rejects anything
that won't fit. Read `decks/00-template-gallery/deck.mjs`: it uses every layout once and is the best example.

```js
import * as L from '../../template/layouts.mjs';
export default {
  no: 3, short: 'AdvantageScope', title: 'AdvantageScope: see what your robot thinks',
  minutes: 30, description: 'One sentence for the outline.',
  slides: [ L.cover({...}), L.cards({...}), ... ],
};
```

Build with `node template/build.mjs 03-advantagescope` from the repo root until it prints `ok` with no `!` warnings.
Errors name the slide and the fix. Cut words or split the slide: never hack around a limit.

## Audience and voice

Young FRC students, many in their first season, ages roughly 12 to 16. Mentors are in the room.
- Plain words and short sentences. Define every term the first time. Analogies from things they know (driving a car, a thermostat, a shower's hot tap).
- Talk to "you". Never condescend, and never joke at the expense of a mistake.
- Decks are purely informative, on slides and in notes. State the fact, the step or the reason, and nothing else.
- No praise, reassurance, pep talk or motivation: no "well done", "don't worry", "that's normal", "everyone hits this", "you can now" or "you need no math past...".
- No framing about how to feel or how much it matters: no "heads-up, not homework", "a pointer, not a lesson", "if you remember one thing", "the honest part" or "the sneaky part".
- No welcomes, group chants, rhetorical questions, or jokey labels such as "break it on purpose".
- Slide text is short; the explanation goes in speaker notes. **One idea per slide.**
- Speaker notes on every slide: what to say, in the mentor's voice, up to 120 words. Add the timing cue and any "if a kid asks X" where useful.
- Titles describe the topic, in the same grammar across the deck. No drama ("It's not X, it's Y"). No hype words.
- Prose punctuation is converted to curly quotes for you. Avoid em dashes in slide text.

## Accuracy rules (these matter most)

- **Never invent** a statistic, a quote, a UI label, a menu path, a feature, a price or a default value. If you can't confirm it from a primary source, leave it out or flag it in your report.
- Check primary sources: WPILib docs and source at tag `v2026.2.1`, docs.advantagescope.org, docs.revrobotics.com, v6.docs.ctr-electronics.com, vendor Javadoc.
  - Source: `gh api -H 'Accept: application/vnd.github.raw' 'repos/wpilibsuite/allwpilib/contents/<path>?ref=v2026.2.1'`
  - REV: `repos/REVrobotics/REVLib-Examples` and `repos/REVrobotics/2026-REV-ION-FRC-StarterBot`. CTRE: `repos/CrossTheRoadElec/Phoenix6-Examples`.
  - WebSearch and WebFetch are deferred tools: load them with ToolSearch first.
- PLAN.md lists verified facts. Don't contradict them; if you find one wrong, flag it in your report.
- Physics and curves must be computed, not drawn by hand. Simulate in JS in the deck file and plot the result. Say in the notes what was simulated.
- Write `decks/NN-name/SOURCES.md`: each non-obvious claim with its URL, and anything you could not confirm.

## Hard limits on your tools

- Compile with `cd examples && ./gradlew compileJava` (needs JDK 17). Run the code in simulation when a slide states a number or a behavior: several real problems in these decks only appeared that way.
- Only write inside your own `decks/NN-name/` and `examples/src/main/java/frc/robot/deckN/`. Never edit `template/`, `PLAN.md`, or another deck. If a layout blocks you, work around it and say so in your report.
- Do not commit, push, or publish. The lead does that.

## Code on slides

Put real code in `examples/src/main/java/frc/robot/deckN/` (`package frc.robot.deckN;`), with markers:

```java
  // #region factory
  public Command driveArcade(DoubleSupplier forward, DoubleSupplier rotation) { ... }
  // #endregion
```

Then show it with `src: { file: 'examples/src/main/java/frc/robot/deckN/Foo.java', region: 'factory' }`.
Each file must be complete and importable, as if about to compile: real imports, real package, no pseudo-code.
Use inline `code:` strings only for deliberately wrong snippets, one-liners, or non-Java text (`lang: 'json' | 'shell' | 'text'`).

`frc/robot/deck2/` is the shared baseline drivetrain. To extend it, copy into your package and change what you need.

Keep code readable at projector size. Limits are enforced: full-width `code` is 92 chars and 15 lines (13 with a caption); `codeNotes` is 61 chars and 16 lines; `compare` is 12 lines at about 44 chars. Show the 10 lines that matter, not the whole file.

## Layouts

All take `id` (unique; letters, digits, `-`, `_`), `notes`, and optional `flag2027` (footer note, 72 chars, only when the specific thing on this slide changes for 2027).
Content layouts need `eyebrow` (short topic label, 60 chars) and `title` (54 chars, one line). Text fields accept `**bold**`, `` `code` ``, `[text](https://url)`.

| Layout | Use for | Required | Limits |
|---|---|---|---|
| `cover` | First slide | `title`, `subtitle`, `minutes` | title 44 chars |
| `sectionSlide` | Opening a part | `id`, `title`, `section` (one sentence), optional `no`, `sub` | title 40 chars |
| `statement` | The sentence to remember, max 2 per deck | `id`, `text`, optional `sub`, `tone: accent, ink, blue` | 4 lines |
| `lead` | One idea in a sentence or two | `text`, optional `points[]` | |
| `points` | Truly parallel short items | `items[]` | 2 to 6 |
| `cards` | Concepts side by side | `items[{icon?, title, text}]`, optional `intro` | 2 to 6; about 20 words each |
| `steps` | Ordered procedure | `items[{title, text?}]`, optional `qr{url, label, short?}` | 2 to 6 |
| `code` | Code alone | `src` or `code`, `file?`, `highlight[]` (1-based lines), `caption?` | see above |
| `codeNotes` | Code with numbered notes | `src` or `code`, `file?`, `callouts[{line, title, text}]` | 1 to 4 callouts; `line` is 1-based within the shown code and may be an array |
| `compare` | Two sides | `left`, `right`: each `{label, tone?: good, bad, neutral, items[] or code}` | Use `tone` plus a clear label |
| `table` | Comparisons | `columns[]`, `rows[][]`, `widths[]` sum 100, `caption?`, `fontSize?` | 2 to 6 columns; plain text in cells |
| `gotcha` | Common mistake | `title`, `symptom`, `cause`, `fix`, optional 4-line `code` | At least one per deck |
| `practice` | Best practice | `title`, `rule`, `why`, optional 7-line `code` | At least one per deck |
| `exercise` | Hands-on task | `title`, `minutes`, `tasks[]`, `done` | 1 to 5 tasks; `done` must be observable |
| `demo` | Presenter drives a tool | `title`, `show[]` | 2 to 5 |
| `plot` | Time-series chart | `xLabel, yLabel, xDomain, yDomain, xTicks, yTicks, series[{name, color, dash?, points, tag?{x,y,dx,dy,w,align}}]`, optional `refs[{y,label}]`, `callouts[{title,text}]` | 1 to 3 series. Colours `orange, blue, green`, in that order. |
| `diagram` | Blocks and arrows | `nodes[{id,x,y,w,h,label,sub?,tone?,size?,round?}]`, `edges[{from,to,fromSide?,toSide?,route?,label?,lx?,ly?,lw?,dashed?}]`, `caption?` | Slide px: x 128 to 1792, y 232 to 916 (840 with caption). Tones `ink, paper, accent, blue, ghost`. Sides `l,r,t,b`. Routes `straight, hv, vh, elbow`. 24 parts max. |
| `embed` | Self-running animation | `html` (whole small page), `height?` | 16 KB, system fonts, text 24px+. Nobody can click it, and exports flatten it. |
| `change2027` | The "what's changing" slide | `items[{now, next}]`, `note?` | 2 to 6 |
| `recap` | Closing | `items[]`, `next?`, `title?` | 2 to 5 |
| `links` | QR codes to docs | `items[{label, url, short?}]`, `intro?`, `title?` | 1 to 4 |
| `raw` | Last resort | `eyebrow`, `title`, `body` | Must follow the slide subset. Avoid. |

Icons: Activity Book Chart Chat Check CheckCircle Clock Cloud Code Database Globe GraduationCap Home Key Lightbulb Lightning Link Lock PaperPlane Play Search Settings Star ThumbsUp Tool Trust Users Verified Warning Wrench.

**No screenshots or images.** We have none we can verify. For a tool's UI, use a `demo` slide and let the mentor drive the real thing, or a clearly schematic `diagram` built only from confirmed labels. Say "schematic" in the caption.

**Vary layouts.** Don't stack `points` slides. A real diagram or table beats a list. Aim for no more than 3 `points` slides in a deck.
