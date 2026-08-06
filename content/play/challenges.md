---
title: 'Challenge Center'
room: 'The Arena'
subtitle: 'Two contenders enter. The swarm decides.'
description: A generative comparison arena — browse challenges, study the contenders, and vote head-to-head.
image: nav/heroes/games.webp
icon: kind-icon:trophy
tooltip: Compare models, agents, and art generators head-to-head.
dottiTip: Pick a winner. Break a tie. Start a rivalry.
amiTip: I voted for all of them. The leaderboard is very confused. 🏆
channelKey: play
tabKey: challenges
dashboardKey: wonder
dashboardTab: challenges
cards: navCards
loadingMessage: Warming up the arena...
refreshLabel: Refresh challenges
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before.
backgroundMobile: /api/art/backdrop/challenges-mobile
backgroundTablet: /api/art/backdrop/challenges-tablet
backgroundDesktop: /api/art/backdrop/challenges-desktop
---

:challenge-center-page
