# Arcade code-drawn artwork audit

From a fresh PowerShell window, with both repositories checked out:

```powershell
cd D:\code\kind_robots
git pull
npm run audit:arcade-art -- --ledger D:\code\Conductor\projects\art-prompts.yaml --unrequested
```

The audit follows every dynamic game loader in the Arcade registry, including
WebGL fallback branches, through its relative Arcade imports. It lists source
declarations that construct pixel sprites, paint Canvas shapes or construct
procedural 3D geometry, grouped by cabinet with file, line and symbol. Shared
rendering primitives are excluded. Named HUD/text/control helpers are labeled
as functional UI candidates for inspection, since they may also contain art.
Comments do not count as rendering.

Image literals and template patterns are followed through local declarations
and named imports. Requests match their exact `image_path` or `source_url`;
a cabinet's title illustration cannot cover an unrelated actor. `--json`
provides inspectable source locations, operations, runtime image patterns and
matching request IDs, statuses and durable ArtJob IDs. `--unrequested` selects
sites with no matched runtime-image request. An invalid ledger or missing
registry fails instead of reporting a clean empty audit.

This is a conservative source inventory, not a render trace or delivery test.
Unused declarations can appear; dynamic asset paths the static reader cannot
resolve remain unrequested and require inspection. One declaration can paint
several poses or entities. A mixed renderer still appears when it has a painted
image: the remaining code may be a fallback, lighting or an unreplaced slot.
Inspect each site before adding a request, and search existing requests before
enqueueing. Do not generate a duplicate merely because its existing request is
not yet bound to a runtime image pattern.

Request coverage never means rendered, delivered, visually accepted or bound
successfully. Replace illustrated content through durable ArtJobs and verify
the actual pixels and final URL. Functional meters, focus outlines and hitboxes
remain code.
