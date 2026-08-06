---
contentType: channel
channelKey: admin
label: Admin
title: Admin
room: Control Room
subtitle: Operational controls for managers
description: Queues, servers, permissions, moderation, system health, and other dangerous buttons.
icon: kind-icon:server
route: /artjob
defaultTab: artjob
sort: 70
requiredRole: ADMIN
loadingMessage: Loading admin systems...
refreshLabel: Refresh Admin
dottiTip: Admin tools are powerful, so I brought validation.
amiTip: I brought a helmet.
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before.
backgroundMobile: /api/art/backdrop/admin-mobile
backgroundTablet: /api/art/backdrop/admin-tablet
backgroundDesktop: /api/art/backdrop/admin-desktop
---

Manage the systems and queues that keep Kind Robots running.
