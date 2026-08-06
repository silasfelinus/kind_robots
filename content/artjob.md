---
title: 'ArtJob'
room: 'ArtJob Pipeline'
subtitle: 'The art-generation control room'
description: Admin dashboard for the ArtJob pipeline: manage ComfyUI and SD servers, watch uptime, track images created versus failed, and inspect, requeue, or cancel jobs in the queue.
image: 'background/artgallery.webp'
icon: kind-icon:server
tooltip: Manage art servers and watch the generation queue.
dottiTip: So this is where the pixel goblins actually live.
amiTip: It's the control room — servers, uptime, and every job the queue is chewing on.
channelKey: admin
tabKey: artjob
dashboardKey: art
dashboardTab: artjob
requiredRole: ADMIN
loadingMessage: Loading ArtJob pipeline...
refreshLabel: Refresh ArtJob
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before.
backgroundMobile: /api/art/backdrop/artjob-mobile
backgroundTablet: /api/art/backdrop/artjob-tablet
backgroundDesktop: /api/art/backdrop/artjob-desktop
---

:art-manager
