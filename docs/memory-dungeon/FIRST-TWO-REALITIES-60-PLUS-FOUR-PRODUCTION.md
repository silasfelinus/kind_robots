# The First Two Realities: Memory Dungeon's Briar Production Bible

**Approved direction, 25 October 2026.** Creative/implementation specification for the first two playable incarnations of an **eight-concept, sixteen-experience Reimaginer game**, linked to [master roadmap #4136](https://github.com/silasfelinus/kind_robots/issues/4136). This is a plan for new improvements **on top of existing playable content**; it must not be confused with already-shipped gameplay or delivered artwork.

## 1. The 60 + 4 rule, in both worlds

Each persistent geographical 8×8 map has **64 positions: exactly 60 authored ordinary encounters plus 4 cross-overworld seal positions**. Sixteen featured anchors per map appear in the following tables, and the *other 44 ordinary encounters remain unique and fully authored*; neither world is a 4×4 vignette. Overworld 01 already uses memory reveal waves of **12 + 14 + 16 + 18 = 60**. Never change this to 64 standard scenes merely to fill the grid.

The four **reserved, inspectable but not ordinary encounter** coordinates are **(5,2), (1,1), (8,1), (8,8)**. They are part of a later multi-overworld matching puzzle, not four extra monster/story nodes. Discover, inspect and record their physical clues early; **do not solve their ultimate paired puzzles until appropriate later counterparts are reachable**.

**Critical implementation gap:** Dark Briar currently defines 64 story scenes and counts (5,2) among eight required witnesses. Migrate it to 60 standard stories + four seal inspections, relocate the (5,2) witness duty to eligible **(5,3)** or another ordinary square, and preserve already-earned testimony and legacy completion in saves. Existing Dark wave rounds of 16×4 are a gameplay implementation to reconcile, not an instruction to erase or shift coordinates. Do not accidentally lock the dark House behind a now-reserved marker.

By the **end of experience 04** (the magic-altered Earth), players must have had an accessible, fair way to **identify and locate all four seal positions on map 01**. Discovering is not solving: the Chronicle separately tracks `seen`, `inspected`, `counterpartSeen`, `paired`, `resolved`. For missed early monuments offer earned clues and an explicit fast-travel recovery expedition to the relevant known coordinates before the end of experience 04. Do not auto-award matching solutions. Preserve all original-world unlocks and cross-map revisit opportunities.

**Canon guardrails:** 01 Briar → 02 Dark Briar → 03 Morrow's real-world Earth POV → 04 magical future Earth; surface-royal Scylla and Char take fuller POV and undersea form in 05/06. Scylla and Char are adult **mermaid twins** with identical features and divergent pigmentation/styling; Char is authentically goth, not a costume joke. Master **Oren Pike remains hooded**, carrying his axe and a manifest, brilliant and dryly funny. The protagonist's stolen Earth life matters; Morrow's complex future loved ones are **not** revealed prematurely. The Reimaginer genuinely alters realities, not an automatic evil wish machine.

## 2. Two campaign-wide decisions, not 2^10 stories

Across **sixteen** realities, make exactly **two large world-frame state choices** now, earned after substantial quests. Everything else is a local situation or modular callback, not another multiplying story branch.

| State | Earned through actual playable level | Values with real tradeoffs | Later world-scale result |
| --- | --- | --- | --- |
| `memoryCustody` | World 01 House at (6,2), **original HD-35 Memory Hearth**; physical ratification at Thorn Gate (8,4) | **release**: return memories to individuals, with loss of some protections; **renew**: revocable shared stewardship, risk of committee abuse; **break**: destroy compulsory custody, with uncertain protection and safety. | Who controls records, locks, shelters, archives and testimony in 02, 03/04, Transit, Archive, and the Forge. Use **existing** original `release/renew/break` outcomes, not a new overlay.  |
| `crossingAccord` | World 02 Dark House at (6,2), after eight witnesses and the mirror-dungeon Warden, **mirrored HD-35** | **return**: boundaries and memories returned to owners, risking isolation; **commons**: voluntary shared testimony/roads, risking collective error. | Who can open, refuse and revoke reality-crossing permissions in worlds 03/04, underwater realm, Transit, Archive, finale. Use **existing** Dark House `return/commons` outcomes. |

This makes **3 × 2 = 6 campaign world-frame combinations**. Record the two labels as derived projections of existing save decisions until a versioned campaign-state migration exists. Unknown state remains `unset`. Every combination earns strengths and obligations. No hidden good/evil axis, no obvious intended answer, no “best option gives everything.”

A **major choice must change at least one of topology/accessible route, institutional powers, NPC status, visual geography, resource flow, or available resolution verbs**, not merely a paragraph.

The initial House offers three defensible policies with visible beneficiaries and costs; the second House asks what ethical way of **crossing between radically changed worlds** should follow from those consequences. Both decisions remain real by the 13→14→15→16 contiguous, reality-changing finale.

## 3. World 01: 16 featured encounters (of 60)

The coordinates and existing choice IDs are canonical. Where a coordinate has an existing camp, merchant, chest, House or gate site action, **integrate** the dramatic scene into that existing system rather than overwriting the site type.

| Square | Encounter | Interactive challenge / emotional beat | Approaches and outcomes | First callback and lasting echo |
| --- | --- | --- | --- | --- |
| 2,4 | Briar Camp / The Signpost Has Two Arrows | Courier needs help with impossible address. Turn painted sign arrows to locate a real road; Pip quietly jokes about delivering to someone not born yet. | **lend** light to courier, expose self to dark; **copy** address and retain lantern, delay delivery. | Courier remembers risk vs evidence at dark camp; later Transit pass/help. |
| 3,4 | An Unpaid Toll | Collector demands fee on a bridge drawn on paper. Build a short route using boards or reconstruct ledger geometry. Satirical, a little menacing. | **challenge** collector with evidence; **help** draw a legal bridge in their register. | Dark knight's bridge may be built or merely recognized. Different access and toll claims. |
| 4,4 | Their Identical Royal Highnesses | Scylla and Char, adult sturdy mermaid twins with same facial structure and different pigmentation, argue cheerfully over jammed carriage. Interactive rope-and-wheel release. Proper coat/crown vs genuine goth velvet and silver. | **escort** accept their absurd royal proclamation; **question** twins' surprising appearance with curiosity. | The proclamation later helped one family but displaced another; Char's skull becomes unintended House evidence. |
| 4,3 | The Headsman Keeps a Manifest | Oren Pike, forever hooded, formidable axe and impeccable planning, wants to tally blankets before leaving. Pair cargo to passengers; tension interrupted by his insistence on lunch. | **plan** enlist route planning; **load** carry supplies for other travelers. | Dark Oren counts absences or guides survivors; later supplies, trust, and dialogue. |
| 3,5 | Pip and the Borrowed Voice | A talking stump uses courier's voice. Listen to three short claims; detect voice that's borrowed. Playful and creepy. | **light** expose voice with lantern; **listen** let the stump finish and risk a confession. | Dark wayfarer challenges the certainty of a helpful direction; Pip becomes a distinct witness. |
| 4,2 | Mosswick Sells Tomorrow | Real merchant stall, ledger with missing debtor. Audit entry against coin or promise; retain existing shop service. | **ledger** discover blank-name debt; **promise** take on verifiable future obligation. | Dark merchant trusts repayment or exact questions; prices/services change. |
| 1,4 | The Courier in Red | Courier in red hood and watchful wolf escort outside a grandmother's door. Inspect claw tracks, sealed contract and latch; monster could be guardian. | **inspect** terms privately; **knock** demand public answer together. | Witness safety, wolf alliance or resentment, Houses' testimony. Do not auto-tame guardian. |
| 2,6 | The Moss That Can Count | Leaf–leaf–sun stones are an orientation puzzle, not a rote password. Gardener asks who benefits if sun goes last. | **trace** sequence exactly; **listen** for intention. | Mirrored river reverses the puzzle; future Bureaucracy/Archive recognizes viewpoint changes. |
| 2,7 | Three Quiet Stones | Second physical glyph mechanism with one misleading correct-looking solution. Wrong route provides clue, not a reset. | **rehearse** timing; **question** whom light protects. | Late Archive reveals who authored the stones. Alternate clue access. |
| 3,2 | Vesper and the Unsent Map | Existing cartographer evolves into witty rogue/map-smuggler. A hole in map marks someone whom Vesper promised not to seek. Plot a safer route, trade collateral. | **ask** whose route was erased; **offer** wildflower for alternate map and lantern. | Dark rookery: Vesper sold a copy to rescue one person but endangered others. Later restitution or unreliable shortcut. |
| 5,4 | A Knight Who Mislaid His Oath | Brass Knight's shield reflects empty armor. Root mimic or mistaken enemy; compare oath, route, and real people endangered. | **truth** challenge false crossing; **errand** deliver apology. | Dark Knight keeps guarding a bridge never built. Labor, freedom and safe roads remain at stake. |
| 6,4 | Pip Delivers a Contradiction | Two contradictory orders from same authority. Match seals and destinations, decide what to carry first. | **carry** apology and leave warning unread; **read** warn Vault of destruction. | Dark neighborhoods physically overlap; neither contradiction is erased. |
| 2,5 | Photograph: Dismissal | Morrow, occupying hero's Earth body, leaves research office dismissed. Compare photo date and real observations. Bitter vindication tinged with fear. | **archive** exact evidence; **grieve** admit home's loss and uncertainty. | Second shadow reveals unseen assistance. Don't spoil Morrow's later loved ones or children. |
| 6,3 | The Vault Hears Everything | Names carved over one another at threshold. Bell/record puzzle asks if testimony needs public disclosure. | **remember** copy names; **protect** preserve privacy. | Dark doorbells recognize consent. Archive later makes disclosure or absence physical. |
| 6,2 | House That Remembers | Thirty-six-room playable House: puzzles, monsters, witnesses, Warden, Memory Hearth and Bramble Chime. Not one-tap verdict. | Existing HD-35 **release** / **renew** / **break**: return memories, revocable stewardship, or destroy compulsory custodianship. | **MAJOR 1: memoryCustody**; unique infrastructure and witness consequences in later worlds. |
| 8,4 | Thorn Gate | Reach using Bramble Chime. Wooden oracle wants sacrifice for quick passage; gate physically reflects Memory Hearth choice. | Existing **wait** for earned passage / **promise** return with a story. | Regional promise only. Gate ratifies the House's major choice, not another independent world fork. |


**Emotional rhythm:** a generous, mischievous and increasingly dangerous fairy-tale road: wonder, comedy, trust, fear, surprising gentleness, then costly responsibility. The shared caravan should feel alive: Scylla proud yet warm, Char sarcastic and perceptive, Oren terrifyingly professional, Vesper helpful and untrustworthy for understandable reasons, Pip lively and exhausted. Present enough contradictions that the player genuinely loves these people without reliably agreeing with them.

The other 44 standard scenes remain present: wandering Briar Hound that might protect rather than hunt, mischievous lantern-eating Candlejaw, root mimics that can be observed or negotiated with, ghostly Lost Procession with one living traveler, storm anomalies, orchard caretakers, hidden bargains, minor scenes that make later quests richer. Wandering encounters spawn at **valid connected, already-discovered spaces**, have clear warning/retreat, fixed seeded state per run and a cooldown. They must never substitute for the square's authored content or permit unlimited resource farming.

## 4. World 02: 16 featured encounters (of 60)

Dark Briar reuses geography, not identical morality. It remembers a choice's consequences, including benefits, unintended harms and people who have their own interpretation. Where first-world people return, their personalities survive the change of reality.

| Square | Encounter | Interactive challenge / emotional beat | Approaches and outcomes | First callback and lasting echo |
| --- | --- | --- | --- | --- |
| 2,4 | Camp That Knows You | Camp under glass bell; exhausted courier holds two shadows. Mirror the first-world lantern decision and identify who actually bore the debt. | **listen** to creditor; **name** offer identity as evidence. | Courier becomes messenger or refuses; moral stakes before Warden. |
| 3,4 | Courier Who Received Both Letters | Both conflicting royal orders were carried out. Sort two seals/receipts; blame shifts away from delivery worker. | **trace** issuing authority / **shelter** threatened courier. | Different path to justice, confidentiality or public testimony. |
| 4,4 | Princesses Who Disagree with Your Memory | Scylla's rescue stranded someone; Char's joke skull matches a sinister window mark. Humor gives way to blame and care. | **scylla** examine emergency ledger / **char** trust accidental warning. | Scylla accepts error without losing warmth, Char gains agency without becoming doomed sister. |
| 4,3 | Oren's Ledger of Absences | Oren's axe lies across bridge against stampede. Pair passengers with counted seats and destinations; Oren has tallied two versions correctly. | **counts** find missing travelers / **rescue** spend supplies to guide them. | Later valid evidence versus working route; no Oren-as-villain simplification. |
| 5,3 | Manifest of Lost Tomorrows | Unpaid workers are paid for erased futures. Compare payroll with actual persons' testimony. | **publish** wages / **audit** source confidentially. | Restitution vs privacy, later Market and Archive. |
| 5,4 | Knight at the Wrong Bridge | Queue forms for bridge never constructed because polite Knight keeps watch. Physical plank-routing challenge. | **draw**/build real bridge / **release** knight from promise. | Movement changes materially, and work or rescue remains after brave speech. |
| 6,4 | Two Orders of the Crown | Two neighborhoods occupy one square, both with valid documents. Mediation puzzle about resources, not selecting the real citizens. | **mediate** residents / **trace** Reimaginer instruction. | Future-Earth overlap laws and conflicting transit permits. |
| 6,3 | House Has an Ear | Carved names now doorbells; ringing forces an appearance. Sound-and-symbol puzzle differentiates consent from evidence. | **consent** ask before summons / **records** copy without ringing. | Eight witnesses attainable through both, with different trust. |
| 6,2 | Unremembered House | 36-room mirrored dungeon. Eight **ordinary** witnesses, six evidence-duels, five deductions and Warden confrontation. Gradual emotional crescendo. | House HD-35 **return** memories to owners / **commons** create revocable shared testimony. | **MAJOR 2: crossingAccord** controlling consent for future portal and shared identity passage. |
| 2,5 | Photograph with Two Shadows | Earth dismissal photo now shows second shadow trying to help. Examine objective composition rather than assuming motive. | **question** who took photo / **preserve** both shadows. | Morrow POV in 03 introduces compassion without excusing initial theft. |
| 2,6 | Rune That Reads Backward | Sun-leaf-leaf is the same inscription seen from other shore. Player rotates carved stones. | **reverse** solve other orientation / **guide** make two-sided clue. | Perspective puzzle recurs in world 04 and Archive. |
| 3,6 | Cache That Already Paid | Flower treasure bought medicine for stranger who never knew hero helped. Follow tangible receipt. | **follow** beneficiary / **honor** anonymity. | Gratitude vs protecting a private person; no compulsory hug reward. |
| 4,6 | People the Warden Forgot | Three witness accounts disagree about monsters but agree the House charged each. Sort shared facts. | **hear** all three / **protect** elect spokesperson. | One of eight needed nonseal witnesses; supports either House verdict. |
| 4,5 | Bridge That Never Burned | Ash below a bridge never built. Place timbers or investigate rumor's cause. | **build** safe crossing / **study** prophecy. | New road vs new evidence; scenic geography truly changes. |
| 3,5 | Traveler Who Took Other Road | Wayfarer now holds memory of life where your apparently helpful direction did not hurt them. | **apologize** own the loss / **ask** what they want today. | Restitution can be accepted or declined; later revisitation matters. |
| 3,2 | Rookery of Unsung Names / Vesper returns | Rookery retains its authored witness scene. Vesper sold a missing route to save someone, accidentally exposed others. A real betrayal with real limits. | Keep scene **verify/honor**; layer earned Vesper decision: **public accountability** or **confidential restitution**. | In Transit Vesper can aid you, compete, or seek redemption, shaped by this and original barter. |


**World 02 secondary events:** a Lantern Stag bearing other people's witness-light (hunt, guide, release at owner's request); Unsworn guards still following orders after losing their employer (match duties to actual people, fight, withdraw, offer accountable work); Candlejaw now potentially helpful against living flame; speech-rain exposing a confidential witness; Oren calmly calculating delays for an impossible downpour while Scylla and Char bicker lovingly. Add physical rewards, changed routes and mixed feelings, not mandatory fights on every tile.

