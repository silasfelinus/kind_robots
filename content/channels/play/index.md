---
contentType: channel
channelKey: play
label: Play
title: Play
room: Creative Worlds
subtitle: Explore, remix, and play
description: Browse and interact with dreams, art, bots, facets, characters, rewards, scenarios, stories, challenges, and playful experiments.
icon: kind-icon:dice
route: /dreams
defaultTab: dreams
sort: 30
loadingMessage: Loading creative worlds...
refreshLabel: Refresh Play
dottiTip: Play is where creations are explored, remixed, and put into motion.
amiTip: One creative room. Fewer clipboards. More useful chaos.
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before.
backgroundMobile: /api/art/backdrop/play-mobile
backgroundTablet: /api/art/backdrop/play-tablet
backgroundDesktop: /api/art/backdrop/play-desktop
---

Browse what already exists, remix it, chat with it, and put it into play.