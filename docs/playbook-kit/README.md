# Playbook Kit

The shared frame for Kind Robots story games ("playbooks"): Emperor of Dust,
Zuzu: Shifting Lands, Shifting Desks, Prom of Doom (Capes & Tassels series), This
Means Warp, Ecotone, and every playbook after them. Conductor coordinates it
as the `playbook-kit` project.

A game keeps its own engine, rules and voice. The kit owns everything a player
expects to find in the same place in every playbook, and it owns the
complexity budget that keeps a new playbook from sprawling before it is fun.

## What every playbook gets

| Surface          | Where                                                   | What it does                                                                                                                                                                                                                               |
| ---------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| One-screen shell | `components/playbook-kit/playbook-kit-shell.vue`        | Header with key art, title and the meter strip; the game's stage in the default slot; six panes that dock beside the stage on wide containers and cover it on phones. One bounded scroll per pane, never a scrolling page.                 |
| Settings         | `playbook-kit-settings.vue`                             | Text size, reading font, contrast, motion, text speed, sound, trailer and romance content. Generalized from Emperor of Dust's reading preferences. Games read `usePlaybookKitStore().settings`; they never build a second settings screen. |
| Title trailer    | `playbook-kit-trailer.vue`                              | Letterboxed, auto-advancing beats built from scrapbook moments, then a title card with Begin. Plays on first visit by default; replay from the title or Settings.                                                                          |
| Scrapbook        | `playbook-kit-scrapbook.vue`, `playbook-kit-moment.vue` | Every cinematic moment the player has lived, filterable by kind, opening full screen with its caption. Locked moments keep their image-shaped slot.                                                                                        |
| Cast             | `playbook-kit-cast.vue`                                 | Followers, villains (the principal one marked Nemesis) and other figures, with faction and optional romance marks.                                                                                                                         |
| Factions         | `playbook-kit-factions.vue`                             | Emblems, taglines, members, and the standing meter when one tracks the faction.                                                                                                                                                            |
| Secrets          | `playbook-kit-secrets.vue`                              | Reveals by act: a spoiler-free teaser until discovered, then the truth and who it changes.                                                                                                                                                 |
| Endings          | `playbook-kit-endings.vue`                              | Every ending by tone; locked ones show a hint, never the recipe.                                                                                                                                                                           |

Saved per game in one localStorage record (`kr-playbook-kit-<id>-v1`, owned by
`stores/playbookKitStore.ts`). An unreadable record is held, never overwritten.

## The spec

Each playbook declares one `PlaybookKitSpec` (`utils/playbookKit/types.ts`) in
`utils/playbookKit/games/<camelId>.ts`, registered in
`utils/playbookKit/games/index.ts`. `lanternFerry.ts` is the complete reference.

A game reports what happened through the store:

```ts
const kit = usePlaybookKitStore()
kit.unlock('moments', 'cast-off') // a scrapbook moment was lived
kit.unlock('reveals', 'cracked-keystone') // a secret was uncovered
kit.unlock('endings', 'every-lamp-lit') // an ending was reached
```

and passes live meter values to the shell: `<PlaybookKitShell :spec :meter-values>`.
Narrative text uses the `pk-prose` class so text size and font apply to it.

## The complexity budget

Every spec declares a tier. Start at **Vignette**; earn the next one.

| Dimension                                             | Vignette (one sitting) | Standard (an evening) | Saga (a campaign) |
| ----------------------------------------------------- | ---------------------- | --------------------- | ----------------- |
| Acts                                                  | 1–2                    | 2–3                   | 3–5               |
| Meters on screen                                      | 1–3                    | 2–5                   | 3–7               |
| Factions                                              | 0–2                    | 2–4                   | 3–6               |
| Followers                                             | 1–3                    | 3–8                   | 6–16              |
| Villains                                              | 1                      | 1–3                   | 2–8               |
| Other figures                                         | 0–3                    | 0–8                   | 0–16              |
| Romances                                              | 0–1                    | 0–3                   | 0–6               |
| Reveals                                               | 1–3                    | 3–8                   | 6–16              |
| Endings                                               | 3–5                    | 5–12                  | 8–32              |
| Scrapbook moments                                     | 6–12                   | 12–30                 | 24–80             |
| Trailer beats                                         | 3–5                    | 4–6                   | 5–8               |
| **Attention load** (meters)                           | ≤3                     | ≤5                    | ≤7                |
| **Parallel threads** (villains + romances + factions) | ≤4                     | ≤9                    | ≤16               |

Rules (`utils/playbookKit/budget.ts`, enforced by `npm run test:playbook-kit`):

- **Over a cap fails CI.** Cut, merge, or move up a tier. A dimension may run
  past its cap only with a written `allowances` entry whose reason says why
  the extra complexity earns its place; the console shows it as _stretched_.
- **Under a minimum is never an error.** It is the next rung to build, so a
  freshly scaffolded playbook is green.
- **Everything declared must be felt.** Exactly one principal villain, who
  needs a reveal and an ending of their own. Every faction and follower shows
  up in a reveal, ending or moment. Romance is optional, carried by `romance`
  moments the romance setting can hide. Endings span more than one tone.
- **Trailers sell, never spoil.** Trailer beats reuse scrapbook art and may not
  show ending, reveal or romance moments.
- **Every picture has a brief**, so an ArtJob can be queued for it before it
  is rendered.

Calibration, October 2026: Prom of Doom's first slice (6 students, 4 endings)
fits Standard. Space Couch's slice already carries 12 crew, past
Standard's 8 followers, and its full production floor (16 crew, 8 alien
antagonists, 16 endings) is Saga. Emperor of Dust's 25 followers and 15
factions would need written allowances even at Saga. That is the point: the
budget makes that cost visible before it is built, not after.

## The ladder

Build in this order. `/admin/playbook-kit` shows which rung is next.

1. Premise and key art: title, tagline, the dramatic question, a key-art brief.
2. Cast: at least one follower and exactly one principal villain.
3. Endings, across more than one tone.
4. Scrapbook moments.
5. Trailer.
6. Factions (optional at Vignette).
7. Reveals.
8. Romance (always optional).
9. Rendered art: every brief rendered, delivered and its URL verified.

## Starting a new playbook

```bash
cd /path/to/kind_robots
git pull
npm run playbook:new -- moon-laundry "Moon Laundry" --tier vignette
npm run format:changed
npm run test:playbook-kit
```

This writes the spec, registers it, and adds the admin development preview
(`pages/admin/<slug>.vue` and its `content/channels/admin/<slug>.md` tab). On
the Conductor side, `python scripts/new_playbook.py <slug> "<Title>"` creates
the project, its design brief and the standard roadmap ladder. Then build the
game's own stage inside the shell's default slot, rung by rung, and queue art
from the briefs.

## Adopting the kit in an existing playbook

Adoption is incremental and per game (Conductor `playbook-kit` tasks): declare
a spec that describes what the game already has, mount the shell around the
existing stage, then retire the game's own settings, endings gallery and
journal in favour of the kit's panes. Keep the game's save keys; the kit's
record is separate.