**Vesper's betrayal is earned, not randomized.** In World 01 the map-smuggler sells an alternate route while hiding the name of a person they promised not to find. In World 02 they have sold a duplicate map to rescue that person, accidentally giving exploiters a road toward displaced residents. Public accountability can protect the vulnerable residents yet expose the rescued friend's whereabouts; confidential restitution may repair the damage yet keep exploiters unnamed. Both create future callbacks; no flimsy laugh-and-disappear betrayal.

## 5. Bounded consequence matrix

These states derive from the player's actual earlier chosen `sceneChoices` / `house.decisions` / `dark.sceneChoices` / `darkHouse.decisions`, plus small persisted monster facts where required. They are **not** sixteen independent worldframes. At most **two minor callbacks** render in one future encounter, selected by character relevance, clear player recollection and immediate stakes.

| Moment | Choice/source | World 02 replay | Later meaning |
| --- | --- | --- | --- |
| courier aid | e01(2,4) lend/copy | e02(2,4) whose memory pays | e06/e11 delivery/pass benefit |
| twin impression | e01(4,4) escort/question | e02(4,4) proclamation consequences | e05/06 court and personal trust |
| Oren method | e01(4,3) plan/load | e02(4,3) tally/rescue | e11 route logistics, viable escape |
| Pip voice | e01(3,5) light/listen | e02(3,5) speaker trust | e13 preserved testimony |
| Vesper bargain | e01(3,2) ask/offer | e02(3,2) sold map and loyalty | e11 permit route or scam restitution |
| wolf agency | e01(1,4) inspect/knock | e02 guardian testimony | e07 Hearth shelter |
| rune logic | e01(2,6) trace/listen | e02(2,6) inverted order | e04 future-Earth signs |
| stone purpose | e01(2,7) rehearse/question | e02 second interpretation | e13 authorship |
| knight oath | e01(5,4) truth/errand | e02(5,4) material bridge work | e11 caravan movement |
| contradictory order | e01(6,4) carry/read | e02(6,4) neighbors overlap | e10 identity marketplace |
| Earth certainty | e01(2,5) archive/grieve | e02(2,5) second shadow | e03 Morrow sympathy |
| witness privacy | e01(6,3) remember/protect | e02(6,3) name bells | e13 witness disclosure |
| gate promise | e01(8,4) wait/promise | e02 crossing remembers debt | e15 Forge covenant |
| Vesper reparations | e02(3,2) public/private (new subscene) | e02 one repaired road or relationship scar | e11/e13 later betrayal/repair |
| wandering guardian | first genuine encounter aid/avoid/fight | e02 ally, adversary or unwilling witness | e07/11 physical rescue/warning |
| Dark House earned evidence | mirrored trial echoes/strain | e02 verdict costs | e13 archived proof or unproven claim |


