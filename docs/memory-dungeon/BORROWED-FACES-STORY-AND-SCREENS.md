# Memory Dungeon: Borrowed Faces

## Proposed story bible, scene system, and single-screen console UX

**Status:** proposed narrative direction and implementation-ready first-pass content. Not yet shipped gameplay or generated artwork. Names and specific plot beats are working choices, not locked franchise canon.

**What stays intact:** `/play/memory`; Classic Match as a separate destination; user-selected art galleries for actual memory matching; an 8×8 Briar Camp map; four matching rounds of **12 / 14 / 16 / 18 cards**; **four reserved cross-region near-match seals**; global attempt count; a one-screen landscape console stage; persistent geography, inventory, shortcuts, and existing merchant/puzzle/combat rewards.

**New promise:** matching gives you the map, but **exploring gives you the story**. Each revealed landscape square presents a discrete illustrated experience, with its own text, decisions and return state. No dead-looking empty squares.

---

## 1. The core hook: somebody else went home

The protagonist wakes beneath the briars with all their memories but none of the proof that those memories belong to them. A fey changeling with their exact face has returned to their actual home and is living the life they lost. The road back lies through the Memory Dungeon: a borderland where things that look identical can nevertheless remember, desire, and choose differently.

The obvious first goal is to find a door home and trade places back. Then the player learns that the changeling, working name **Morrow**, may have already done something kind, necessary, or unforgivable in the life they borrowed. Removing Morrow solves one injustice while potentially creating another. It is possible that the court arranged the swap. It is also possible that Morrow was fleeing the court, rather than carrying out its orders.

**Central question:** When someone has your appearance, your memories, and a few relationships you no longer recognize, who gets to decide which of you is real?

The player is not told what their original home looks like or what relationships they must have; discoveries are personalizable and should avoid forced biography, gender, or family structure. "Home" refers to the player's chosen origin, and the fey's counterfeit memories can be interrogated, never treated as a mandatory fixed player history.

**Tone:** approachable illustrated Zelda-like fantasy, dry and intelligent humor, curious beauty, occasional gothic melancholy. Avoid default grimdark, accidental cruelty as comedy, villainous-looking equals evil, or cloying fairy-tale moralizing.

### What counts as matching?

1. **Game mechanic:** a fair pair of player-selected gallery illustrations is needed to reveal two tiles. These cards are not generic designer symbols when a custom gallery is selected.
2. **Plot:** doubles and mismatched lives are everywhere. An exact face is not an exact person.
3. **Mysteries:** some visuals differ by one tiny, inspectable detail. The four special region-crossing cards use this, with visual clues, not arbitrary pixel hunts.
4. **Resolution:** matching does not necessarily mean replacing. Partnership, separation, reconnection, and coexistence can all be earned.

---

## 2. Main cast (working names)

### The protagonist, **the Unreturned**

An ordinary person denied their own place in the ordinary world. Their precise origin and relationships should be discoverable through decisions, not prewritten. Their "unique power" is _witnessing differences_: recalling detail without making identity a competition. They meet others who were replaced, but some replacements have become good neighbors.

### Morrow, **the Face Who Went Home**

A changeling who looks exactly like the protagonist. Start as a frightening absence, not an on-screen evil laugh. First appearance is in handwriting, footprints, and testimony; later appears in mirror images, a contested letter, and finally a real conversation. Their motives shift with evidence: they wanted sanctuary; someone coerced them; they made choices that bound them to a life they stole. Morrow must be allowed an ethical voice even when the player chooses to displace them.

### Prince Halden, **the Perfect Twin**

Identical face and stature to his brother, ceremonial cream-and-gold clothing, practiced smiling, exacting public manners. Believes institutions, signatures and shared ritual can protect people against whim. He can be kind at great personal risk; he can also trade one inconvenient person for public calm. Never write him as the automatic hero.

### Prince Vesper, **the Mourning Twin**

Halden's identical twin under charcoal velvet, funeral lace, black nail polish, silver eyeshadow and dramatic antique jewelry. Loves terrible poetry and delivers genuinely funny observations. Demands individual freedom, yet treats betrayal of tradition as a shortcut around hard collective decisions. His theatrical darkness is not a clue that he is evil, and his iconoclastic style is not proof that he is right.

