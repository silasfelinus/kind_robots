---
contentType: tab
channelKey: admin
tabKey: playbook-kit
label: Playbook Kit
title: Playbook Kit
subtitle: One frame for every story game. Start small, earn every complication.
description: The shared framework for Kind Robots story games ("playbooks") like Emperor of Dust, Shifting Lands, Shifting Desks, Prom of Doom, This Means Warp and Ecotone. One-screen shell, settings, title trailer, scrapbook of cinematic moments, cast, factions, secrets and endings, audited against a complexity budget.
summary: Build and audit new playbook games.
icon: kind-icon:blueprint
route: /admin/playbook-kit
sort: 75
requiredRole: ADMIN
tutorial:
  title: Playbook Kit
  body: >-
    Every playbook declares one spec (utils/playbookKit/games/) and gets the
    same frame: a one-screen shell with a meter strip and six panes (Cast,
    Factions, Secrets, Scrapbook, Endings, Settings), a spoiler-free title
    trailer built from scrapbook moments, and per-game saved progress. The
    stage shows the playbook's key art and lets you rehearse a run: live a
    moment, uncover a secret, reach an ending and move the meters, then open
    the panes to see what a player would see. The budget panel audits the
    spec against its tier. Vignette (one sitting) is where every playbook
    starts; Standard (an evening) and Saga (a campaign) must be earned.
    Going over a cap fails CI unless the spec carries a written allowance
    saying why. The ladder shows the next rung to build: premise, cast,
    endings, scrapbook, trailer, factions, reveals, optional romance, then
    rendered art. Start a new playbook with npm run playbook:new -- <slug>
    "<Title>"; the full recipe is docs/playbook-kit/README.md.
  image: /images/art/resources.webp
---

The shared frame and complexity budget for every playbook game.
