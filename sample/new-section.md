# New section framework — page, tab, or channel

The one process for adding a new section to Kind Robots, whether Silas does
it by hand or an agent does it for a project task. `sample/README.md` covers
adding a new *model* (schema → API → store); this sheet covers adding a new
*place in the app*. The two compose: a new model usually lands inside a new
tab or channel described here.

## Vocabulary

- **Page** — a Nuxt Content markdown file in `content/`. The filename IS the
  route (`content/stylist.md` → `/stylist`). Every page is a single-word
  `title.md` whose body is one line: the `:title-manager` component
  directive. All visible UI lives in the component, never in the markdown.
- **Tab** — one entry inside an existing channel's config in
  `stores/helpers/dashboardHelper.ts` (`dashboardConfigs.{channel}.tabs[]`).
  The channel's manager component renders it dynamically.
- **Channel** — a top-level key in `dashboardConfigs` with its own tab list,
  footer entry, nav card, tutorial channel, route, and image set.

## Permission gates

| Adding a… | Who can approve it |
| --- | --- |
| Page | normal reversible work — no gate |
| Tab in an existing channel | normal reversible work — no gate |
| **Channel** | **Silas only.** Agents treat a new channel as a hard `needs-human` in the conductor loop; do not create one without his explicit approval in the task or session. |

## Which recipe do I need?

- New UI inside an existing channel's flow → **Recipe B (tab)**. Add a page
  too (Recipe A) only if it deserves its own route (like `/stylist`).
- New standalone route that maps onto an existing channel/tab → **Recipe A
  (page)** only.
- A genuinely new top-level area → **Recipe C (channel)**, which includes
  A and B for its tabs. Get Silas's sign-off first.

---

## Recipe A — new page

1. Create `content/{title}.md` — single word, lowercase; the filename is the
   route. Copy this frontmatter (fields are validated by
   `content.config.ts`; anything else is dead weight):

   ```md
   ---
   title: 'Title'
   room: 'Room Name'
   subtitle: 'One-line hook'
   description: 'What the visitor can do here, in a sentence or two.'
   image: 'nav/heroes/{channel}.webp'
   icon: kind-icon:sparkles
   tooltip: One-line hover text.
   dottitip: Dotti's quip about the page.
   amitip: "AMI's reply."
   sort: highlight
   dashboardKey: {channel}     # must exist in dashboardConfigs
   dashboardTab: {tab}         # must exist in that channel's tabs
   cards: navCards
   loadingMessage: Loading {title}...
   refreshLabel: Refresh {title}
   ---

   :{title}-manager
   ```

2. The body is exactly one directive: `:{title}-manager`, the page's
   primary component. Create it at `components/{domain}/{title}-manager.vue`.
   Component filenames must be globally unique (Nuxt registers by filename;
   folders are organizational only).
3. `dashboardKey`/`dashboardTab` must pass `validateDashboardPair` in
   `dashboardHelper.ts` — point them at the channel and tab this page
   belongs to.

Live examples: `content/stylist.md` (`:stylist-manager`, a tab of the art
channel with its own route), `content/mural.md` (`:mural-manager`).

## Recipe B — new tab in an existing channel

For tab `{tab}` in channel `{channel}`:

1. **dashboardHelper** — add an entry to
   `dashboardConfigs.{channel}.tabs[]` in
   `stores/helpers/dashboardHelper.ts`:

   ```ts
   {
     key: '{tab}',
     label: 'Label',
     icon: 'kind-icon:sparkles',
     title: 'Tab Title',
     summary: 'One-line summary shown on the tab card.',
     image: tabImage('{channel}', '{tab}'),
     narrative:
       'A sentence or two of voice-y description for the dashboard card.',
     route: '/{channel-route}',   // or the tab's own route if it has a page
   },
   ```

   Add `requiredRole: 'ADMIN'` for admin-only tabs.
2. **tutorialCards** — add a matching section to
   `tutorialChannels.{channel}.sections[]` in
   `stores/helpers/tutorialCards.ts`:

   ```ts
   {
     key: '{tab}',
     title: 'Tab Title',
     body: 'What the user does here, tutorial voice.',
     image: tutorialImage('{channel}', '{tab}'),
   },
   ```

