---
contentType: channel
channelKey: projects
label: Projects
title: Projects
room: The Workshop
subtitle: Tools, games, and experiments
description: Tools, games, and experiments, many of them designed and built by Kind Robots' agents. Make art and video, brainstorm, practice music and Mandarin, or play something the robots built.
icon: kind-icon:blueprint
image: /images/channels/plan/channel.webp
route: /art
defaultTab: art
sort: 40
requiredRole: GUEST
loadingMessage: Opening the workshop...
refreshLabel: Refresh Projects
dottiTip: Every bench in this workshop holds something to make or something to play.
amiTip: Several of these the robots built mostly on their own. I checked them for goblins. Mostly.
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
