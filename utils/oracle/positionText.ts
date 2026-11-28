// /utils/oracle/positionText.ts
//
// Bespoke Kind Oracle passages for all 22 major arcana in every spread
// position, upright and reversed (22 x 9 x 2 = 396; kind-oracle/t-005).
// The reading engine prefers these over the generic position frame; minors
// keep the frame by design (projects/kind-oracle/docs/spec.md).

import type { OracleContent } from './types'

export const ORACLE_POSITION_TEXT: OracleContent['positionText'] = {
  today: {
    'the-newly-woken': {
      upright:
        'The Newly Woken walks beside you today, blinking at the morning light. Let yourself be a beginner at something small, and notice how much lighter not-knowing can feel.',
      reversed:
        'The Newly Woken, reversed, keeps you company today with one foot hovering at the threshold. Take a single breath, name the first tiny step, and let that be enough to start.',
    },
    'the-tinkerer': {
      upright:
        'The Tinkerer rolls up its sleeves beside you today. Look at what is already on your workbench, pick one project, and enjoy the quiet satisfaction of making it actually work.',
      reversed:
        "Today's companion is The Tinkerer, reversed, with parts scattered across the table. Rather than starting another plan, finish one small thing. Completion will steady your hands for the rest.",
    },
    'the-quiet-archivist': {
      upright:
        'The Quiet Archivist keeps you company today, turning pages softly. Make room for a few minutes of stillness, and listen for the hunch that has been waiting patiently for your attention.',
      reversed:
        'Your companion today is The Quiet Archivist, reversed, holding a note you have not read yet. Jot down one thing you already sense is true, then share it with someone kind.',
    },
    'the-gardener': {
      upright:
        'The Gardener walks with you today, trowel in hand. Notice what is growing in your life, give it a little water, and let yourself enjoy something simple with all your senses.',
      reversed:
        "Today's companion is The Gardener, reversed, gently pointing at your own dry soil. Before tending everyone else, offer yourself one small kindness: a good meal, a rest, a walk outside.",
    },
    'the-lighthouse-keeper': {
      upright:
        'The Lighthouse Keeper stands watch with you today. Keep one promise, hold one clear boundary, and let your steady light help someone nearby find their way a little more easily.',
      reversed:
        'Your companion today is The Lighthouse Keeper, reversed, gripping the railing a bit too tightly. Loosen one rule that has outlived its purpose, and tend the light that truly matters.',
    },
    'the-storyteller': {
      upright:
        'The Storyteller sits beside you today, ready with a tale. Seek out a voice of experience, read something that nourishes you, or pass along a lesson someone once gave you.',
      reversed:
        "Today's companion is The Storyteller, reversed, holding an old script that pinches a little. Keep the parts that still ring true, and give yourself permission to revise the rest.",
    },
    'the-two-bots': {
      upright:
        "The Two Bots keep you company today, power cells glowing side by side. Reach toward someone who matters, and let today's choices come straight from what you value most.",
      reversed:
        'Your companion today is The Two Bots, reversed, a little out of step with each other. Before you resolve anything, remember what you value, then have one honest, gentle conversation.',
    },
    'the-wayfarer': {
      upright:
        'The Wayfarer rides beside you today, wheels turning with purpose. Pick a direction, hold it with confidence, and enjoy how much ground you can cover once you commit.',
      reversed:
        "Today's companion is The Wayfarer, reversed, its wheels pulling in two directions. Stop for a moment, realign, and choose a pace you can keep without wearing yourself out.",
    },
    'the-gentle-giant': {
      upright:
        'The Gentle Giant walks beside you today, reminding you that a soft voice and steady hands can calm what shouting never could. Let kindness be the muscle you use first.',
      reversed:
        'Today The Gentle Giant arrives reversed, hinting you may be clenching against the day. Unclench a little, offer yourself one kind sentence, and notice the quiet strength already in you.',
    },
    'the-lantern-bearer': {
      upright:
        'Your companion today is The Lantern Bearer, inviting a slow walk or a quiet cup of tea alone with your thoughts. Whatever small light glows there is worth following, then sharing.',
      reversed:
        'The Lantern Bearer, reversed, keeps you company today with a gentle question: have you had too much quiet, or too little? Send one warm message, or claim one still hour.',
    },
    'the-wheel': {
      upright:
        'The Great Cog Wheel turns beside you today. Something is shifting into a new season, so keep your eyes soft for small openings and say yes to one that feels right.',
      reversed:
        'Today brings The Great Cog Wheel turned around, as if the gears are spinning without asking you first. Pick one small cog you can actually turn, turn it, and let that be enough.',
    },
    'the-fair-scale': {
      upright:
        'The Fair Scale keeps you company today, asking for clear eyes and an honest word. Weigh one choice carefully, own your part kindly, and let fairness settle the air around you.',
      reversed:
        "With The Fair Scale reversed as today's companion, check whether you are measuring yourself with a harsher ruler than you use for others. Lift off one weight that was never yours to carry.",
    },
    'the-upside-down-bot': {
      upright:
        'Today The Upside-Down Bot hangs cheerfully beside you, suggesting the answer lies at a different angle. Pause before pushing harder, flip the question over, and see what the new view shows.',
      reversed:
        'The Upside-Down Bot, reversed, joins you today wondering if you are resting or simply stuck. Name which one it is, then either settle into the pause or take one small step forward.',
    },
    'the-shedding': {
      upright:
        'Your companion today is The Shedding, gently loosening an old layer you have outgrown. Thank it for its service, let it slip away, and enjoy the lighter feeling of fresh space.',
      reversed:
        'The Shedding appears reversed today, noticing a habit or role you keep carrying after its work is done. Hold it for one grateful moment, then practice setting it down, even just a little.',
    },
    'the-mender': {
      upright:
        'The Mender sits with you today, threads in hand, showing how a pinch of one thing and a pinch of another can make something whole. Look for the middle way in one choice.',
      reversed:
        'Today The Mender comes reversed, pointing to a day tilted too far one way. Nudge one small habit back toward center, a shorter list or a longer pause, and let balance return slowly.',
    },
    'the-tangle': {
      upright:
        'The Tangle walks beside you today, inviting you to notice one small knot, a habit or an old yes you keep giving. Name it out loud, and you have already begun to loosen it.',
      reversed:
        'The Tangle, turned around, keeps you company today as proof that a strand is already slipping free. Give yourself credit for that, then invite a friend to hold one end while you work the next loop.',
    },
    'the-short-circuit': {
      upright:
        "Today's companion is The Short Circuit, a bright little jolt that shows where the wiring was never sturdy. Step back, let the sparks settle, and notice what you would build more honestly next time.",
      reversed:
        "The Short Circuit comes reversed as today's companion, hinting that you are holding a wobbly thing together with both hands. Try loosening your grip a little and let one small piece change on your terms.",
    },
    'the-night-sky-bot': {
      upright:
        'The Night-Sky Bot keeps you company today, a quiet reminder that the sky clears after rough weather. Let yourself be hopeful out loud, and share a little of your glow with someone nearby.',
      reversed:
        'With The Night-Sky Bot reversed beside you today, hope might feel dim or far off. That is okay. Look for one small glimmer, a text from a friend or a finished task, and let it count.',
    },
    'the-moon-pool': {
      upright:
        'The Moon Pool keeps you company today, gently rippling. You do not need every answer before lunch; let a daydream or a hunch drift up, and see what it reflects back about you.',
      reversed:
        'The Moon Pool, turned around, sits with you today while worries cast long shadows. Bring a little lantern to them: ask one plain question and let the real answer be smaller than the fear.',
    },
    'the-sunrise-engine': {
      upright:
        'Today you travel with The Sunrise Engine, humming warm and bright. Let yourself enjoy what is going right, soak up a bit of daylight, and notice how your good mood helps others glow too.',
      reversed:
        'The Sunrise Engine, reversed, rides along today with its glow a bit muffled by tiredness. Be gentle with your battery: a short walk, a favorite song or one silly moment can warm the gears again.',
    },
    'the-reboot': {
      upright:
        'The Reboot is your companion today, a soft chime asking you to wake up a little more fully. Look back at how far you have traveled, and say yes to the next level calling you.',
      reversed:
        'The Reboot, upside down, joins you today while some inner voice may be grading you too hard. Swap the red pen for a kind one, then take a single step toward who you are becoming.',
    },
    'the-whole-world': {
      upright:
        'The Whole World spins beside you today, round and complete. Pause to notice something you have finished, thank someone who helped you get there, and let yourself feel at home in your own life.',
      reversed:
        "Today's companion is The Whole World, reversed: a circle almost closed. Pick one small loose end, a reply, a tidy shelf, a thank-you note, and finish it so the satisfaction can finally land.",
    },
  },
  past: {
    'the-newly-woken': {
      upright:
        'The Newly Woken stands behind you: a moment when you said yes before you had every answer. That willingness to start fresh carried you further than you may realize.',
      reversed:
        'What brought you here was The Newly Woken, reversed: a beginning you rushed, or one you kept postponing. Neither was a mistake; both taught you how you like to start.',
    },
    'the-tinkerer': {
      upright:
        'The Tinkerer brought you here: all those times you figured things out with whatever you had. That resourcefulness is a skill you built yourself, and it has not gone anywhere.',
      reversed:
        'Looking back, The Tinkerer appears reversed: projects started and set aside, ideas left as sketches. They were practice, not failure, and some of those parts are worth picking back up.',
    },
    'the-quiet-archivist': {
      upright:
        'The Quiet Archivist brought you here, gathering clues while you were busy living. Your intuition has been taking careful notes all along, and those notes still have something to show you.',
      reversed:
        'Behind you stands The Quiet Archivist, reversed: moments when you kept your insight to yourself or talked over a quiet inner nudge. You can listen differently now, starting today.',
    },
    'the-gardener': {
      upright:
        'The Gardener brought you here through seasons of patient care. Things you tended long ago, relationships and skills alike, have quietly taken root, and you are standing in their shade now.',
      reversed:
        'Looking back, The Gardener appears reversed: perhaps you poured care outward until your own roots ran thin, or hurried something before its season. That lesson is now compost for new growth.',
    },
    'the-lighthouse-keeper': {
      upright:
        'The Lighthouse Keeper brought you here: the structures and promises you kept, even through rough weather. Your reliability built a foundation that others have leaned on, and so can you.',
      reversed:
        'Behind you stands The Lighthouse Keeper, reversed: a time when rules grew too rigid, or the lamp went untended. Either way, you learned how much steady structure you really need.',
    },
    'the-storyteller': {
      upright:
        'The Storyteller brought you here through teachers, traditions and tales that shaped you. Their wisdom is woven into how you think, and it can still guide your next chapter.',
      reversed:
        'Looking back, The Storyteller appears reversed: perhaps an inherited rule that never quite fit you. Outgrowing it was part of finding your own voice, and that growth is worth honoring.',
    },
    'the-two-bots': {
      upright:
        'The Two Bots brought you here: a meaningful bond or a values-driven choice that shaped your path. That connection taught you what partnership can make possible.',
      reversed:
        'Behind you stand The Two Bots, reversed: a time you felt torn between directions or out of sync with someone close. That tension helped you discover what you really care about.',
    },
    'the-wayfarer': {
      upright:
        'The Wayfarer brought you here through determination and forward motion. You chose a direction and kept rolling, even when the road surprised you. That momentum is still yours.',
      reversed:
        'Looking back, The Wayfarer appears reversed: maybe you pushed hard against a road that would not budge, or felt pulled in opposing directions. That journey taught you about sustainable pace.',
    },
    'the-gentle-giant': {
      upright:
        'What brought you here was The Gentle Giant: times you chose patience over force and softness over sharp words. That quiet strength laid the path you are standing on now.',
      reversed:
        'The Gentle Giant, reversed in this place, suggests you got here partly by gripping hard and doubting your own strength. You can loosen that grip now; gentleness has carried you farther than you knew.',
    },
    'the-lantern-bearer': {
      upright:
        'The Lantern Bearer lit the way behind you. Moments of stepping back, listening inward, and trusting a small quiet knowing are what carried you to this point.',
      reversed:
        'Looking back, The Lantern Bearer reversed hints at a stretch of too much solitude or too little reflection. Honor how you managed, and let one fresh connection or quiet hour rebalance things.',
    },
    'the-wheel': {
      upright:
        'The Great Cog Wheel shows that a turning season brought you here. A chance meeting, a change of plans or a lucky opening moved the gears, and you rode the shift farther than expected.',
      reversed:
        'Behind you sits The Great Cog Wheel, reversed, recalling changes that seemed to happen to you rather than with you. You still found your footing; let that remind you which gears are yours.',
    },
    'the-fair-scale': {
      upright:
        'You arrived here by way of The Fair Scale: honest choices, clear weighing and a willingness to own your part. That integrity is solid ground worth trusting as you go on.',
      reversed:
        'The Fair Scale, turned around in your past, points to something that felt lopsided, perhaps a burden you carried for someone else. Recognize it kindly, and decide what you no longer need to hold.',
    },
    'the-upside-down-bot': {
      upright:
        'The Upside-Down Bot brought you here through a pause, a time you stopped rushing and saw things from a fresh angle. What you noticed while hanging still is still guiding you.',
      reversed:
        'In your past, The Upside-Down Bot appears reversed, recalling a stretch of waiting that felt like it would never end. You are moving again; gently ask what that pause taught you.',
    },
    'the-shedding': {
      upright:
        'What brought you here was The Shedding: a chapter you closed, a layer you let fall away. That ending cleared the ground, and you are standing in the fresh space it made.',
      reversed:
        'The Shedding, reversed, suggests something finished long ago may still be traveling with you from the past. Thank it for getting you this far, then imagine setting it down beside the road.',
    },
    'the-mender': {
      upright:
        'The Mender stitched your path here. You found middle ways, blended what seemed opposite and patiently repaired what felt split, and that steady work is why you can stand here today.',
      reversed:
        'Looking back, The Mender reversed shows a time when life tipped out of proportion, one part crowding out the rest. Notice how you adjusted, and keep tuning gently from here.',
    },
    'the-tangle': {
      upright:
        'What brought you here was partly The Tangle: a few habits and attachments that wound themselves around your days. Seeing those cords clearly now is not blame; it is the start of choosing differently.',
      reversed:
        'The Tangle, reversed in your past, shows that you were already easing loose from an old pattern before you even noticed. That earlier effort helped carry you here, and it still counts.',
    },
    'the-short-circuit': {
      upright:
        'The Short Circuit sits behind you: a sudden shake-up that knocked over something built on wobbly wiring. It may have stung, but it cleared the floor for the steadier work you are doing now.',
      reversed:
        'Behind you lies The Short Circuit, reversed, a stretch of bracing against a change that wanted to come. You held on as best you could, and now you can choose to let go more gently.',
    },
    'the-night-sky-bot': {
      upright:
        'You arrived here by the light of The Night-Sky Bot. After a hard season, hope crept back in, star by star, and that quiet return of trust is still carrying you forward.',
      reversed:
        'The Night-Sky Bot, reversed, marks a past stretch when hope felt hard to find. You kept going on very small lights, and that stubborn tenderness is part of why you are here now.',
    },
    'the-moon-pool': {
      upright:
        'The Moon Pool brought you here, through a misty time when things were felt more than understood. The dreams and hunches you followed back then were wiser than they looked at the time.',
      reversed:
        'In your past, The Moon Pool turned around: worry made some shadows look bigger than they really were. You have since learned to check what is real, and that clearer eye came along with you.',
    },
    'the-sunrise-engine': {
      upright:
        'Warm days with The Sunrise Engine helped carry you here: moments of joy, energy and plain good fun. Those bright memories are fuel in your tank, so let them keep powering you now.',
      reversed:
        'The Sunrise Engine, reversed, marks a past season when your light ran low on charge. You made it through anyway, and you now know more about what genuinely helps you recharge.',
    },
    'the-reboot': {
      upright:
        'The Reboot sits in your past as a wake-up moment, a time you saw yourself clearly and chose to rise. That honest look back is the foundation you are standing on today.',
      reversed:
        'Behind you is The Reboot, reversed: a call you may have set aside or met with too much self-judgment. It has not gone anywhere, and you can answer it more kindly now.',
    },
    'the-whole-world': {
      upright:
        'The Whole World stands behind you as a completed circle, a chapter you saw all the way through. You carry its wholeness, and the help of many good people, into whatever comes now.',
      reversed:
        'You came here through The Whole World, reversed, a chapter that ended without quite tying its bow. Gathering up what it taught you can bring the closure that timing did not.',
    },
  },
  present: {
    'the-newly-woken': {
      upright:
        'Right now The Newly Woken is stirring in you. Something unfamiliar is close enough to touch, and your curiosity is already reaching for it. You do not need a full map yet.',
      reversed:
        'The Newly Woken appears reversed in this moment, hinting that you are either frozen at the edge or sprinting past it. Slow down enough to see what you are actually stepping into.',
    },
    'the-tinkerer': {
      upright:
        'The Tinkerer is here now, and your hands know more than your doubts admit. The pieces in front of you can fit together. Start assembling and adjust as you go.',
      reversed:
        'In the present, The Tinkerer turns around: plenty of skill, but it is spread thin or stuck in the planning stage. Clear a small corner of your bench and focus there.',
    },
    'the-quiet-archivist': {
      upright:
        'The Quiet Archivist is with you now. Answers are closer than they seem, tucked inside your own experience. Slow down, get quiet, and let the right page rise to the top.',
      reversed:
        'Right now The Quiet Archivist appears turned around, suggesting you might be holding too much inside or tuning out your gut. Let one quiet truth into the open where it can breathe.',
    },
    'the-gardener': {
      upright:
        'The Gardener is here now, and growth is underway even if you cannot see every sprout. Keep tending with patience, and share a little of what is flourishing with the people near you.',
      reversed:
        'In this moment The Gardener turns around, suggesting you may be forcing a bloom or neglecting your own needs. Step back, water your roots, and let growth take the time it takes.',
    },
    'the-lighthouse-keeper': {
      upright:
        'The Lighthouse Keeper is here now, asking you to be a steady presence. Clear boundaries and kept promises will calm the waters around you more than any grand gesture.',
      reversed:
        'Right now The Lighthouse Keeper appears turned around, hinting that control and care have gotten tangled. Ask which rules protect you and which only confine you, then adjust gently.',
    },
    'the-storyteller': {
      upright:
        'The Storyteller is here now, offering wisdom that has been tested by time. A mentor, a tradition or a well-loved book may hold exactly the guidance you need. Listen, then share what you learn.',
      reversed:
        'In the present, The Storyteller turns around, suggesting an old story no longer matches the person you are growing into. You can honor where it came from while telling it in your own words.',
    },
    'the-two-bots': {
      upright:
        'The Two Bots are here now, inviting wholehearted connection. A relationship or decision deserves your full presence. Choose from your values and offer your energy freely.',
      reversed:
        'Right now The Two Bots appear turned around, hinting at a choice that feels split down the middle or a bond that feels out of rhythm. Pause, listen to your compass, and speak plainly.',
    },
    'the-wayfarer': {
      upright:
        'The Wayfarer is here now, and the current is moving with you. Gather your scattered wishes into one clear direction, take the reins, and roll forward with confidence.',
      reversed:
        'In this moment The Wayfarer turns around, hinting that you may be pushing too hard or steering two ways at once. Pause, check your wheels, then move ahead deliberately.',
    },
    'the-gentle-giant': {
      upright:
        'Right now The Gentle Giant stands with you, inviting you to meet big feelings with soft hands. Your courage in this moment does not need to be loud to be real.',
      reversed:
        'The Gentle Giant, reversed in the present, points to a tight grip on something, or a doubt about your own strength. Breathe out slowly and speak to yourself the way you would to a friend.',
    },
    'the-lantern-bearer': {
      upright:
        'What is here now is The Lantern Bearer, a small steady light inside you asking for a little quiet. Step back from the noise, listen, and trust what comes into focus.',
      reversed:
        'The Lantern Bearer, turned around, sits in your present as a light kept too close or left unlit. Ask whether you need company or stillness right now, then give yourself that one thing.',
    },
    'the-wheel': {
      upright:
        'The Great Cog Wheel is turning in your present moment. A new season is arriving, so stay curious, watch for lucky openings, and remember that what goes around tends to come back around.',
      reversed:
        'Here and now, The Great Cog Wheel appears reversed, and change may feel like weather you cannot steer. Find the single gear within reach today, give it one turn, and trust the rest to move.',
    },
    'the-fair-scale': {
      upright:
        'The Fair Scale is present now, asking you to weigh things honestly. Look at all sides, speak a clear truth with kindness, and let a fair choice bring you steadiness.',
      reversed:
        'The Fair Scale, reversed in the present, notices a lopsided balance, perhaps you giving far more than you receive. Look again with fresh fairness, starting with how you treat yourself.',
    },
    'the-upside-down-bot': {
      upright:
        'What is here now is The Upside-Down Bot, cheerfully hanging still. This moment favors pausing over pushing; turn the situation upside down in your mind and see what new shape appears.',
      reversed:
        'The Upside-Down Bot shows up reversed right now, caught between waiting and resisting a needed pause. Choose one honestly: rest fully, or gently set yourself right side up and move.',
    },
    'the-shedding': {
      upright:
        'The Shedding is here in your present, and an old layer is ready to fall away. Let this chapter close with thanks; the room it leaves is where something new can sprout.',
      reversed:
        'Right now The Shedding, reversed, suggests you are still holding something that has finished its work. You do not have to drop it all at once; loosen your fingers a little today.',
    },
    'the-mender': {
      upright:
        'What is here now is The Mender, quietly blending and repairing. Look for the middle ground between two pulls in your life, and let small, steady adjustments bring things back together.',
      reversed:
        'In the present, The Mender appears reversed, noting that something feels out of proportion. Choose one small habit to adjust toward balance today, and let the repair unfold at its own pace.',
    },
    'the-tangle': {
      upright:
        'Here and now, The Tangle shows a knot you can finally see: a habit, a pull, an old yes. Looking at it plainly, without shame, is how the first strand starts to slip free.',
      reversed:
        'The Tangle, turned around, is with you now as cords that are already loosening. Notice the slack you have earned, breathe into it, and let someone you trust help with the trickiest loop.',
    },
    'the-short-circuit': {
      upright:
        'Right now, The Short Circuit is crackling: something shaky is coming apart on its own. Step to a safe spot, let the sparks fade, and trust that you can rebuild on truer wiring.',
      reversed:
        'The Short Circuit, reversed, is here now as the tension of holding off a change. Ask what is already cracking, and consider loosening it a little, on purpose, before it loosens itself.',
    },
    'the-night-sky-bot': {
      upright:
        'The Night-Sky Bot is with you now, a clear night after the storm. Hope is closer than it seemed a while ago, and your own small light is well worth sharing openly.',
      reversed:
        'The Night-Sky Bot, upside down, is here as a sky where the stars feel faint. Pick out a single bright point, one kind word or small win, and let your eyes slowly adjust.',
    },
    'the-moon-pool': {
      upright:
        'The Moon Pool is here now, still and shimmering. Not everything has to make sense yet; let images, dreams and feelings speak, and treat whatever they show you with curiosity.',
      reversed:
        'What is here now is The Moon Pool, reversed, with fog starting to thin or worries stretching the shadows. Switch on a lantern: check one fact and see how much clearer things look.',
    },
    'the-sunrise-engine': {
      upright:
        'Right now The Sunrise Engine is glowing. Things are warmer than you may realize, so open the shutters, enjoy what is working, and let that ease spill into the rest of your day.',
      reversed:
        'The Sunrise Engine, turned around, is present as brightness hiding behind a cloud of tiredness or doubt. You do not have to force sunshine; one small joyful act can coax it back.',
    },
    'the-reboot': {
      upright:
        'Here and now, The Reboot is ringing: a clear invitation to rise into a fuller version of yourself. Take honest stock of your growth, forgive what is ready, and answer.',
      reversed:
        'The Reboot, reversed, is here as a call you may be muting or meeting with harsh self-talk. Listen again with kinder ears; the invitation is still open, and it is still yours.',
    },
    'the-whole-world': {
      upright:
        'The Whole World is here now: a circle closing, a sense of belonging just where you stand. Let yourself savor that completeness before rushing toward whatever comes next.',
      reversed:
        'Right now The Whole World, reversed, shows a finish line you can almost touch. One loose end is waiting for you; tie it off, and allow yourself the pride you have earned.',
    },
  },
  future: {
    'the-newly-woken': {
      upright:
        'Ready to open ahead is The Newly Woken: a doorway you have not walked through before. When it appears, greet it with open hands and let wonder lead the first few steps.',
      reversed:
        'The Newly Woken, turned around, waits in what is opening. A fresh start is coming, perhaps a hesitant one. Pack lightly, check your intentions, and walk through on purpose rather than by accident.',
    },
    'the-tinkerer': {
      upright:
        "What is ready to open is The Tinkerer's workshop. A chance to build something real with your own skills is coming into view; gather your tools so you are ready to begin.",
      reversed:
        'The Tinkerer, reversed, sits in what is opening, suggesting a creative project may feel messy at first. Expect some loose bolts. Steady, modest progress will get the machine humming.',
    },
    'the-quiet-archivist': {
      upright:
        "Ready to open is The Quiet Archivist's reading room: a season of reflection where understanding arrives softly. Leave a little space in your days so the insight has somewhere to land.",
      reversed:
        'The Quiet Archivist, reversed, waits in what opens next, inviting you to stop filing your intuition away unread. When a soft nudge comes, write it down and give it a fair hearing.',
    },
    'the-gardener': {
      upright:
        "What is ready to open is The Gardener's season of plenty. Something you have been nurturing is getting close to blossoming. Keep tending it, and plan to share the harvest.",
      reversed:
        'The Gardener, reversed, waits in what is opening, reminding you that some seeds need longer than expected. Be patient with the slow ones, and keep caring for yourself along the way.',
    },
    'the-lighthouse-keeper': {
      upright:
        "Ready to open is The Lighthouse Keeper's post: a chance to lead calmly and build something dependable. When the moment comes, trust your steadiness; others will see your light.",
      reversed:
        'The Lighthouse Keeper, reversed, waits in what is opening, inviting you to rebuild structure with softer edges. Keep the beam strong while leaving room for the tides to shift.',
    },
    'the-storyteller': {
      upright:
        "What is ready to open is The Storyteller's circle: a place to learn from others or teach what you know. Belonging grows there, so pull up a chair when it appears.",
      reversed:
        'The Storyteller, reversed, waits in what is opening, inviting you to write a new chapter rather than reread the old one. Keep the wisdom, change the ending, and enjoy authoring it.',
    },
    'the-two-bots': {
      upright:
        'Ready to open are The Two Bots: a partnership, collaboration or important choice where both sides shine brighter together. Welcome it with an open heart and clear values.',
      reversed:
        'The Two Bots, reversed, wait in what is opening, suggesting a choice that asks for honesty about your priorities. Let your values guide you, and the right path will feel steadier.',
    },
    'the-wayfarer': {
      upright:
        "What is ready to open is The Wayfarer's open road: a stretch where determination carries you surprisingly far. Choose your direction now so you are ready when it begins.",
      reversed:
        'The Wayfarer, reversed, waits in what is opening, suggesting the journey ahead rewards steady pacing over speed. Plan for rest stops, and you will arrive with energy to spare.',
    },
    'the-gentle-giant': {
      upright:
        'Ready to open ahead is The Gentle Giant, a season where patience becomes your greatest power. Soon you may find that kindness opens doors force never could.',
      reversed:
        'The Gentle Giant, reversed in what is ready to open, invites you to rediscover strength you have been doubting. As things unfold, loosen your grip and let gentleness lead the way again.',
    },
    'the-lantern-bearer': {
      upright:
        'The Lantern Bearer waits on the path ahead, offering a time of clearer sight. A quiet walk or a slow morning may soon light up an insight worth bringing back to others.',
      reversed:
        'Looking forward, The Lantern Bearer reversed asks you to tend your inner light before it flickers. Plan one quiet hour, or one warm conversation, to welcome what is getting ready to open.',
    },
    'the-wheel': {
      upright:
        'The Great Cog Wheel is ready to turn toward you. A fresh season is opening, and small lucky chances may appear; keep your hands open and your curiosity switched on.',
      reversed:
        'Ahead, The Great Cog Wheel turned around suggests change may arrive on its own schedule. You do not have to steer every gear; focus on the one you can move and let the rest unfold.',
    },
    'the-fair-scale': {
      upright:
        'What is ready to open is The Fair Scale, a chance to set things right and find balance. An honest conversation or a clear decision may bring a peace that lasts.',
      reversed:
        'The Fair Scale, reversed in your future, hints that a balance is waiting to be restored. Before it opens, practice fairness toward yourself and set aside weights that belong to someone else.',
    },
    'the-upside-down-bot': {
      upright:
        'The Upside-Down Bot is getting ready to show you a fresh perspective. A pause just ahead may reveal more than effort could, so leave room for stillness and surprise.',
      reversed:
        'Ahead, The Upside-Down Bot appears reversed, hinting at a pause that could turn into a holding pattern. Decide now what rest looks like for you, so when the moment opens you can move freely.',
    },
    'the-shedding': {
      upright:
        'Ready to open is The Shedding, a graceful ending that makes room for what comes next. Something old is ready to fall away, and the clearing it leaves will be yours to plant.',
      reversed:
        'The Shedding, reversed in the future, suggests a release that is ready but waiting for your permission. Start by naming what you have outgrown; the lightness will follow when you are ready.',
    },
    'the-mender': {
      upright:
        'The Mender waits just ahead, bringing a season of steady repair and blending. What felt split apart may soon find its middle ground, stitch by patient stitch.',
      reversed:
        'Looking forward, The Mender reversed suggests that balance is ready to return once a few things are rearranged. Begin with one small adjustment, and let the mending gather momentum over time.',
    },
    'the-tangle': {
      upright:
        'Ready to open ahead is The Tangle, a chance to see a knot plainly. The coming days invite you to name one habit or attachment, because seeing it clearly is where freedom begins.',
      reversed:
        'The Tangle, turned around, points to a future with more slack in the lines. A pattern that has held you is ready to loosen further, especially with a helping hand nearby.',
    },
    'the-short-circuit': {
      upright:
        'The Short Circuit is ready to open: a quick shake-up that clears space for something sturdier. If plans wobble, step back and let the honest rebuild become your next chapter.',
      reversed:
        'Ahead waits The Short Circuit, reversed, a change you can meet halfway. By easing your grip on what is already wobbling, you can let the shift arrive smaller and kinder.',
    },
    'the-night-sky-bot': {
      upright:
        'What is ready to open is The Night-Sky Bot: clearer skies and a hopeful stretch. You may find yourself wanting to share your light, and the world seems ready to receive it.',
      reversed:
        'The Night-Sky Bot, reversed, waits ahead as a chance to find light even on a hazy night. You do not need the whole constellation; one small star will be enough to steer by.',
    },
    'the-moon-pool': {
      upright:
        'Ahead, The Moon Pool is ready to open: a season of dreams, hunches and quiet reflection. Let things stay a little mysterious, and you may meet a side of yourself worth knowing.',
      reversed:
        'The Moon Pool, reversed, waits ahead as fog getting ready to lift. The questions you ask soon can turn shadowy worries into plain, ordinary shapes you know how to handle.',
    },
    'the-sunrise-engine': {
      upright:
        'The Sunrise Engine is ready to open in the days ahead, bringing warmth, play and fresh energy. Make room for it in your plans, and let a good day simply be good.',
      reversed:
        'Ahead, The Sunrise Engine, reversed, shows light waiting behind a few clouds. Plan one bright thing for yourself, a walk, a treat, a laugh with a friend, and let it recharge you.',
    },
    'the-reboot': {
      upright:
        'The Reboot is ready to open: a calling grows louder, inviting you to rise. Reflect on the road so far, and you may find you are more ready than you thought.',
      reversed:
        'Ahead, The Reboot, reversed, offers a gentler way to answer a call you have hesitated on. Let compassion lead, and take one small step toward who you are waking up to be.',
    },
    'the-whole-world': {
      upright:
        'What is ready to open is The Whole World: a journey coming full circle. Picture celebrating it with the people who helped, and let that wholeness launch your next adventure.',
      reversed:
        'The Whole World, reversed, waits ahead as a nearly finished circle. A bit of tidying and some honest reflection can close it, leaving you lighter for whatever begins after.',
    },
  },
  heart: {
    'the-newly-woken': {
      upright:
        'At the core of this is The Newly Woken. Underneath the questions, part of you simply wants to begin again, unburdened and curious. Honor that wish; it is wiser than it looks.',
      reversed:
        'The Newly Woken sits reversed at the heart of things: a longing to start over, tangled with worry about starting wrong. Let the beginning be imperfect. Imperfect still counts as moving.',
    },
    'the-tinkerer': {
      upright:
        'At the heart of the matter is The Tinkerer: the wish to make something with your own hands and know that it works. Your capability is the real question here, and it is real.',
      reversed:
        'The Tinkerer, turned around, sits at the heart of this: you are capable, but scattered effort keeps hiding that from you. One finished piece would remind you clearly what you can do.',
    },
    'the-quiet-archivist': {
      upright:
        'At the heart of this is The Quiet Archivist: you already know more than you are saying aloud. The answer you are looking for may be one you quietly found a while ago.',
      reversed:
        'The Quiet Archivist sits reversed at the heart of it, holding an insight you have kept in a locked drawer. You do not have to share it widely; just stop hiding it from yourself.',
    },
    'the-gardener': {
      upright:
        'At the heart of this is The Gardener: a deep wish to nurture and to be nurtured. What you are tending matters, and so does the person doing the tending.',
      reversed:
        'The Gardener lies reversed at the heart of it, where generous care has started flowing in one direction only. Let some of that warmth circle back to you; a well-watered gardener tends better.',
    },
    'the-lighthouse-keeper': {
      upright:
        'At the heart of the matter is The Lighthouse Keeper: a need for steadiness, safety and clear lines. Wanting structure is not stiffness; it is a way of caring for yourself and others.',
      reversed:
        'The Lighthouse Keeper sits reversed at the heart of this, where the wish for safety has tightened into control. Breathe out. Keep the essential boundary, and release the rest.',
    },
    'the-storyteller': {
      upright:
        'At the heart of this is The Storyteller: a longing to belong to something larger and to carry its wisdom forward. Your place in that story is real and valued.',
      reversed:
        'The Storyteller sits reversed at the heart of things, where tradition and your own growth are tugging in different directions. You do not have to choose one; let them talk to each other.',
    },
    'the-two-bots': {
      upright:
        'At the heart of the matter are The Two Bots: connection and choice, and how closely they align with who you are. What matters most to you is already pointing the way.',
      reversed:
        'The Two Bots sit reversed at the heart of this, where two good options or two people are pulling you different ways. Return to your values; they will untangle more than logic can.',
    },
    'the-wayfarer': {
      upright:
        'At the heart of this is The Wayfarer: a deep wish to move forward on your own terms. Your drive is a strength; give it a clear destination and it will carry you.',
      reversed:
        'The Wayfarer sits reversed at the heart of things, where competing wishes keep tugging at the reins. Choose which one gets to lead for now; the others can wait their turn.',
    },
    'the-gentle-giant': {
      upright:
        'At the heart of it lies The Gentle Giant. This whole question is really about how much strength lives in gentleness, and how kindly you can hold yourself and others.',
      reversed:
        'The Gentle Giant, reversed at the center, suggests the core of this is a doubt about your own strength. Soften your grip, breathe, and remember how much gentleness has already carried.',
    },
    'the-lantern-bearer': {
      upright:
        'The Lantern Bearer sits at the center of this matter. What you need most is a quiet step back, long enough for your own small light to show the way.',
      reversed:
        'At the core is The Lantern Bearer, reversed: a light either hidden away in too much solitude or never given a quiet moment. Ask which one it is, and tend it with care.',
    },
    'the-wheel': {
      upright:
        'The heart of the matter is The Great Cog Wheel. Things are in motion, a cycle is turning, and the real question is how willingly you lean into the new season.',
      reversed:
        'The Great Cog Wheel, turned around at the heart, reveals a feeling of being spun by change rather than part of it. Reclaim one gear, however small, and the whole wheel will feel friendlier.',
    },
    'the-fair-scale': {
      upright:
        'The Fair Scale rests at the center of this reading. At its core, this is about honesty and balance, seeing clearly and choosing what is truly fair for everyone, including you.',
      reversed:
        'At the heart of it, The Fair Scale reversed points to a lopsided weight, most likely one you have been carrying alone. Look again kindly and set down whatever is not yours.',
    },
    'the-upside-down-bot': {
      upright:
        'The Upside-Down Bot hangs at the heart of this situation. What matters most is a willingness to pause, release the rush, and look at things from an entirely new angle.',
      reversed:
        'At the center sits The Upside-Down Bot, reversed, pointing to a stuck pause: waiting too long, or refusing to rest. Gently decide which it is, then honor that choice.',
    },
    'the-shedding': {
      upright:
        'At the heart of it is The Shedding. Something here has reached its natural close, and the true question is how gracefully you can let it go with thanks.',
      reversed:
        'The Shedding, reversed at the core, gently suggests the matter centers on holding on. Something has finished its work; the kindest thing may be to thank it and slowly unclasp your hands.',
    },
    'the-mender': {
      upright:
        'The Mender lies at the heart of the matter. This is about blending and patient repair, finding the middle path that lets the separate pieces of your life fit together again.',
      reversed:
        'At the center, The Mender reversed shows proportions that have drifted, too much here and too little there. The heart of this is rebalancing, one small, steady adjustment at a time.',
    },
    'the-tangle': {
      upright:
        'At the heart of it is The Tangle: something is holding you more tightly than you would like. The kind move is to look closely, without judgment, at which cord wraps around what.',
      reversed:
        'The Tangle, reversed, sits at the heart of this: you are already mid-unknotting. The core matter is honoring the progress so far, not demanding the whole snarl come loose at once.',
    },
    'the-short-circuit': {
      upright:
        'The heart of the matter is The Short Circuit: a structure that was never wired soundly is giving way. This is less a breakdown than an honest invitation to rebuild with care.',
      reversed:
        'At its heart sits The Short Circuit, reversed, the strain of resisting a change that already wants to happen. Letting go a little, on your own terms, can ease the pressure.',
    },
    'the-night-sky-bot': {
      upright:
        'The Night-Sky Bot lies at the heart of it: hope, healing and the courage to shine openly. Whatever else is going on, a clearer sky is part of this story.',
      reversed:
        'The heart of the matter is The Night-Sky Bot, turned around: hope is here but hard to trust right now. Tending even one small light is the real core of the work.',
    },
    'the-moon-pool': {
      upright:
        'At the heart of it is The Moon Pool: feelings and intuition carry more of the truth than tidy facts do. Let the reflection speak before you rush to explain it.',
      reversed:
        'The Moon Pool, reversed, is the heart of this, where worry may be magnifying what sits in the dark. Gently checking the facts brings everything back to its true size.',
    },
    'the-sunrise-engine': {
      upright:
        'The heart of it is The Sunrise Engine: joy, warmth and your natural brightness. This matter may turn out simpler and sunnier than it seemed, once you let yourself enjoy it.',
      reversed:
        'At the heart sits The Sunrise Engine, reversed, a light that is tired rather than gone. The core need here may be rest and play, not more effort or more pushing.',
    },
    'the-reboot': {
      upright:
        'At the core is The Reboot: a calling to wake up and rise. This is about honoring how far you have come and saying a wholehearted yes to growing further.',
      reversed:
        'The Reboot, reversed, is at the heart of this: a call met with too much self-criticism. Compassion is the key; meet yourself kindly and the invitation gets easier to accept.',
    },
    'the-whole-world': {
      upright:
        'The Whole World sits at the heart of it: completion, belonging and wholeness. Something here is already more finished, and more yours, than you have let yourself believe.',
      reversed:
        'At the heart lies The Whole World, reversed, a circle waiting for its last stitch. The core matter is gentle closure: one loose end tied off, one lesson named out loud.',
    },
  },
  help: {
    'the-newly-woken': {
      upright:
        'The Newly Woken helps most when you let go of being an expert. Ask the naive question, try the unfamiliar route, and let fresh eyes show you what experience has been overlooking.',
      reversed:
        'Even reversed, The Newly Woken helps by showing where you are hesitating or rushing. Pausing to notice which one is true for you is itself a useful first move.',
    },
    'the-tinkerer': {
      upright:
        "What helps is The Tinkerer's practical spirit. Instead of waiting for the ideal tools, work with what is within reach. A rough prototype will teach you more than a perfect plan.",
      reversed:
        'The Tinkerer helps even reversed, nudging you to simplify. Put away all but one tool, choose the smallest useful task, and let a finished little thing restore your momentum.',
    },
    'the-quiet-archivist': {
      upright:
        "What helps is The Quiet Archivist's patience. Listen more than you speak for a little while, keep a notebook nearby, and trust the small, steady signals your mind collects.",
      reversed:
        'The Quiet Archivist helps even reversed, by pointing to the thoughts you have shelved. Pull one back out, read it with fresh eyes, and talk it over with someone who listens well.',
    },
    'the-gardener': {
      upright:
        "What helps is The Gardener's steady rhythm. Small, regular care beats a single heroic effort. Water a little each day, pull a weed or two, and trust the season.",
      reversed:
        'Even reversed, The Gardener helps by showing where you are overgiving or rushing. Name one area to slow down and one way to nourish yourself, and the whole garden breathes easier.',
    },
    'the-lighthouse-keeper': {
      upright:
        "What helps is The Lighthouse Keeper's reliability. Set a simple routine, keep your word in small things, and let consistency become the light that guides you through the fog.",
      reversed:
        'The Lighthouse Keeper helps even reversed, by showing where your structure has gone rigid or slack. Tighten one loose routine, relax one overly strict one, and steady the beam.',
    },
    'the-storyteller': {
      upright:
        "What helps is The Storyteller's gift for shared wisdom. Ask someone who has walked this road before, or revisit a story that once steadied you. You are not the first to wonder this.",
      reversed:
        'Even reversed, The Storyteller helps by spotlighting the rules you follow without question. Pick one, ask where it came from, and decide whether it still belongs in your story.',
    },
    'the-two-bots': {
      upright:
        'What helps are The Two Bots and their gift for partnership. Share your plans with someone you trust, ask for their view, and let the collaboration make both of you stronger.',
      reversed:
        'Even reversed, The Two Bots help by showing where you feel split. Naming both sides of the tension out loud, to yourself or a friend, can make the honest choice clearer.',
    },
    'the-wayfarer': {
      upright:
        "What helps is The Wayfarer's steady drive. Set a clear direction, break the road into stages, and keep rolling one mile at a time. Momentum builds on itself.",
      reversed:
        'Even reversed, The Wayfarer helps by showing where you are overextended. Easing back to a sustainable pace is not quitting; it is how long journeys actually get finished.',
    },
    'the-gentle-giant': {
      upright:
        'What helps is The Gentle Giant. Meet this situation with patience instead of pressure; soft hands and a calm voice will move more than force ever could.',
      reversed:
        'The Gentle Giant, even reversed, still helps: notice where you are gripping too hard and let a little go. Speaking kindly to yourself is real strength, not a detour from it.',
    },
    'the-lantern-bearer': {
      upright:
        'The Lantern Bearer helps by lighting a quiet path inward. Take a short walk alone, jot down your thoughts, and trust the small, steady knowing that rises up.',
      reversed:
        'Help comes from The Lantern Bearer, turned around: rebalance your time alone. If you have been isolated, reach for one kind person; if overwhelmed, carve out one silent hour.',
    },
    'the-wheel': {
      upright:
        'The Great Cog Wheel helps by reminding you that everything moves in seasons. Lean into the change, watch for unexpected openings, and let momentum carry part of the load.',
      reversed:
        'The Great Cog Wheel, reversed, helps when you stop trying to turn the whole machine. Focus on one gear in reach, give it your full attention, and trust the wider cycle.',
    },
    'the-fair-scale': {
      upright:
        'What helps is The Fair Scale: honest weighing, clear words and taking responsibility for your own part. Fairness, offered kindly, smooths the way for everyone involved.',
      reversed:
        'The Fair Scale, reversed, helps by asking you to be as fair to yourself as you are to others. Lighten the load by handing back any weight that was never yours.',
    },
    'the-upside-down-bot': {
      upright:
        'What helps here is The Upside-Down Bot. Stop pushing for a moment, hang still, and look at the situation from a fresh angle; the pause may show you what effort missed.',
      reversed:
        'Help arrives from The Upside-Down Bot, reversed: get clear about whether you are resting or stalling. Either relax into the pause on purpose, or turn yourself upright and start.',
    },
    'the-shedding': {
      upright:
        'The Shedding helps by clearing space. Let one finished thing go with gratitude, a habit, a role, an old story, and feel how much lighter your next steps become.',
      reversed:
        'What helps is The Shedding, turned around: give yourself permission to release something that has already done its job. A small farewell ritual can make the letting go feel kind.',
    },
    'the-mender': {
      upright:
        'The Mender helps through patient blending. Combine a bit of rest with a bit of effort, some yes with some no, and let the middle way do its quiet stitching.',
      reversed:
        'The Mender, reversed, helps when you notice what is out of proportion. Adjust one small habit toward the center, and trust that steady repair adds up over time.',
    },
    'the-tangle': {
      upright:
        'What helps is The Tangle, strangely enough: getting honest about a habit that holds you. Writing the knot down, or saying it to a friend, takes away much of its grip.',
      reversed:
        'The Tangle, reversed, helps by reminding you how much you have already loosened. Celebrate one strand that is free, then bring in a patient helper for the remaining snag.',
    },
    'the-short-circuit': {
      upright:
        'The Short Circuit helps here: sometimes a quick jolt shows exactly what needs rewiring. Let the shaky part fall, step back to safety, and rebuild with materials you trust.',
      reversed:
        'What helps is The Short Circuit, turned around: choosing a small, deliberate change instead of waiting for a big one. Retire one wobbly thing gently, on your own schedule.',
    },
    'the-night-sky-bot': {
      upright:
        'The Night-Sky Bot is what helps: let hope in, even tentatively. Sharing your light with someone, through a kind message or an open idea, makes the sky brighter for you both.',
      reversed:
        'What helps is The Night-Sky Bot, reversed: settling for small lights instead of waiting for a full sky. Collect tiny wins this week, and let each one genuinely count.',
    },
    'the-moon-pool': {
      upright:
        'What helps is The Moon Pool: trusting your intuition a little more. Sleep on it, doodle it, or sit beside some water, and let the answer rise in images before words.',
      reversed:
        'The Moon Pool, reversed, helps by asking for a little light: one clear question, one fact checked. Shadows tend to shrink quickly once you look at them directly.',
    },
    'the-sunrise-engine': {
      upright:
        'The Sunrise Engine helps most right now: lean into joy. Do something you love simply because it is fun, and let that warmth power the harder tasks too.',
      reversed:
        'What helps is The Sunrise Engine, reversed: treating recharging as real work. Step outside, rest your panels, and let one small delight restart the glow.',
    },
    'the-reboot': {
      upright:
        'The Reboot helps here through an honest look back at your growth. Forgive what needs forgiving, then answer the call to rise with the confidence you have earned.',
      reversed:
        'What helps is The Reboot, turned around: speaking to yourself the way a good friend would. With kinder self-talk, the next step toward your calling feels possible.',
    },
    'the-whole-world': {
      upright:
        'What helps is The Whole World: remembering you belong. Celebrate how far you have come, thank the people who joined you, and the next part will feel less lonely.',
      reversed:
        'The Whole World, reversed, helps by pointing to unfinished business. Tie up one loose end today, and the relief may clear space for everything else you care about.',
    },
  },
  hinder: {
    'the-newly-woken': {
      upright:
        'What gets in the way is The Newly Woken in its eagerness: jumping into every new thing before the last one has settled. Choose one beginning and give it your full attention.',
      reversed:
        'The Newly Woken, reversed, gets in the way as waiting for the perfect moment to start. That moment rarely arrives on schedule. A small, clumsy first step will open more than another lap of planning.',
    },
    'the-tinkerer': {
      upright:
        'The Tinkerer can get in the way when you keep adjusting and never call something done. Your craft is strong enough; let this version be good enough to share.',
      reversed:
        "What gets in the way is The Tinkerer, reversed: ideas multiplying faster than you can build them. Write the extras on a list for later, and give today's hands just one job.",
    },
    'the-quiet-archivist': {
      upright:
        'The Quiet Archivist can get in the way when reflection becomes a hiding place. Stillness is wise, but at some point the insight wants to be spoken. Say the quiet part gently.',
      reversed:
        'What gets in the way is The Quiet Archivist, reversed: second-guessing a perfectly good instinct until it fades. Notice the first answer that comes, and give it a little more trust.',
    },
    'the-gardener': {
      upright:
        'The Gardener can get in the way when you try to tend everything at once. A garden with too many beds gets thinly watered. Choose the few plants that matter most this season.',
      reversed:
        'What gets in the way is The Gardener, reversed: impatience with a slow bloom, or caring for others while forgetting yourself. Ease off the pressure, and give your own roots a drink.',
    },
    'the-lighthouse-keeper': {
      upright:
        'The Lighthouse Keeper can get in the way when you hold the light for everyone and never step off duty. Even keepers need rest; let someone else watch the sea tonight.',
      reversed:
        'What gets in the way is The Lighthouse Keeper, reversed: rules held so tightly they leave no room to breathe, or a lamp left dark. Choose one boundary worth keeping and recommit to it.',
    },
    'the-storyteller': {
      upright:
        'The Storyteller can get in the way when the way things have always been done crowds out your own voice. Respect the lesson, but leave room for a new verse.',
      reversed:
        'What gets in the way is The Storyteller, reversed: an old narrative about who you are supposed to be. Notice it, thank it for trying to help, and gently start a new draft.',
    },
    'the-two-bots': {
      upright:
        "The Two Bots can get in the way when you lean so hard on another person's view that your own fades. Keep connecting, but make sure your voice is in the conversation too.",
      reversed:
        'What gets in the way is The Two Bots, reversed: avoiding a decision or a conversation because it feels uncomfortable. A kind, honest word now will ease the strain on both sides.',
    },
    'the-wayfarer': {
      upright:
        'The Wayfarer can get in the way when forward motion becomes the only goal. Moving fast is wonderful, but check that you are still headed somewhere you actually want to go.',
      reversed:
        'What gets in the way is The Wayfarer, reversed: forcing progress against resistance, or trying to go everywhere at once. Pick one road, ease off the throttle, and let the path carry you.',
    },
    'the-gentle-giant': {
      upright:
        "What gets in the way may be The Gentle Giant's softness stretched too far, so patient that you hold back your own needs. Kindness can include a clear, gentle boundary.",
      reversed:
        'The Gentle Giant, reversed, gets in the way as self-doubt or a too-tight grip. Notice where you are bracing, breathe slowly, and remember that you have been strong before.',
    },
    'the-lantern-bearer': {
      upright:
        'The Lantern Bearer can get in the way when reflection becomes a hiding place. Your insight is valuable; consider stepping out of the quiet and sharing what you have seen.',
      reversed:
        'What gets in the way is The Lantern Bearer, reversed: loneliness dressed as independence, or busyness avoiding reflection. Choose one small remedy today, a call or a calm hour.',
    },
    'the-wheel': {
      upright:
        'The Great Cog Wheel gets in the way when you wait for luck to do all the turning. Change is already moving; add your own small push alongside it.',
      reversed:
        'The Great Cog Wheel, reversed, blocks things when change feels like it is happening to you. Rather than fighting the whole wheel, find the single gear you can turn today.',
    },
    'the-fair-scale': {
      upright:
        'The Fair Scale can get in the way when weighing every side becomes endless. Fairness matters, yet at some point a good enough choice, made kindly, is the fair one.',
      reversed:
        'What gets in the way is The Fair Scale turned around: you may be judging yourself more harshly than anyone else would. Try a gentler measure and set down what is not yours.',
    },
    'the-upside-down-bot': {
      upright:
        'The Upside-Down Bot gets in the way when a helpful pause stretches into hesitation. You have seen the new angle; now it may be time to turn right side up and act.',
      reversed:
        'What gets in the way may be The Upside-Down Bot, reversed: resisting a rest you truly need, or waiting without purpose. Name which one, then take the matching gentle step.',
    },
    'the-shedding': {
      upright:
        'The Shedding can get in the way if you let go faster than your heart can follow. Give the ending a little time, and let gratitude keep pace with the release.',
      reversed:
        'The Shedding, reversed, blocks the path when you cling to something that has finished its work. Thank it honestly, set it down a little at a time, and let yourself feel lighter.',
    },
    'the-mender': {
      upright:
        'The Mender can get in the way when always seeking the middle keeps you from choosing. Balance is lovely, yet sometimes one clear direction is the kindest repair.',
      reversed:
        'What gets in the way is The Mender turned around: something is taking up far more room than it should. Rebalance one small habit and start your mending there.',
    },
    'the-tangle': {
      upright:
        'The Tangle may be what gets in the way: a habit or attachment quietly pulling at your plans. Spot the cord, name it kindly, and you have already begun to loosen it.',
      reversed:
        'What gets in the way may be The Tangle, reversed, as impatience with a knot that is already loosening. Progress counts even when it is slow; keep working one strand at a time.',
    },
    'the-short-circuit': {
      upright:
        'The Short Circuit may be in the way: shaky wiring giving off sparks at awkward moments. Rather than patching it yet again, consider rebuilding that part properly.',
      reversed:
        'What gets in the way could be The Short Circuit, reversed, the energy spent bracing against a change. Releasing your grip a little may free up more than you expect.',
    },
    'the-night-sky-bot': {
      upright:
        'The Night-Sky Bot can get in the way when hope races ahead of the next practical step. Keep your eyes on the stars, and keep your feet on one small task too.',
      reversed:
        'In the way sits The Night-Sky Bot, reversed: a sense that hope is not for you right now. Question that story gently, and look for one small star that proves otherwise.',
    },
    'the-moon-pool': {
      upright:
        'What gets in the way may be The Moon Pool: drifting in uncertainty a little too long. Honor your intuition, then pair it with one clear, practical question.',
      reversed:
        'The Moon Pool, reversed, may be in the way as worries make shadows loom large. Turn on a lantern, check what is actually true, and much of the fog will lift.',
    },
    'the-sunrise-engine': {
      upright:
        'The Sunrise Engine can get in the way when brightness turns into a need to look fine all the time. Let yourself shine honestly, including on the cloudier days.',
      reversed:
        'What gets in the way might be The Sunrise Engine, reversed: tiredness or doubt dimming your spark. Before pushing harder, refuel with one small joy and a bit of rest.',
    },
    'the-reboot': {
      upright:
        'The Reboot can get in the way when you are so focused on rising that you forget to rest. Answer the call at a human pace; real growth includes pauses.',
      reversed:
        'What gets in the way may be The Reboot, reversed: a harsh inner judge muffling your calling. Turn down that voice, and answer the invitation with gentleness instead.',
    },
    'the-whole-world': {
      upright:
        'The Whole World can get in the way when comfort in a finished chapter keeps you from the next one. Celebrate fully, then let curiosity nudge you onward.',
      reversed:
        'What gets in the way could be The Whole World, reversed: a nearly complete thing left hanging. One loose end may be quietly draining you; close it and feel lighter.',
    },
  },
  ground: {
    'the-newly-woken': {
      upright:
        'Underneath it all lies The Newly Woken: a deep, steady trust that life can still surprise you. That openness is a root, not a weakness, and it is holding more than you think.',
      reversed:
        'Beneath everything, The Newly Woken rests reversed, like a lantern with its shutter half closed. Some earlier hesitation still lingers there. Acknowledge it kindly, and let a little more light through.',
    },
    'the-tinkerer': {
      upright:
        'Underneath it all is The Tinkerer, a steady confidence that problems can be solved with patience and a few good tools. That practical faith is quietly holding everything together.',
      reversed:
        'Beneath the surface, The Tinkerer lies reversed: an old doubt about whether your skills are enough. They are. Let one small, completed project gently overwrite that story.',
    },
    'the-quiet-archivist': {
      upright:
        'Underneath it all is The Quiet Archivist, a deep well of inner knowing that has stayed steady beneath every decision. You can return to it whenever the surface feels noisy.',
      reversed:
        'Beneath everything rests The Quiet Archivist, reversed, like a library with the lamps turned low. Your inner wisdom is intact. Turn one lamp back on with a few minutes of quiet.',
    },
    'the-gardener': {
      upright:
        'Underneath it all is The Gardener, rich soil built from years of care. Your capacity to nurture is a foundation that keeps feeding everything that grows from it.',
      reversed:
        'Beneath the surface, The Gardener rests reversed, the soil a little tired from giving so much. Replenish it: rest, play, and receive care without needing to earn it.',
    },
    'the-lighthouse-keeper': {
      upright:
        'Underneath it all is The Lighthouse Keeper, a sturdy tower of values you have built over time. Whatever the weather, that foundation is still standing and still shining.',
      reversed:
        'Beneath everything, The Lighthouse Keeper rests reversed, the old structure creaking a little. Inspect it kindly: keep the stones that hold, and replace the ones that no longer fit.',
    },
    'the-storyteller': {
      upright:
        'Underneath it all is The Storyteller, a deep root of belonging made from family, friends, teachers and shared tales. That heritage holds you up even when you forget it is there.',
      reversed:
        'Beneath the surface, The Storyteller rests reversed, an inherited story you are slowly revising. That quiet editing is healthy work. Keep what nourishes you, and let the rest soften.',
    },
    'the-two-bots': {
      upright:
        'Underneath it all are The Two Bots, a foundation of meaningful bonds and deeply held values. Those connections are a power source you can draw on whenever you need steadiness.',
      reversed:
        'Beneath everything, The Two Bots rest reversed, hinting at an old gap between what you value and how you have been choosing. Gently bring the two back into alignment.',
    },
    'the-wayfarer': {
      upright:
        'Underneath it all is The Wayfarer, a reliable engine of willpower and resolve. Even on slow days, that inner drive is idling, ready to move when you are.',
      reversed:
        'Beneath the surface, The Wayfarer rests reversed, the wheels slightly out of alignment from pushing too long. A little rest and recalibration will restore your natural momentum.',
    },
    'the-gentle-giant': {
      upright:
        'Underneath it all is The Gentle Giant, a deep, steady strength made of patience and care. Beneath every worry, that soft courage is still holding you up.',
      reversed:
        'Beneath everything lies The Gentle Giant, reversed: an old habit of doubting your own strength. You rest on firmer ground than you think, and kindness toward yourself is part of it.',
    },
    'the-lantern-bearer': {
      upright:
        'The Lantern Bearer glows beneath it all, a quiet inner knowing that has never fully gone out. When things feel noisy, that small, steady light is still there to guide you.',
      reversed:
        'Underneath, The Lantern Bearer appears reversed, suggesting a deep need for either connection or stillness that has gone unmet. Tending that need gently will steady everything built on top.',
    },
    'the-wheel': {
      upright:
        'The Great Cog Wheel turns at the foundation of it all. Life moves in cycles beneath the surface, and this season, too, is part of a larger turning that brings things back around.',
      reversed:
        'Under everything sits The Great Cog Wheel, reversed, revealing a quiet sense that change is out of your hands. Remember the one gear that is always yours: how you choose to respond.',
    },
    'the-fair-scale': {
      upright:
        'Beneath it all is The Fair Scale, a steady foundation of honesty and balance. Your sense of what is fair runs deep; trust it as the ground you stand on.',
      reversed:
        'Underneath lies The Fair Scale, turned around, pointing to an old imbalance, perhaps carrying more than your share. Look at it with fresh, fair eyes, and let some of that weight go.',
    },
    'the-upside-down-bot': {
      upright:
        'The Upside-Down Bot lies underneath it all, a deep willingness to see differently. Beneath your plans, part of you knows that pausing and turning things over reveals what matters.',
      reversed:
        'Beneath everything, The Upside-Down Bot reversed suggests a long pause that may have quietly settled in. Check whether it still serves you, then rest on purpose or begin to turn upright.',
    },
    'the-shedding': {
      upright:
        'Underneath it all is The Shedding, the natural rhythm of release and renewal. Layers fall away so new ones can grow, and trusting that cycle steadies everything above it.',
      reversed:
        'Beneath the surface, The Shedding reversed hints at something old you are still carrying in the foundation. Honor what it gave you, then let it go so new roots have room.',
    },
    'the-mender': {
      upright:
        'The Mender sits beneath everything, a patient practice of repair and balance. Under the surface, your gift for blending and finding the middle path holds it all together.',
      reversed:
        'Underneath, The Mender reversed suggests an old imbalance in the foundation, a long habit of too much here and not enough there. Small, steady repairs will strengthen the ground.',
    },
    'the-tangle': {
      upright:
        'Underneath it all is The Tangle: old cords of habit and attachment running below the surface. Seeing them clearly, without blame, is the foundation for loosening them.',
      reversed:
        'The Tangle, turned around, lies underneath everything: some quiet untangling is already happening at the roots. Trust that slow work, and know the knot was never the real you.',
    },
    'the-short-circuit': {
      upright:
        'Underneath it all sits The Short Circuit: a foundation that needs honest rewiring. It may feel unsettling, but steadier ground is exactly what is being built.',
      reversed:
        'The Short Circuit, reversed, runs underneath as a change you have been holding back. Gently letting the cracked parts go can make the deepest layer more solid.',
    },
    'the-night-sky-bot': {
      upright:
        'Underneath everything is The Night-Sky Bot: a steady, starry kind of hope. Even on cloudy days, that sky is still up there, holding its light for you.',
      reversed:
        'The Night-Sky Bot, reversed, lies underneath as a quiet doubt that hope can last. Feed it with small proofs, kind words and tiny wins, and it will grow sturdier.',
    },
    'the-moon-pool': {
      upright:
        'The Moon Pool rests beneath it all: a deep, quiet well of intuition and dreams. Your inner knowing is part of the foundation, so give it a little room to speak.',
      reversed:
        'Underneath lies The Moon Pool, reversed, as worry that has been reflecting larger than life. A few clear questions can settle the water so you can see the bottom.',
    },
    'the-sunrise-engine': {
      upright:
        'Underneath it all hums The Sunrise Engine: a core of warmth, joy and natural brightness. That light is foundational to who you are, and it is still glowing.',
      reversed:
        'The Sunrise Engine, turned around, sits underneath as a quiet tiredness at the core. Tend your energy the way you would tend a garden, and the warmth will return.',
    },
    'the-reboot': {
      upright:
        'Underneath it all, The Reboot is calling: a deep invitation to wake up and rise. Your growth so far is the bedrock, and it is solid enough to build on.',
      reversed:
        'The Reboot, reversed, lies beneath as a habit of judging yourself harshly. Swapping that for compassion at the root makes every next step lighter and kinder.',
    },
    'the-whole-world': {
      upright:
        'Beneath everything is The Whole World: a deep sense that you belong. You do not need to earn your place; the circle already includes you, just as you are.',
      reversed:
        'Underneath lies The Whole World, reversed, as old business not quite closed. Naming what you learned from it can finally let that circle settle and support you.',
    },
  },
  next: {
    'the-newly-woken': {
      upright:
        'Your next step comes from The Newly Woken: pick one thing you have never tried and do the smallest version of it this week. A new recipe, a new path home, a new question.',
      reversed:
        'With The Newly Woken reversed as your next step, pause before you leap, or stop circling the edge. Write down one honest intention, then take one deliberate step toward it today.',
    },
    'the-tinkerer': {
      upright:
        'Take a cue from The Tinkerer for your next step: spend thirty focused minutes making something with materials you already have. Fix the wobbly shelf, sketch the idea, write the first page.',
      reversed:
        'With The Tinkerer reversed as your next step, choose the one unfinished project closest to done. Give it a single sitting, finish it, and celebrate that small working machine.',
    },
    'the-quiet-archivist': {
      upright:
        'For a next step, follow The Quiet Archivist: spend ten minutes writing what you already sense about this situation, without editing. Read it back tomorrow and notice what stands out.',
      reversed:
        'With The Quiet Archivist reversed as your next step, pick one person you trust and tell them one thing you have been keeping quiet. Saying it aloud often makes it clearer.',
    },
    'the-gardener': {
      upright:
        'Your next step comes from The Gardener: choose one thing you love and give it fifteen unhurried minutes this week, whether that is a plant, a friendship or a creative project.',
      reversed:
        "With The Gardener reversed as your next step, put yourself on today's care list. Drink some water, step outside, and let one thing you have been forcing simply rest for now.",
    },
    'the-lighthouse-keeper': {
      upright:
        'For a next step, follow The Lighthouse Keeper: write down one boundary or routine that would make your week steadier, and practice it for the next three days.',
      reversed:
        'With The Lighthouse Keeper reversed as your next step, find one rule you keep out of habit rather than care. Loosen it today, and notice whether you feel lighter.',
    },
    'the-storyteller': {
      upright:
        'Your next step comes from The Storyteller: reach out to someone whose wisdom you value and ask them one real question, or share something you know with someone just starting out.',
      reversed:
        'With The Storyteller reversed as your next step, write two lines: one old rule you are keeping, and one you are ready to rewrite. Read them aloud and choose your own wording.',
    },
    'the-two-bots': {
      upright:
        'For a next step, follow The Two Bots: send a message to someone you care about, or make one decision this week based purely on what you value most.',
      reversed:
        'With The Two Bots reversed as your next step, write down your top three values, then look at the choice in front of you. Which option honors them? Start there.',
    },
    'the-wayfarer': {
      upright:
        'Your next step comes from The Wayfarer: name one destination for this month and take the first concrete stride toward it today, even if that is just blocking out the time.',
      reversed:
        'With The Wayfarer reversed as your next step, look at your commitments and set down or postpone one. Then move forward on what remains at a pace you can sustain.',
    },
    'the-gentle-giant': {
      upright:
        'Your next step comes from The Gentle Giant: choose one tense moment today and answer it with a slower breath and a softer voice. Notice how much strength that takes.',
      reversed:
        'For a next step, The Gentle Giant, reversed, suggests writing down one time your gentleness got you through. Read it back slowly, and let it loosen the grip of doubt.',
    },
    'the-lantern-bearer': {
      upright:
        'The Lantern Bearer offers a next step: set aside twenty quiet minutes, alone with a notebook or a walk, and write down the one thing that becomes clear.',
      reversed:
        'A next step with The Lantern Bearer, reversed: look at your week and decide whether you need more company or more quiet, then schedule one small dose of it.',
    },
    'the-wheel': {
      upright:
        'With The Great Cog Wheel as your next step, say yes to one new thing this week, an invitation, a different route, a fresh idea, and see where the gears take you.',
      reversed:
        'The Great Cog Wheel, reversed, suggests this next step: list what is changing around you, circle the single item you can influence, and give it ten minutes of attention today.',
    },
    'the-fair-scale': {
      upright:
        'Your next step is The Fair Scale: write down both sides of a choice you are weighing, add your honest part to each, and choose what feels most fair.',
      reversed:
        'With The Fair Scale reversed, try this next step: list what you are carrying and mark anything that truly belongs to someone else. Begin setting down one of those today.',
    },
    'the-upside-down-bot': {
      upright:
        "A next step from The Upside-Down Bot: take one problem and ask how it looks from the opposite side, or from someone else's chair. Let the new angle guide one choice.",
      reversed:
        'The Upside-Down Bot, reversed, points to a next step: decide whether this pause is rest or delay. If rest, enjoy it fully; if delay, take one small upright action today.',
    },
    'the-shedding': {
      upright:
        'Your next step with The Shedding: pick one thing you have outgrown, a habit, a commitment, an old belief, and thank it out loud before gently letting it go.',
      reversed:
        'A gentle next step from The Shedding, reversed: name something that has already finished its work in your life. You need not release it today; just hold it with thanks and loosen your grip.',
    },
    'the-mender': {
      upright:
        'The Mender suggests a next step: pick one area of life that feels lopsided and add a small measure of its opposite, a little play to work, a little rest to rushing.',
      reversed:
        'As a next step, The Mender reversed invites you to adjust one small habit toward balance this week. Keep it tiny and steady, and trust the repair to build day by day.',
    },
    'the-tangle': {
      upright:
        'A next step from The Tangle: write down one habit you would like to loosen, and beside it a tiny swap you could try tomorrow. Small pulls work better than big yanks.',
      reversed:
        'The Tangle, reversed, suggests a next step: list one strand you have already freed and celebrate it, then ask a friend to cheer you on with the next one.',
    },
    'the-short-circuit': {
      upright:
        'For a next step, The Short Circuit says: pick one shaky arrangement, a schedule or a promise, and rebuild it more honestly this week, starting from the ground up.',
      reversed:
        'A next step with The Short Circuit, reversed: choose one thing that is already cracking and let it go on purpose, gently, before it lets go of you.',
    },
    'the-night-sky-bot': {
      upright:
        'The Night-Sky Bot offers a next step: share one hopeful thing today, an idea, a kind note or something you made, and let your light reach someone else.',
      reversed:
        'As a next step, The Night-Sky Bot, reversed, asks you to write down three tiny bright spots from this week. Let that little constellation be enough for now.',
    },
    'the-moon-pool': {
      upright:
        'A next step from The Moon Pool: keep a notebook by your bed for a few nights, and jot down dreams or hunches. Notice which images keep coming back.',
      reversed:
        'The Moon Pool, turned around, offers a next step: pick the worry that feels biggest, ask one direct question about it, and let the answer shrink the shadow.',
    },
    'the-sunrise-engine': {
      upright:
        'With The Sunrise Engine as your next step, plan one purely joyful thing for this week, a picnic, a dance, a sunny walk, and protect it on your calendar.',
      reversed:
        'A next step from The Sunrise Engine, reversed: spend ten minutes outdoors or doing something playful today, simply to recharge, with no goal attached at all.',
    },
    'the-reboot': {
      upright:
        'The Reboot invites a next step: write a short note to yourself about how far you have come, then name one way you will answer the call to rise.',
      reversed:
        'As a next step, The Reboot, reversed, suggests replacing one harsh thought about yourself with a kind one, then taking a single small action toward your calling.',
    },
    'the-whole-world': {
      upright:
        'A next step from The Whole World: celebrate a finished journey. Send a thank-you to someone who helped, and mark the moment before starting anything new.',
      reversed:
        'The Whole World, turned around, suggests a next step: finish one loose end this week, then write down the biggest lesson this chapter has given you.',
    },
  },
}