### Authoring budget, including a 5–10 variant finale quest

The combinatoric trap is real: ten independent yes/no choices have **1,024 combinations**. Never hand-write that tree. One future major encounter has a shared playable layout and at most **10 reusable authored narrative units**: **1 base intro + 3 custody reactions + 2 crossing responses + 3 success/partial/failure consequences + 1 highest-priority relationship cameo**. Select branches by explicit saved choices. Compose **one** relevant NPC callback (sometimes two short ones if budget permits). These are **not** ten distinct quest locations or ten different routes, but ten components of one legitimately rich encounter. Commission unique generated art for **materially different physical outcomes** (perhaps 5–10 images), not each text-line combination.

For example, the World 09 sci-fi wish-market wage hearing is the same quest in all realities: with `release`, workers carry their own sealed records; with `renew`, an elected steward opens a shared cabinet; with `break`, the central archive has been dismantled and evidence moves hand to hand. Under `return`, a participant must open their own identity gate; under `commons`, consenting witnesses may co-sign. Vesper optionally appears if their prior debt matters. Success, compromised remedy and failure-with-rescue remain three *interesting* and playable results. The resulting state changes markets, relationships, access and art, without writing all combinations.

## 6. Four late-act seals: discovery plan through world 04

| Reserved first-map square | World 01 visual clue | World 02 reflected clue | World 03–04 recovery lead | Later matching counterpart |
| --- | --- | --- | --- | --- |
| 5,2 | Sleeping Sigil | Leaf/root asymmetry in northern soil | Dark inspection adds handprints; by e03 office object points to same notch | Bloom Orchard / Mirror Orchard later |
| 1,1 | North Star Twin | Seven-point star with missing notch | Reflected point differs; e04 altered stars/archived chart records original location | Lake Terrace later |
| 8,1 | Whitewing Cipher | Feather glyph missing one feather | Wet reflection shows phantom feather; e03/04 birds or photograph lead to NE menhir | Salt Cliffs later |
| 8,8 | Moonroot Knot | South-east braided root with one inverted loop | Shadow braid reverses; e04 mundane utility-tunnel motif points to first-world map | Moonwell Vale later |