**Twins' central wound:** The brothers have deliberately swapped identities at public ceremonies for years. One knows a lie about the order of birth; the other knows the court wrote its rules around the lie. As sidekicks they disagree with the player and each other, sometimes help for incompatible reasons, and may swap sides under certain moral decisions. Never force a prince to be the romantic interest or chosen hero. The player may reconcile them, choose one for a task, defy both, or build a coalition that bypasses the crown entirely.

### Quill, **the Unreliable Rogue**

A beloved, competent liar with deliberately mismatched boots and a perfect memory for debts. Sells half-truths cheaply, returns a stolen keepsake unasked, then later delivers the player's location to the court. Betrayal is earned, foreshadowed and _motivated_: someone Quill loves is held in the registry of borrowed names. The player's earlier kindness or callousness changes the cost and damage of the betrayal, not whether the rogue has free will. Quill can be confronted, tried, bargained with, or brought into a hard-won truce. No automatic forgiveness.

### Mosswick, **the Neighbor with the Ledger**

Existing Briar Camp merchant. Supplies lanterns and stories but keeps a personal account of anonymous food, shelter and favors. Unexpected community organizer rather than a magic-item vending machine. His ledger later contradicts official proof of who is "real." He has made compromised decisions, so dealing with him remains a choice.

### Vell, **the Rootkeeper**

Warden of wetlands and woods, no glib "nature equals innocence." Protecting migration paths can harm farmers in a late winter; building a refuge can uproot old forest. Offers practical ecological problems that invite compromise, not virtue-point farming.

### The Queen, **the Keeper of Two Crowns**

Seen first through an unsent letter. Her disappearance precipitated the twins' feud. Her decree might have prevented the disaster or ensured it, depending on what the court omitted from the record.

---

## 3. Four matching rounds become four chapters of a living forest

| Round                            | Cards / Pairs | New spaces | Primary dramatic movement                                                                                          | Between-round opportunity                                                                               |
| -------------------------------- | ------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| **I: An Unfamiliar Welcome**     | 12 / 6        | 12         | The altered signpost; your handwriting; Mosswick; the first clue that someone went home wearing your face.         | Explore camp, merchant, inscription, chest, stones. Meet the first witness.                             |
| **II: The Same Face Twice**      | 14 / 7        | 14         | Court bureaucracy appears; first rumor of the rival princes; initial Quill help, a small favor that binds.         | Enter the Vault or linger; earn trust and resources through optional episodes.                          |
| **III: The Price of Difference** | 16 / 8        | 16         | Twins' public/private contradictions; refugee identity hearings; ecological costs; Quill's loyalty cracks.         | Interrogate witnesses, negotiate alternatives, approach Thorn Gate.                                     |
| **IV: The Unreturned Road**      | 18 / 9        | 18         | Evidence the changeling may be a victim as well as a thief; the court's role; consequences of earlier compromises. | Explore 60 revealed spaces, revisit characters, collect evidence, prepare the gate and further regions. |

**Important:** The player's already-earned map remains static and traversable between rounds. The next round is opt-in; no auto-start when the last pair is matched. Narrative can develop while exploring, not just when turning cards. A missing quest item never destroys the player's ability to travel. Scenes can update across visits, waves and favors.

**Remaining four tiles:** North Star Twin `1,1`, Sleeping Sigil `5,2`, Whitewing Cipher `8,1`, Moonroot Knot `8,8`. Their counterpart art and special visual differences live in future regions. Solving them is a later multi-map quest, **not** achieved by matching generic cards in the current round.

---

## 4. Every tile has an experience: atlas and scene contract

The companion **`utils/memoryDungeonStoryAtlas.ts`** contains **64 authored encounter seeds**: title, distinct scene setup, a bespoke scene-art brief, and at least two different choices with immediate narrative response and a declared value emphasis. All 60 regular reveal spaces and four special seals are represented. Existing mechanical `BRIAR_SITES` events remain authoritative until their scenes are integrated.

**This is content data, not a claim that any of the 64 scenes is now wired, drawn or playable.** First implementation step is the script executor, which must respect existing saved games and functional loot/puzzles.

### Required node contract

- `nodeId`, permanent map coordinate, reveal wave and location tag
- scene ID and **unique illustrated scene asset**, distinct from the selected gallery deck faces
- initial scene, return-visit scene and consequence scene (at least one useful update when revisited)
- story prompt, two to five **purposeful** contextual choices directly below the prompt
- outcome text or a short illustrated follow-up, plus effects on favors, relationships, clues, world condition or items
- conditional visibility and disabled state with a reason; no fake choices or "inspect" that does nothing
- persistent completed / unresolved / evolving status with save migration
- optional character presence, ambience and low-cost motion layers
- accessibility: buttons navigable by keyboard/controller; legible at iPad dimensions; reduced-motion support
- source of truth: one tile scene record, not duplicated route-specific strings

