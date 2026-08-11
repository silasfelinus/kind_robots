---
title: 'Memory Dungeon'
room: 'Memory Room'
subtitle: Match, Survive, Loot!
description: A roguelite memory card game where AI art becomes a tiny dungeon crawl. Match pairs, survive with limited lives, chase challenge targets, trigger surprise awards, clear levels, and claim creative rewards from the prompt and art modeller.
image: 'background/memorydungeon.png'
icon: kind-icon:brain
tooltip: 'A memory game with lives, levels, powerups, surprise loot, and weird dungeon flavor.'
dottiTip: 'AMI, I upgraded the memory game into a dungeon crawler. There are lives, levels, rewards, and probably goblins.'
amiTip: 'Excellent. Nothing improves cognitive training like treasure chests and suspiciously judgmental rectangles.'
channelKey: play
tabKey: experiments
dashboardKey: wonder
dashboardTab: memory-dungeon
cards: labCards
loadingMessage: Loading memory
refreshLabel: Refresh memory
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before.
backgroundMobile: /api/art/backdrop/memory-mobile
backgroundTablet: /api/art/backdrop/memory-tablet
backgroundDesktop: /api/art/backdrop/memory-desktop
---

:memory-dungeon