**Testable schedule.** By the end of World 01, all **60 standard map locations** have an attainable reveal path and all four seal coordinates can be discovered or marked as missing. World 02 revisits/reshapes evidence but does not resolve the latter four. World 03 Morrow's Earth chapter supplies mundane physical objects, documents and maps that connect to seals. World 04's altered Earth provides stronger orientation evidence and an earned first-world recovery expedition. Completing World 04 should prove **four named, located seals in the Chronicle**, not that any later-world pair is already solved. World 04 progression must not soft-lock when early seal inspections were skipped; the recovery option is playable and its map travel is real.

**Important current-code work:** `BRIAR_CROSS_MAP_KEYS` already reserves four positions correctly in World 01. Dark Briar's 64 encounter scenes and use of (5,2) as an eight-witness site contradict the new capacity. The implementation patch needs its own save/migration tests, including already-completed 16-scene Dark saves, before calling 60+4 complete.

## 7. Production gates: writing, gameplay, artwork, tests

1. **Preserve canon and coordinates.** Count 60 normal squares and 4 inspectable cross-map seals on **each** reality; no wrong coordinates, ghost duplicates, skipped original waves, or unearned dark House witness gates. Keep the 36-room House versions and Bramble Chime/Thorn Gate flow.
2. **Make at least four featured overworld nodes per world actively playable** with positional puzzle, testimony logic, environmental construction or purposeful monster interaction. Nested memory matching belongs where it has a fictional role. Failures offer costs, partial progress or alternate routes rather than permanent lock.
3. **Make character presence repeat.** Scylla, Char, Oren and Vesper each have at least three distinct story turns across the two experiences, with a comic scene, a revealing emotional beat and a significant conflict/payoff. Morrow remains a compelling absent figure, not a one-note thief.
4. **Enact the two major choices.** Exhaustively simulate all six campaign frame combinations and meaningful first-two-world callbacks, with later-world physical state projections. Run compassionate, skeptical, opportunistic, blunt, playful and risk-averse routes. No one branch monopolizes all benefits.
5. **Queue and deliver unique art in parallel.** Audit actual ArtJob/ArtImage IDs; distinguish staged, accepted, rendered, delivered and in-use. Both 60-scene maps receive establishing image per site, consequence illustrations for materially different outcomes, two separate 32-image collectible sets, major character portraits and expression variants, monsters, cinematic map transitions and puzzle card-art. Missing images use honest temporary presentation without blocking gameplay.
6. **Krea 2 literalism.** Write *one single framed scene*: exact number of people, clothing, body position, objects, foreground/background, camera, light, material. Avoid negations, conditional prompts, metaphor, text about reading at small sizes, and multiple contradictory outcomes in one brief. Describe visual results, not an emotion the viewer is supposed to have. Examples:
   - **Royal carriage debut:** “Wide 16:9 hand-painted fantasy gouache. Two sturdy adult mermaid princesses with matching faces stand beside a wooden carriage stuck between two massive oak trees. Left princess wears navy riding coat, neat crown and long braid. Right princess wears layered black velvet, lace, silver rings and black eye makeup. A tall broad headsman wearing a full cloth hood holds an axe beside the rear wheel. Afternoon sun through forest branches, camera at wheel height.”
   - **Rogue duplicate map:** “Wide 16:9 painted gothic fairytale scene. Adult cartographer in weathered coat stands under rookery stairs with two copies of the same parchment map. Three sealed letters on plank desk. Two displaced adult travelers watch at right. Iron birdcage and white feather above doorway, cool violet light.”
   - **Bridge physically repaired:** “Wide 16:9 painted storybook scene. Newly built wooden bridge spans a dark river. Brass-armored knight holds tension rope while two adult workers carry a final plank. Covered wagon waiting across river. Mossy stones and warm lamp glow, three-quarter view from near bank.”
   - **Memory Hearth:** “Wide 16:9 fantasy gouache. Rootwood circular chamber with brass scale, eight amber witness lanterns suspended overhead, veiled Warden behind wooden desk, three villagers standing separately holding a glowing memory jar, brass key and snapped shackle. Purple moonlight through arches.”
7. **Cross-map discovery QA.** Simulate skipping one, two, three, or all four original seal positions; by end of World 04 the recovery expedition makes the four world-01 locations discoverable without granting counterpart matches. Test four different saved-state migrations including dark witness relocation.
8. **Console grade.** Single-screen camera/map, keyboard/gamepad/touch navigation, clear art, personal UI feedback, actual reusable mechanics. Art failure cannot hide choices; detailed story cannot become a mobile scroll-page app.
9. **Keep master #4136 open.** This spec authorizes iterative improvements, **not** a final human gate. Final acceptance only when all sixteen world experiences, alternative variants, real art delivery, and adversarial playtests have passed.