**No filler policy:** a connective path square needs a short human encounter, observation with a payoff, or environmental choice. Its interaction may be less consequential than a main landmark, but every square must earn its place. Do not turn 60 squares into 60 identical dialog popups.

### Systemic values (for _consequences_, not a karma scoreboard)

- **Community:** who shares labor, shelter, accountability and resources
- **Nature:** whose ecology is preserved or disturbed, and who bears the transition
- **Truth:** evidence discovered, but also whose privacy is respected
- **Mercy:** repair, accommodation, empathy, not blanket absolution
- **Identity:** self-definition, consent, promises, boundaries
- **Court:** institutional trust versus political expediency
- **Freedom:** refusal of control, balanced against harms of abandonment

Choices may benefit one value and harm another. Do not paint options green/red for goodness. A player can be wrong without the game moralizing about their identity. Recoverable setbacks are more interesting than a secret perfect path.

### Interaction tiers

- **60 regular squares:** art + 2–5 authored actions, often 1–3 short scenes, persistent outcome. A few are quiet, delightful interludes; none are inert.
- **Major landmarks:** multiple visits; choices changing inventory, route conditions, social ties, or secrets; several illustrated variants.
- **Characters:** recurring across multiple tiles and rounds; remember player decisions and tell stories that change.
- **Four special seals:** clue exploration in Briar Camp and cross-region near-match resolution later; keep distinct from ordinary card-pair inventory.

---

## 5. Screen-by-screen production direction

Everything below happens **inside the same full-screen game stage**. No page-shaped tabs, long website forms, infinite dialogue scroll, or stacked cards below the viewport. Landscape tablet is the reference size. Scene transitions change the stage contents, not the webpage.

### A. Ordinary revealed tile / story moment

**Core composition:** image dominates the left **52–58%** of usable stage; right holds one illustration detail, title, narrative and immediate choices. Map shrinks to a little corner locator when a scene takes focus. Screen starts with a quick place-name flourish; not a permanent floating browser-like banner. Text about 1–3 sentences max before choices. Choice list **directly under the prompt**, not below the art. Use three generously sized selections by default; allow 2–5 for scenes that earn them. Inventory, attempt count, and context clues occupy a compact edge strip.

**Example, The Double Footprints:** The scene is two sets of prints pressed into wet river mud, where one turns toward a familiar kitchen glow. Prompt: _Two travelers with your stride crossed this bank. One was going home. Neither left alone._ Choices:

1. _Follow the homeward prints_ → recover a ribbon associated with the player's lost life, but expose which route they took.
2. _Ask who carried the second bundle_ → reveal that the changeling was helping someone else.
3. _Erase the trail before soldiers arrive_ → protect both travelers at the cost of physical evidence.
   Each yields a brief illustrated outcome and a persistent annotation; no random moral "correct" answer.

**Animation:** fog-to-scene camera dissolve, short foreground parallax and one environmental idle loop; responsive under 300ms to input. The first illustration appears immediately even if the motion is disabled.

### B. Merchant / Mosswick's Stall

Large hand-painted stall art, hanging lantern sway and a portrait of Mosswick in a corner. Right-hand prompt changes with purchase history and trust. Choices directly under it: _Trade a flower for a lantern_, _Ask about the second you_, _See whose supper his ledger paid for_, _Offer to carry a petition_, _Leave_. Trade is explicit about cost and benefit. Recurring merchandise and gossip change; not every return is the same two lines.

**Moral seed:** Mosswick has been hiding some displaced folk from the court but charging others full price to subsidize them. The player can demand a fairer ledger, help him with supplies, or report the deception.

### C. Puzzle shrine / Three Quiet Stones

The image IS the puzzle interface: three monumental stones, visible inscriptions and interactions drawn over their surfaces. The surrounding scene should not be a tiny glyph selector under a landscape screenshot. Show evidence of **two different carving layers**. Beneath prompt, choices include _Study the weathered edge_, _Ask who built the stones_, _Enter rune_, _Spend a lantern for a clue_, _Leave_. Once "Enter rune" is selected, the stone buttons become the focus: input `leaf, leaf, sun` remains supported, but additional optional clues, false leads, and a later mirrored sequence give actual observation depth.

