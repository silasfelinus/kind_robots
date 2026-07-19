# WonderLab personality review rollout

This runbook covers the first production rollout of first-party Bot/Character commentary for Component WonderLab.

## Non-negotiable guardrails

- Human and community Reactions are never deleted, rewritten, or converted.
- Bot/Character identity can only be assigned by the controlled publication service.
- Generation creates `PROPOSED` or `FAILED` ReviewDraft rows only.
- Approval and publication are separate administrator actions.
- Build, deploy, startup, page load, filtering, and plan previews never generate or publish.
- A Component/reviewer pair reconciles to one authored Reaction.

## 1. Production deployment and migration

Deploy current `main` through the production Vercel target.

The migration wrapper handles one known historical failure only:

`20260719031500_reaction_first_party_author_expand`

If that exact migration is unfinished, the wrapper verifies and completes its expand-only columns, indexes, and foreign keys, refuses unsafe data, uses Prisma's supported `migrate resolve --applied`, and then runs ordinary `prisma migrate deploy`.

Expected applied migrations:

- `20260719031500_reaction_first_party_author_expand`
- `20260719033500_review_draft_storage_expand`

Do not manually edit `_prisma_migrations`.

## 2. Run the rollout audit

Open:

`/admin/wonderlab-review-rollout`

The audit must report **Ready** before generating production drafts. In particular:

- both migrations are applied with no unfinished record;
- `ReviewDraft` exists;
- both Reaction author columns exist;
- duplicate authored Component/reviewer groups are zero;
- dual-author and orphan author rows are zero;
- published draft/Reaction mismatches are zero.

The audit is read-only.

## 3. Preview reviewer coverage

Open:

`/admin/wonderlab-review-plan`

Start with a small batch:

- 5–10 Components;
- 1–2 reviewers per Component;
- `regenerate` off;
- run **Preview plan** or **Verify dry run** first.

Review the affinity scores and reasons. A second reviewer is selected with Bot/Character diversity when a competitive voice-ready option exists.

Dry run defaults to true and makes no model calls or writes.

## 4. Generate proposed drafts

On the coverage-plan page, explicitly check **Enable model calls for this batch**, then generate.

Batch limits:

- at most 10 Components;
- at most 20 reviewer slots;
- sequential model calls;
- published slots skipped;
- per-slot errors retained in the result instead of aborting the batch.

Generated output is validated for:

- structured JSON;
- 20–160 words;
- integer rating from 1–5;
- confidence from 0–1;
- at least one grounded observation;
- canonical reviewer voice readiness.

Low-confidence output is saved as `FAILED`, not discarded and not published.

## 5. Curate and approve

Open:

`/admin/wonderlab-reviews`

For each draft:

1. Compare generated copy with the reviewer voice and prompt provenance.
2. Edit the comment, rating, or reaction type as needed.
3. Save.
4. Approve only when the copy is useful, grounded, and clearly belongs to that reviewer.

Editing an already approved draft without an explicit status transition returns it to `PROPOSED`.

Representative acceptance cases should include:

- Dotti on a Bot/builder/prompt Component;
- Catbot on a broadly accessible museum Component;
- two reviewers evaluating the same exhibit with visibly distinct voices.

## 6. Publish explicitly

Only an `APPROVED` draft can be published.

Publication:

- uses the authenticated administrator as `Reaction.userId` for accountability;
- stores the Bot or Character in the separate first-party author identity;
- locks the draft and Component transactionally;
- updates an existing authored Reaction for the same Component/reviewer;
- inserts only when no authored Reaction exists;
- marks the draft `PUBLISHED` and links its Reaction;
- supersedes stale unpublished attempts for that Component/reviewer;
- never selects a human Reaction for overwrite.

After publishing a representative set, rerun `/admin/wonderlab-review-rollout`.

## 7. Public verification

Verify on production:

- `/wonderlab`
- `/memory`
- `/screenfx`

In WonderLab, confirm:

- human reviews still display with their user identity;
- first-party reviews display the Bot/Character name, avatar, role, and first-party label;
- rating/review counts include the new normal Reactions;
- no duplicate first-party comments appear after repeated publication;
- desktop and mobile exhibit layouts remain usable;
- browser back/forward and URL filters still restore state.

## 8. Rollback and incident handling

If generation quality is poor, stop generating. Existing drafts can remain `PROPOSED`, `FAILED`, or `REJECTED`; none are public.

If a published first-party review is incorrect:

- edit or regenerate a draft;
- approve it;
- republish to reconcile the same authored Reaction.

Do not delete human reviews. Do not resolve an unexpected migration failure automatically. The deploy repair is intentionally allowlisted to one known migration and aborts on any unexpected schema or data state.