3. **Images** — two files, named by key:
   - `public/images/dashboard-tabs/{channel}/{tab}.webp` (dashboard card)
   - `public/images/tutorials/{channel}/{tab}.webp` (tutorial section)

   The same art committed to both paths is fine.
4. **Component** — the channel's manager picks up the tab automatically via
   `getDashboardTabs('{channel}')`; wire the tab key to your new component
   inside that manager.
5. Optional: give the tab its own route with Recipe A (set the tab's
   `route:` to the new page).

## Recipe C — new channel (Silas approval required)

For channel `{channel}` at route `/{channel}` — everything in one registry
file plus a page, a manager, and images. `dashboardConfigs.footer.tabs` in
`dashboardHelper.ts` IS the channel list; nav cards derive from it, so you
do **not** hand-edit `navCards.ts` (its lone hand-written card is conductor,
which sits outside the footer).

1. `stores/helpers/dashboardHelper.ts` → `dashboardConfigs.footer.tabs[]` —
   the channel's footer/nav entry: `key`, `label`, `icon`, `title`,
   `summary`, `image: getNavHeroImagePath('{channel}')`, `flourish`,
   `tagline`, `narrative`, `route: '/{channel}'`.
2. Same file → `dashboardConfigs.{channel}` — the channel's own config:
   `{ key, label, defaultTab, tabs: [...] }`, one Recipe-B entry per tab.
3. Same file → `footerDashboardMap` — add `'{channel}': '{channel}'`.
   **Compile-enforced**: missing entry fails `tsc`.
4. `stores/helpers/tutorialCards.ts` → `tutorialChannels.{channel}` — the
   channel tutorial: `key`, `title`, `tagline`, `overview`, one section per
   tab (Recipe B step 2). **Compile-enforced.** Add the key to
   `EARNING_CHANNELS` if creators earn from it; standalone channels that
   aren't footer keys go in `ExtraTutorialKey` (see `mural`).
5. `content/{channel}.md` — the channel page (Recipe A) with
   `dashboardKey: {channel}` and `dashboardTab: {defaultTab}`.
6. `components/{channel}/{channel}-manager.vue` — the primary component.
   A channel manager is a tab switcher: it reads
   `getDashboardTabs('{channel}')` (or `getVisibleDashboardTabs` for
   role-gated tabs) and dynamically renders the right tab's component —
   it does not re-implement the children. `sample/sample-manager.vue.txt`
   is the template.
7. `components/navigation/channel-select.vue` → `allChannels[]` — add
   `{ key, label, path: '/{channel}', icon }`. **Hand-maintained and fails
   silently** — forget it and the channel never appears in the header
   dropdown. Check it last.

Steps 3 and 4 fail the build if skipped; step 7 does not.

### Channel image checklist

All under `public/images/`; filenames must match the keys exactly.

| Image | Path |
| --- | --- |
| Channel hero (nav deck + footer) | `nav/heroes/{channel}.webp` |
| Channel card/thumb | `nav/thumbs/{channel}.webp` |
| Tutorial hero | `tutorials/{channel}/hero.webp` |
| Dashboard tab (one per tab) | `dashboard-tabs/{channel}/{tab}.webp` |
| Tutorial section (one per tab) | `tutorials/{channel}/{tab}.webp` |

The tutorial hero is a separate file by default; it only reuses other art
if you explicitly set `hero:` on the tutorial channel entry. The `icon`
fields are Iconify `kind-icon:*` names, not files.

Net for a two-tab channel: 3 code files (`dashboardHelper.ts`,
`tutorialCards.ts`, `channel-select.vue`) + 1 content page + 1 manager
component + 9 images.

## Verifying

- `npx nuxt typecheck` (or the project's `tsc` script) — catches a missing
  `footerDashboardMap` or `tutorialChannels` entry.
- Load the page: the frontmatter's `dashboardKey`/`dashboardTab` pair is
  validated by `validateDashboardPair`; an invalid pair logs the expected
  keys.
- Check the header channel dropdown and the footer nav for the new entry —
  the dropdown (`channel-select.vue`) is the piece nothing enforces.