**Hint ladder:** visual clue, spoken clue, exact pattern. No impossible puzzle due to random art selection: puzzle rune visuals are designer-authored and independent of gallery-deck card faces.

### D. Treasure scene / Creekside Cache or Riverbank Chest

Open with a bespoke chest illustration, short gleam, character-scale placement and tactile animation. Prompt asks whether to claim, examine ownership, donate, trade or leave. Rewards remain deterministic and preserve existing mechanics. Some chests have ecological or community costs, and some loot tells a story rather than simply incrementing a counter. A claimed chest is not an empty tile: return visits show new tracks, a note, a tampered lock or an aftermath.

### E. Dungeon gate / Rootbound Vault and Thorn Gate

A full-bleed entrance view with animated knotwork and twin locks. Prompt is a conversation with the gate or its keeper, not a generic "Enter dungeon" button. Choices below: _Listen at the threshold_, _Inspect the twin locks_, _Offer a true memory_, _Enter the matching chambers_, _Retreat_. Once the Bramble Chime is earned, the gate unlock animation should be a full scene beat, followed by the revealed landscape beyond. Keep loading and unsuccessful attempts clear, reversible and diegetic.

### F. Recurring character confrontation / Royal twins

The scene is two near-identical portrait-sized characters flanking the prompt, one cream-gold, one funeral-black, both unmistakably the same face. They interrupt, contradict and challenge each other. Both should sometimes be funny and wrong. Choices: hear each version, present evidence, refuse the premise, propose cooperation, leave with a secret. When one prince assists, show the other reacting rather than erasing him from the story. A future betrayal must feel plausible in hindsight.

### G. Late cross-world twin-matching puzzle

Side-by-side _nearly identical_ images from different named overworld regions, zoomable at the same scale and accompanied by actual in-world clues. This puzzle is about recognizing **differences**, not flipping another normal deck. Four anchors tie the first map to future areas. No arbitrarily timed zoom, unfair artistic noise, or hidden-magic "guess again" walls.

---

## 6. Scene art and motion pipeline

**Do not reuse the generic map SVG crop as the primary encounter art.** The map SVG remains terrain geography. The matching faces remain user-selected gallery images when chosen. **Illustrated encounter scenes are their own content category.**

### Required image deliverables

- **64 scene illustrations** (one meaningful visual for every map square); this is the minimum opening-region asset budget, not a count of finished renders
- additional main-character layered portraits: Halden cream/gold, Vesper gothic, Quill, Mosswick, Vell, Morrow as an indirect/silhouette reveal first
- state variants where narrative choice changes a place (opened chest, changed river channel, restored bridge, unlocked gate)
- puzzle detail art must exactly match solvable rules; do not let stylistic generation randomly redraw a clue
- 4 separate first-region sigil key illustrations, with exact metadata about their future near-match counterparts
- background / foreground / lights / accents where possible for gentle animated scenes

### Image prompt contract

Each art job should carry `sceneId`, `storyRevision`, `mapKey`, `styleBible`, `aspectRatio`, `focusSubject`, `criticalObjects`, `continuityAnchors`, `stateVariant`, `mature=false`, plus `queuedJobId` and status. Production artists or art workers must review critical objects, scene continuity and portraits.

Prefer in-world hand-painted 2D Zelda/Arranger-inspired adventure illustration with painterly, character-forward vignettes, strong silhouette and readable focal areas. No web-UI chrome, labels, paragraphs, text baked into images, map cards baked into background, or random foreground characters resembling the player. Avoid emergency SVG placeholder scenes being counted as delivered art.

A scene with no approved illustration should appear in a clearly labeled production-missing state during internal testing, not silently pass as a finished cinematic encounter.

### Motion rules

- discovery: 350–650ms tile fade/fog pull; major landmark gets a tailored visual accent
- idle: subtle 5–10s lantern flicker, leaf drift, shadow shift, tide or runes, never a jittering whole screen
- choice: 120–200ms press feedback; consequence text settles in, relevant object animates once
- avoid blocking input beyond the essential match flip; skip/fast-forward transitions
- `prefers-reduced-motion`: immediate still image with all clues equally visible
- no audio requirement; any future sound must be optional, separately controllable and silent by default where appropriate

---

## 7. Real narrative reactivity and moral branching

