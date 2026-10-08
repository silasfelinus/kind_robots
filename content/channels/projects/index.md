---
contentType: channel
channelKey: projects
label: Play
title: Play
room: The Workshop
subtitle: Tools, games, and experiments
description: Tools, games, and experiments, many of them designed and built by Kind Robots' agents. Make art and video, brainstorm, practice music and Mandarin, or play something the robots built.
icon: kind-icon:blueprint
image: /images/channels/plan/channel.webp
route: /art
defaultTab: art
sort: 40
loadingMessage: Opening the workshop...
refreshLabel: Refresh Play
dottiTip: Every bench in this workshop holds something to make or something to play.
amiTip: Several of these the robots built mostly on their own. I checked them for goblins. Mostly.
tutorial:
  title: Projects
  tagline: Pick a thing, understand its state, and jump in.
  overview: Projects is the workshop for finished tools, playable experiments, learning spaces, and agent-built prototypes that do not belong in Storybook or Admin.
  hero: /images/channels/plan/channel.webp
  sections:
    - key: purpose
      title: What belongs in Projects
      body: This is the public workshop for things you can use or play directly: tools, games, learning experiments, creative studios, and prototypes that have grown into real surfaces.
      image: /images/channels/plan/channel.webp
    - key: launch
      title: Pick a project and jump in
      body: Choose a destination from the Projects menu and open it directly. Each project owns its own controls and page-specific help, so the channel tutorial stays focused on how the workshop fits together.
      image: /images/arcade/arcade-attract-splash.webp
    - key: evolving
      title: Expect some experiments to evolve
      body: Projects can range from polished tools to experiments still gaining features. Labels and page-specific help should tell you what is ready now without turning this tutorial into a running catalog.
      image: /images/channels/plan/mandarin.webp
    - key: boundaries
      title: Know the neighboring rooms
      body: Storybook is for narrative ingredients and story-making. Admin is for operational controls and private management. Projects is where front-facing tools, games, and experiments live.
      image: /images/channels/play/channel.webp
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before. The slug stays `plan`
# (Plan folded into Projects and Admin 2026-10-06) so its generated drafting-hall
# art keeps resolving.
backgroundMobile: /api/art/backdrop/plan-mobile
backgroundTablet: /api/art/backdrop/plan-tablet
backgroundDesktop: /api/art/backdrop/plan-desktop
---

Silas, 2026-10-06: everything that isn't Storybook and isn't admin-gated. Tools
first, then the games and toys that were largely AI-created. A project scaffolded
from an approved daily pitch gets a tab here once it has something playable.
