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

Exit code is `1` when any route/viewport has a defect, so it can gate a PR once
there is a CI job able to stand up a server. **That exit code is the point** —
verify it end to end if you change the script, and beware of piping the command
anywhere, which replaces the script's status with the last pipeline stage's.
See interface-vision `t-063`: a CI step piped through `tee` could never fail,
and the verifier behind it was dead for weeks without anyone noticing.

## Data is not required

The audit measures geometry, not content. It runs fine with the database
unreachable — pages render their chrome, their error state, and their empty
state, all of which have to survive a 390px viewport too. Do not skip the audit
because there is no seeded data.

## Adding a route

Pass `--routes`. The default list covers the object galleries and the
dashboard. When a new page lands, add it there in the same change that adds its
`NAV_COMMANDS` entry.
