# Storymaker and Taskmaster product boundary

This boundary is intentional and permanent.

## Storymaker

**Storymaker creates stories.**

Storymaker is the deluxe creative storytelling studio. It owns imaginative setup, story bibles, narrators, casts, worlds, branching choices, persistent narrative state, inventory and rewards, save/resume, and automatically directed illustrations.

Storymaker must not inherit HONEYDO completion, project-task write-back, needs-human decisions, or practical task checkpoint behavior.

## Taskmaster

**Taskmaster uses stories to finish tasks.**

Taskmaster owns direct objective entry, project and HONEYDO selection, practical checkpoints, narrative framing, blocked/deferred outcomes, explicit progress review, and confirmed write-back.

Taskmaster may reuse narrative presentation primitives, Facet selectors, entity cards, transcript components, and art infrastructure, but its store and state machine remain separate from Storymaker.

## Permanent implementation invariants

- Taskmaster owns its Pinia store, session types, prompt persona, and `taskmaster-session` persistence key.
- Direct objectives remain visible alongside the fiction.
- Project and HONEYDO answers are proposals until the user explicitly applies them.
- Conductor roadmap YAML is never modified by a Taskmaster story answer.
- Dashboard, tutorial, channel, placement, content, component, and store identities use Taskmaster directly rather than runtime aliases.

## Serendipity name

The former task-story product is renamed completely to Taskmaster, leaving the Serendipity name and route free for the voice-led experience.

- `/taskmaster` is the sole task-story product route.
- `/serendipity` is the sole Serendipity product route and hosts the voice-led experience.
- `/serendipity-voice` must not remain as a route, redirect, alias, compatibility page, content slug, component identity, or dashboard key.
- The separate voice-relay repository and internal integration types may retain `serendipity-voice` only where they specifically name that relay subsystem.
- Obsolete Serendipity task-story files remain deleted after their Taskmaster replacements are wired.

The application is still in alpha. Temporary development paths are not compatibility contracts.

## Automatic art direction

Neither Storymaker nor Taskmaster asks the user to choose an art engine, model, sampler, scheduler, step count, CFG, denoise value, or dimensions.

Product code selects a centralized narrative art profile and derives the prompt from:

- product identity
- genre, setting, mood, theme, style, and art-direction Facets
- active characters and locations
- current narrative milestone
- intended display surface
- cost and mana constraints

The default narrative profile uses the existing Krea 2 art path with four generation steps. The profile is centralized so model and numerical tuning do not leak into product setup UX.

Illustrations are reserved for meaningful moments: opening, chapter or major location changes, important character introductions, pivotal events, and finales. Generation is asynchronous and persisted; rendering a page must never enqueue duplicate art.
