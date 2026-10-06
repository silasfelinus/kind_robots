---
contentType: channel
channelKey: fun
label: Fun
title: Fun
room: The Robot Fairground
subtitle: Games and toys the robots built
description: Free games, toys, and curiosities that were largely designed and built by Kind Robots' AI agents. New ones arrive as daily pitches get approved.
icon: kind-icon:party
route: /play/memory
defaultTab: experiments
sort: 40
requiredRole: GUEST
loadingMessage: Opening the fairground...
refreshLabel: Refresh Fun
dottiTip: The robots made these mostly on their own. I checked them for goblins. Mostly.
amiTip: Every game here started as a pitch. Silas said yes, and the robots took it from there.
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before.
backgroundMobile: /api/art/backdrop/fun-mobile
backgroundTablet: /api/art/backdrop/fun-tablet
backgroundDesktop: /api/art/backdrop/fun-desktop
---

Silas, 2026-10-06: a spot for projects that were largely AI-created, not an admin
channel. A project scaffolded from an approved daily pitch gets a tab here once
it has something playable to show.