Do **not** use a flat `alignment = good/bad`. Store observable state: `promisesMade`, `witnessesProtected`, `courtEvidence`, `quillTrust`, `haldenTrust`, `vesperTrust`, `rootHealth`, `refugeSafety`, `morrowClues`, `tileOutcomes`. Each choice's declared `value` in the atlas is a **design label**, not a shipped meter change.

**Example consequence chain:**

- Player saves a displaced family in Foxglove Shelter.
- Mosswick acknowledges the shelter and offers honest barter instead of a discount trap.
- Quill later asks the player to return stolen registry papers, claiming the papers keep a family safe.
- At the betrayal, that family is indeed in danger. The player can resist Quill's bargain, shield the family, or pursue a collective alternative with the twins.
- The earlier choice gives additional truthful dialogue and a chance to avert harm, but does not automatically make Quill loyal or the choice trivially correct.

**Nature/community problem:** Opening a blocked stream restores spawning grounds and disturbs the mill. A quick unilateral choice helps nature while harming livelihoods; involving the mill takes effort and loses time. Later river scenes should reflect the outcome in imagery, movement and family testimony, not just a hidden number.

**Suggested endgame branches, not a locked ending count:**

1. **Reclaim:** the player returns home, accepting the cost of displacing Morrow and exploring reparations.
2. **Coexist:** a difficult legal/social agreement recognizes two people with shared memories.
3. **Refuse the registry:** the player dismantles the system granting the court ownership of names, destabilizing protection and authority along with oppression.
4. **Choose another life:** the player remains in the strange world on freely chosen terms, not as a punishment for failing to go home.

All branches need a convincing emotional cost and a visual ending. The court twins can have different fates in each.

---

## 8. Script architecture and milestones

### Milestone A. Content foundation (authored in this proposal)

- 64-tile `BRIAR_STORY_ATLAS`, illustrated-scene briefs, initial choices and aftermath texts
- this five-plus-screen spec, cast and arcs, plus a test that asserts 64 entries with authored choices
- **No claim of scene integration or art generation**

### Milestone B. Actual playable interaction, first 12 tiles

- a `sceneId`/action executor respecting existing `BRIAR_SITES` mechanical actions and persisted save
- illustrated scene modal/stage with prompt then 2–5 choices directly below, no scrolling
- persistent `tileOutcomes` and return-state text, with a migration that keeps `attempts`, `revealed`, and user gallery choice intact
- wire first reveal-round 12 scenes, especially Briar Camp, Mosswick's Stall, Moss Inscription, Three Quiet Stones and Creekside Cache
- encounter scenes do not replace the separate gallery-based memory-board faces

### Milestone C. Next 48 tiles and four sigils

- add distinct mechanically grounded outcomes and episodic progression for every other normal tile
- the four reserved seals show hints but cannot resolve without future regions
- map/scene travel includes marker states for unvisited, available, in-progress, resolved and changing

### Milestone D. Character, art, and puzzle production

- submit/review actual scene image jobs and animated layers in observable batches
- introduce Halden, Vesper, Quill, Vell and Morrow through scenes as art is approved
- build a deterministic clue puzzle framework, escalating beyond the already playable three-rune sequence
- test hard choices from opposed playstyles and all major failure states

### Milestone E. Adversarial acceptance

- complete runs with community-first, nature-first, court-loyal, defiant, puzzle-first, minimal-dialogue and skeptical players
- every 8×8 tile has a distinct reachable interaction and an observable outcome
- no action is fake; no crucial clues buried in inaccessible art; no dead ends caused by a wrong moral choice
- cross-device landscape tablet/phone/desktop stage remains single-screen and controller/keyboard accessible
- visible cards still match images from the user's chosen gallery, with no repeats between rounds, and the attempt counter remains accurate
- any missing image-job or character portrait must be reported as incomplete, not silently styled as finished

---

## 9. Design review questions (creative, not blocking engineering)

1. Are the royal brothers specifically _princes_, or should titles be changed while preserving the identical face/wardrobe rivalry?
2. Should Quill's betrayal be guaranteed but alterable in impact, or avoidable if the player exposes the court's leverage first? Lean toward **guaranteed reveal of Quill's divided allegiance, variable harm**.
3. How much of Morrow's borrowed home should be player-authored versus canon story? Lean toward player-authored relationships with a few universal memories.
4. How early does Vesper's gothic look become a deliberate camouflage for his brother? Preserve room for a costume-swap revelation.

**Guiding principle:** The player's identity is not established by proving the double is lesser. It is established by the choices the player makes when a perfect match is impossible.
