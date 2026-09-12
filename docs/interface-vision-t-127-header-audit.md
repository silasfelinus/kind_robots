# Interface Vision t-127: page-title audit

This audit narrows the `one-header` layout-contract change before the verifier is widened. The trigger was `pages/admin/scene-animator.vue`: its duplicate shell title used a `<p class="text-3xl font-black">` inside the page's own top toolbar, so the existing literal-`<h1>` check missed it.

## Known-page audit

### `pages/admin/scene-animator.vue`

**Duplicate shell title, already fixed in #2638.** This is the positive fixture for the widened rule. The removed block was page-level chrome: eyebrow + large `text-3xl font-black` title + description in the page's top toolbar. The shell already supplied the same title/subtitle from `content/channels/admin/scene-animator.md`.

### `pages/users/[id].vue`

**Legitimate in-page title. Do not flag.** `{{ displayName }}` is dynamic entity identity inside the public-profile `<article>`, below a Back to WonderLab navigation control and inside the profile card. The shell cannot supply a user's runtime display name. Its `text-3xl font-black` line is therefore content, not duplicate page chrome.

### `pages/email-confirmation.vue`

**Legitimate in-page result title. Do not flag.** `{{ result.title }}` is dynamic outcome copy inside a centered result `<section>` (`Email verified`, expired-link states, incomplete-link state). It is not a static page title and the shell cannot know the result before evaluating the query parameters.

### `pages/play/challenges/leaderboard.vue`

**Legitimate authored hero. Do not flag.** The page's top hero is a surfaced `<header>` after navigation, but its title uses the `kr-text-eyebrow` display primitive rather than the `text-2xl/text-3xl + font-black` duplicate-shell shape. The `text-3xl font-black` grep hit on this file is a rank medallion value inside leaderboard cards, not the page title.

### `pages/play/challenges/[slug].vue`

**Legitimate dynamic challenge hero. Do not flag.** The challenge title is runtime entity content inside a surfaced hero after navigation and uses `kr-text-eyebrow ... text-3xl`, not `font-black`. The grep's `font-black` large-type hits are matchup/rank display values such as `VS`, not duplicate shell chrome.

### `components/pages/giving-page.vue` (found by the wired verifier, not the original grep)

**Hero/CTA block, not duplicate shell chrome. Refined the detector rather than the page.** The shell already supplies `title: 'Giving & Support'` / `subtitle: 'Direct aid and monthly support'` from `content/giving.md`'s frontmatter (mounted via `:giving-page`). The page's own top block renders a large `text-3xl font-black` line reading "Give Directly. We Never Touch It." — different copy from the shell's title, alongside a donate icon and a `btn btn-primary` CTA link. This is exactly the case the design brief calls out: *"a page whose heading says something the shell does not is not a violation."* Rather than editing the page, `hasShallowDuplicateTitleBlock()` was narrowed so a shallow title stack that also carries a link/button (real `<a>`/`<button>`, or any `btn`/`kr-btn`-classed element) or standalone media (`<img>`/`<svg>`/`<Icon>`) is treated as a hero/CTA section, not shell-title duplication — Scene Animator's actual violation was bare eyebrow+title+description copy with nothing interactive or illustrative alongside it.

## Contract boundary

A broad `text-2xl|text-3xl` plus `font-black` sweep is unsafe. It would flag runtime entity names, result-state headings, scores, ranks, and other legitimate large values. A broad "first `<header>`" rule is also unsafe because challenge pages intentionally use surfaced dynamic heroes.

The widened `one-header` detector should therefore stay structural and conservative:

1. Keep literal page-component `<h1>` detection.
2. Add a duplicate-title-block detector for a **shallow page-level header/toolbar block** whose heading line combines large display type (`text-2xl` or `text-3xl`, including responsive variants) with `font-black` and is accompanied by page-description/eyebrow copy.
3. Do not descend into surfaced content containers such as `article`, `section`, `kr-panel*`, or card/grid descendants when looking for this non-`h1` shape.
4. Treat dynamic entity/result heroes as content rather than shell-title duplication unless their structure is actually page chrome.
5. Pin both sides with fixtures: the former Scene Animator toolbar must be detected; the public-profile and email-confirmation shapes must remain quiet.
6. Treat a shallow title stack that also carries its own link/button or standalone media (icon/image) as a hero/CTA section, not shell-title duplication — see `components/pages/giving-page.vue` below.

This gives the rule a useful signal without turning typography into a false-positive minefield.