---
title: 'Watchlist'
room: 'Media Watchlist'
subtitle: 'Everything you meant to watch, in one honest list.'
description: A structured log of films and shows to queue, watch, and finish.
image: nav/heroes/games.webp
icon: kind-icon:movie
tooltip: Queue it now so you actually watch it later.
channelKey: plan
tabKey: watchlist
dashboardKey: wonder
dashboardTab: watchlist
cards: navCards
loadingMessage: Rolling the credits...
refreshLabel: Refresh watchlist
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before.
backgroundMobile: /api/art/backdrop/watchlist-mobile
backgroundTablet: /api/art/backdrop/watchlist-tablet
backgroundDesktop: /api/art/backdrop/watchlist-desktop
---

:watchlist-page
