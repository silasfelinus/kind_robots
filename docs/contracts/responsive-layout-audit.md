# Responsive layout audit

`utils/scripts/auditResponsiveLayout.mjs` — run with `npm run audit:responsive`.

## Why it exists

`verifyLayoutContract.ts` reads source with regexes. It catches structural
mistakes — two scroll owners in one surface, a page rendering its own `<h1>` —
and it cannot see anything that only exists after a browser has done layout.

Every mobile defect found in the 2026-08-03 review was of the second kind:

- The workspace page-title strip rendered as an **18px image sliver** on a
  390px phone. Silas: _"I don't even know what should be to the right of our
  channel/tab selector."_ Nothing in the source is wrong to look at — the
  section is a perfectly ordinary `flex-1 min-w-0`. It is only wrong once the
  four `shrink-0` siblings around it total more than the viewport.
- The karma widget rendered as a clipped `395…` past the right edge.
- The Dreams toolbar wrapped to four rows, against `.kr-toolbar`'s own
  one-row contract.

Each of those was at some point "verified" by reasoning about flex rules
instead of measuring them, and each reached Silas's phone anyway. **Reasoning
about `flex-basis` is not a substitute for reading `offsetWidth`.**

## What it checks

At 390px (phone), 820px (tablet) and 1440px (desktop), for each route:

| Check             | Meaning                                                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `SPILL`           | An element's box extends past the viewport's right edge. The clipped `395…`.                                                  |
| `CRUSHED`         | A _flexible_ element squeezed below `--min-flex` (default 32px) while still holding text or a control. The 18px title sliver. |
| horizontal scroll | `documentElement.scrollWidth` exceeds the viewport.                                                                           |

`CRUSHED` is deliberately separate from `SPILL`. A sliver does not overflow
anything and no overflow check will ever find it — it is _worse_ than a hidden
element, because it looks like a rendering fault and tells the user nothing.

## Running it

It drives the real app, so it needs a dev server:

```bash
JWT_SECRET=dev npx nuxt dev --port 3000     # one shell
npm run audit:responsive                    # another
```

Useful flags:

```bash
npm run audit:responsive -- --routes /dreams,/bots
npm run audit:responsive -- --shots ./out          # write screenshots
npm run audit:responsive -- --base http://127.0.0.1:3000
npm run audit:responsive -- --min-flex 40
```

`CHROMIUM_PATH` overrides the browser binary when Playwright's own download is
skipped (as in the agent sandbox, where browsers live under
`PLAYWRIGHT_BROWSERS_PATH`).

Exit code is `1` when any route/viewport has a defect. **That exit code is the
point** — verify it end to end if you change the script, and beware of piping
the command anywhere, which replaces the script's status with the last pipeline
stage's. See interface-vision `t-063`: a CI step piped through `tee` could never
fail, and the verifier behind it was dead for weeks without anyone noticing.

## In CI

`.github/workflows/responsive-layout-audit.yml` audits a **deployed** app rather
than standing up a server in the job. Two reasons:

1. A gallery with no rows renders an empty state whose geometry says nothing
   about the gallery. Vercel has already built a deployment backed by the real
   database, so auditing it measures real content.
2. cypress.yml already proves the wait-for-deploy shape works here.

It runs hourly against production, and — if Vercel's GitHub integration emits
the event on this repo — on each successful `deployment_status`, which would
audit a PR's own preview before the change reaches `main`. **No other workflow
here uses `deployment_status`, so that half is unverified.** It is additive: the
schedule covers everything regardless. If the Actions tab shows no
`deployment_status`-triggered runs after a few PRs, delete that trigger rather
than leave a line that reads like a gate and isn't.

The job refuses to measure a deployment whose database is unhealthy, and fails
loudly on a `401`/`403` protected preview — both would otherwise "pass"
trivially against an error page or a login wall, which is worse than not running.

## Running it against something other than a dev server

`--base` takes any URL, so the same command audits production or a preview:

```bash
npm run audit:responsive -- --base https://kind-robots.vercel.app
```

That is exactly what CI does. Locally, an unseeded database means you are
measuring empty and error states — those still have to survive 390px, but they
are not the galleries this is for, so do not read a local pass as an all-clear.

## What BROKEN-ART is actually for

Not "find missing art". Missing art is **expected and self-healing** here: there
is a large generation backlog and an auto-generator that fills gaps (Silas,
2026-08-04: _"we have a massive backlog of images generating, and an auto image
generator if the image is missing, don't worry about it"_).

So a component that degrades properly renders a placeholder when its art is
absent, and trips nothing. **A `BROKEN-ART` hit therefore means "this component
does not handle missing art"** — a code defect, not a content one. That is why
it is worth failing a build over even while thousands of images are still being
generated, and it is why the fix for `t-069` was a placeholder rather than a
scramble to find the missing files.

Do not "fix" a `BROKEN-ART` hit by generating the image. Fix the component, then
let the generator do its job.

## Adding a route

Pass `--routes`. The default list covers the object galleries and the
dashboard. When a new page lands, add it there in the same change that adds its
`NAV_COMMANDS` entry.
