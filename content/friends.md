---
title: 'Friends'
room: 'Friends & People'
subtitle: 'Find your people'
description: Connect with other members, manage friend requests, search the directory, and control blocks.
image: splash/dashboard.png
icon: kind-icon:users
tooltip: Manage friends, requests, and blocks.
dottiTip: Make a friend, block a foe. The circle of social life.
amiTip: Requests, directory search, and blocks — all consent-first.
channelKey: home
tabKey: friends
requiredPermission: authenticated
loadingMessage: Loading friends...
refreshLabel: Refresh friends
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before.
backgroundMobile: /api/art/backdrop/friends-mobile
backgroundTablet: /api/art/backdrop/friends-tablet
backgroundDesktop: /api/art/backdrop/friends-desktop
---

:friends-panel
