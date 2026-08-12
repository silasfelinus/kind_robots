# Live object-comment backfill execution

Temporary execution notes for kind_robots#1769.

- Production corpus: public active reviewable Rewards plus content-bearing public active reviewable Facets; Resources remain deferred.
- The Vercel preview is read-only and branch-locked. It supplies current targets/casts and may draft candidates, but cannot publish to production.
- OpenAI drafting was attempted first and failed closed on API billing before any database write.
- Anthropic drafting uses the same object-first prompt builder and archive freshness checks; GPT-5.6 Sol remains the release editor.
- Production publication is a one-shot GitHub Actions job over Tailscale with the repository production DATABASE_URL secret.
- The production payload carries exact Bot/Character author identities so no stateful novelty recast can silently reassign prose.
- The Actions publisher validates the complete target set, active authors, exchange shapes, archive/canonical freshness, cross-corpus freshness, and existing target state before inserting.
- Each target exchange is inserted with one createMany statement so a duet or trio cannot be half-published.
- Temporary preview route, workflow, payload, and execution helpers are removed after the backfill is verified.
