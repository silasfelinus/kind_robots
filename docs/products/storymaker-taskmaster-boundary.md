# Storymaker and Taskmaster product boundary

This boundary is intentional and permanent.

## Storymaker

**Storymaker creates stories.**

Storymaker is the deluxe creative storytelling studio. It owns imaginative setup, story bibles, narrators, casts, worlds, branching choices, persistent narrative state, inventory and rewards, save/resume, and automatically directed illustrations.

Storymaker must not inherit HONEYDO completion, project-task write-back, needs-human decisions, or practical task checkpoint behavior.

## Taskmaster

**Taskmaster uses stories to finish tasks.**

Taskmaster owns real task intake, project and HONEYDO selection, practical checkpoints, narrative framing, blocked/deferred outcomes, explicit progress review, and confirmed write-back.

Taskmaster may reuse narrative presentation primitives, Facet selectors, entity cards, transcript components, and art infrastructure, but its store and state machine remain separate from Storymaker.

## Serendipity name

The former task-story product is renamed completely to Taskmaster.

- `/taskmaster` is the sole product route.
- `/serendipity` must not remain as a redirect, alias, compatibility page, deprecated wrapper, content slug, store alias, or dashboard key.
- Obsolete Serendipity task-story files are deleted after their Taskmaster replacements are wired.
- Serendipity Voice is a separate product and keeps its existing name and route.

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
