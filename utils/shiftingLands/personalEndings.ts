import type { TrialResult } from './authoredBosses'
import { PREMADE_CHARACTERS } from './characters'
import type { JourneyStateV6 } from './deckV6'
import type { AuthoredEndingV6 } from './endingsV6'
import { authoredEndingV7 } from './endingsV7'

// zuzu-shifting-lands/t-053 (Silas, 2026-11-12 PT): "We might as well have
// custom endings for each character. Great thing for the scrapbook."
//
// Each premade on a personal road ends on one of its own three endings:
// - dark, when its thread holds a dark turn the road never undid;
// - hopeful, when it carried at least three of its own good turns;
// - bittersweet otherwise.
// The ending keeps the road's own memory (the deed, the trial, the bargains
// and any moral constellation the shared ending would add) between the
// traveler's own opening and closing lines. Achievements still read the
// shared ending (journeyDeeds.ts), so nothing earned changes.

type Phase = 'complete' | 'fallen' | 'retired'
export type PersonalTone = 'hopeful' | 'bittersweet' | 'dark'
export const PERSONAL_TONES: readonly PersonalTone[] = [
  'hopeful',
  'bittersweet',
  'dark',
]

export type PersonalEndingCopy = {
  id: string
  tone: PersonalTone
  title: string
  path: string
  opening: string
} & Record<Phase, string>

type PersonalRoad = {
  characterId: string
  hopeful: readonly string[]
  dark: readonly string[]
  redeems: readonly string[]
  endings: Record<PersonalTone, PersonalEndingCopy>
}

const HOPEFUL_AT = 3

const ROADS: readonly PersonalRoad[] = [
  {
    characterId: 'zuzu',
    hopeful: [
      'zuzu-home-given',
      'zuzu-gave-the-blade',
      'zuzu-taught-the-fold',
      'zuzu-refused-the-voice',
      'zuzu-closed-the-snow-door',
      'zuzu-sang-for-the-dead',
      'zuzu-bowed-to-the-sentry',
      'zuzu-stood-surety',
    ],
    dark: ['zuzu-took-the-snow-road'],
    redeems: [],
    endings: {
      hopeful: {
        id: 'zuzu-a-peg-by-another-door',
        tone: 'hopeful',
        title: "A Peg by Someone Else's Door",
        path: 'Home found where you stopped walking',
        opening:
          'There is a wooden peg beside a door in a land nobody in your country has heard of, and your straw hat hangs on it. You never decided to stay. You only kept finding work for your hands among people who needed it done, until one evening someone set a bowl in front of you without asking.',
        complete:
          'Beyond the Verge you build nothing grand: a fence, a well cover, a bench by the road where travelers can sit. You still bow to the dead in the old way. The children who grow up near you bow too, without knowing why, and that is how your country arrives in this one, a little at a time.',
        fallen:
          'You fall on the road with no country under you but this one. The people you walked beside bury you the way you buried their dead, hat off, with a song nobody here knows the words to. They hum it anyway. It is close enough.',
        retired:
          'You stop before the last gate and do not regret it. The hat stays on its peg through the long season. When the road calls, you walk a little way down it and come back, and each time the door is open before you knock.',
      },
      bittersweet: {
        id: 'zuzu-two-countries-no-map',
        tone: 'bittersweet',
        title: 'Two Countries, No Map',
        path: 'An old code kept on a road that never shared it',
        opening:
          'You carry two countries now and live in neither. One is behind a door you chose not to open. The other is the road under your feet, which shifts every night and has never once asked who you were before.',
        complete:
          'You cross the Verge and keep walking. Some nights you dream in your own language and wake to find a word of it gone. You bow to the dead anyway. The code holds even when the words go, and it is the only map you have.',
        fallen:
          'The road takes you before you decide where home is. A traveler finds your hat beside the trail and wears it to the next town, where nobody knows what it means. It keeps the sun off her face. That is something.',
        retired:
          'You stop walking at a crossroads that belongs to no one. Travelers who pass get water and a bow, and no story. You keep the story. It is all that is left of the road from Edo, and you do not spend it lightly.',
      },
      dark: {
        id: 'zuzu-the-road-home-collects',
        tone: 'dark',
        title: 'The Road Home Collects',
        path: 'Home, bought at a price someone small paid',
        opening:
          'The bridge in the snow was real, and so was the gate beyond it. You crossed, as you knew you would the moment you saw it, and the bell that has no clapper rang you in.',
        complete:
          'Your country is exactly as you left it, and nobody in it remembers you. Your teacher’s gate opens on strangers who bow politely and ask where you are from. On the far side of the seam the price was paid by someone small. You were not asked to watch. The bell rings every evening, and it is not the bell you remember.',
        fallen:
          'You do not survive the crossing, or you survive it as something else. Travelers at the last threshold still feel the cold seam in the rock. On the worst nights they hear an evening bell on the far side, and a voice in a language none of them know, asking for one small thing.',
        retired:
          'You stop before the last gate with the seam still open behind you. You know the way back to it with your eyes shut. Every evening you stand facing it and listen for a bell, and the children nearby learn not to walk past you at that hour.',
      },
    },
  },
  {
    characterId: 'jeffery-mittens',
    hopeful: [
      'jeffery-crew-fed',
      'jeffery-vouched-at-the-seep',
      'jeffery-told-hollis',
      'jeffery-barefoot-shod',
      'jeffery-barefoot-taught',
      'jeffery-barefoot-watched',
      'jeffery-crew-turned',
      'jeffery-gave-from-the-string',
      'jeffery-taught-the-hiding-place',
    ],
    dark: ['jeffery-crew-rejoined'],
    redeems: ['jeffery-crew-turned'],
    endings: {
      hopeful: {
        id: 'jeffery-quartermaster-of-the-long-table',
        tone: 'hopeful',
        title: 'Quartermaster of the Long Table',
        path: 'Every child shod, and nobody’s scout',
        opening:
          'You still wear a string round your neck, but there are no boots on it now, only a knot for every child who has a pair. There are a lot of knots. You lost count somewhere past the canyon and started again.',
        complete:
          'Beyond the Verge the barefoot line becomes a long table with a roof over it, and you are its quartermaster in a coat that finally fits. Hollis’s crew sells water at a fair price down the road and sends its kits to eat at your table on bad days. Nobody strips the dead for boots anymore. There are cobblers now, and you know every one of them by name.',
        fallen:
          'You do not make it to the end of the road. The children you shod carry you the last mile anyway, taking turns, and bury you with your boots on, because you would have hated it any other way. The oldest girl takes the string.',
        retired:
          'You stop walking when the smallest child stops needing to be carried. The barefoot line settles where you stopped: a camp with a fire and a pile of boots by the door, sorted by size. Everybody who passes gets a pair that fits. You check.',
      },
      bittersweet: {
        id: 'jeffery-one-pair-short',
        tone: 'bittersweet',
        title: 'One Pair Short',
        path: 'Quartermaster to children you could not keep',
        opening:
          'You did what you could with a string of boots and two black paws, and it was never quite enough. There was always one more child with bare feet than there were pairs to go round.',
        complete:
          'You cross the Verge alone with one small boot still on the string, its partner lost somewhere in the Tablelands. The crew went one way and the barefoot line another, and you took the long way between them, carrying word. You hang the last boot on the gate. Someone will need it.',
        fallen:
          'The road takes you somewhere between the crew and the children, and neither hears for a long time. When the oldest girl finds out, she ties a rag round her arm the way you did and keeps the line moving.',
        retired:
          'You turn back toward Hollow Bell and hang the last boots on its arch, under the sign that has been painted over so many times. People who pass take a pair if they need one. You come by every spring to count how many are gone.',
      },
      dark: {
        id: 'jeffery-hollis-best-scout',
        tone: 'dark',
        title: 'Hollis’s Best Scout',
        path: 'Fed, armed, and on the wrong side of the fence',
        opening:
          'You eat every day now. You have a rifle you are tall enough to hold, a post on the wall, and a coat that fits because you took it off someone who did not need it anymore. Hollis says you are the best scout she ever had.',
        complete:
          'Beyond the Verge the crew holds the crossings, and you are the one who decides which wagons are worth stopping. You are good at it. Sometimes a barefoot child comes up the road and looks at the boots on your feet, and you look back until they leave. You used to know what that was like. You remember it the way you remember a fever.',
        fallen:
          'You fall on a raid that was supposed to be easy. The crew takes your boots before they bury you, because that is what the crew does, and you taught half of them how. Somewhere a barefoot kit gets a pair too big for him, and grows into them.',
        retired:
          'You leave the crew with a full pack and nobody to bring it to; the barefoot line scattered while you were on the wall. You walk back to Hollow Bell and sit under the arch where you once gave your name, and nobody comes to ask it.',
      },
    },
  },
  {
    characterId: 'fennec-siblings',
    hopeful: [
      'ling-kept-him-close',
      'ling-crossed-the-ford',
      'ling-out-talked-the-ferryman',
      'ling-broke-the-fever',
      'ling-refused-the-voice',
      'ling-bao-shared-his-bowl',
      'ling-fed-him-without-an-oath',
      'ling-held-him-up-to-the-counter',
    ],
    dark: ['ling-followed-the-voice'],
    redeems: [],
    endings: {
      hopeful: {
        id: 'ling-two-bowls-both-full',
        tone: 'hopeful',
        title: 'Two Bowls, Both Full',
        path: 'A little brother who stops guarding his bowl',
        opening:
          'There is a day, somewhere past the canyons, when Bao sets his bowl down half full and wanders off to look at a beetle. Nobody takes it. He does not run back. You watch the bowl for a long time, and then you eat your own supper first, all of it, for the first time since the fire.',
        complete:
          'Beyond the Verge you find a town with a school, a door you can lock from the inside, and a baker who gives the heels away to children. You go back to school, older than everyone in your class and taller than the teacher. Bao starts two years later and tells everyone his sister carried him across the whole world. He is not wrong.',
        fallen:
          'You do not reach the end of the road. Bao does: carried, then walking, by people who learned from watching you how a child is kept. He grows up never once guarding his bowl, and tells his own children about a sister who fed him first, every time. They think it is a story.',
        retired:
          'You stop at the first place where the bread is honest and the doors lock from the inside, and you stay. Bao grows round and loud and fearless. Some nights you still wake and count him. He is always there.',
      },
      bittersweet: {
        id: 'ling-ten-years-old-twice',
        tone: 'bittersweet',
        title: 'Ten Years Old, Twice Over',
        path: 'A childhood spent keeping someone else’s',
        opening:
          'You kept him fed. Every day, every road, every bargain, you fed him first and ate what was left, and he grew, and you got thinner, and somewhere along the way you stopped being ten and became whatever a person is who does that.',
        complete:
          'Beyond the Verge Bao runs ahead of you into a town that will look after him, and he does not look back, because you taught him he never had to. You stand at its edge a long time with empty arms. Then you go in. Someone asks how old you are, and you have to think about it.',
        fallen:
          'The road takes you on a cold night, with Bao asleep and warm against you because you gave him the blanket. A family on the road finds him in the morning and keeps him. He grows up remembering his sister only as a warmth, a counting song, and the feeling of being carried.',
        retired:
          'You stop walking because he needs to stop, not because you do. You find work, too young, and a room, too small, and you keep him fed. He goes to school. You walk him there every morning and stand outside the window until the bell, and then you go to work.',
      },
      dark: {
        id: 'ling-the-table-under-the-hill',
        tone: 'dark',
        title: 'The Table Under the Hill',
        path: 'Fed, at a price nobody named',
        opening:
          'You went down to the table under the hill, and it fed you, and it never asked for anything. That was how you knew, later, that it had already taken what it wanted. Bao is fine. Bao is always fine. Bao is never hungry anymore, even when there is no food at all.',
        complete:
          'Beyond the Verge you settle where the bread is free and nobody asks where you came from. Bao grows tall and quiet, and does not like the sun. Some nights his bed is empty and you follow the smell of baking to a crack in the cellar wall and carry him back up, and in the morning he does not remember. You keep carrying him. You always will.',
        fallen:
          'The road takes you, and Bao goes on alone, untroubled, toward a smell of bread nobody else can smell. Travelers who meet a small fennec boy on the black road say he is polite and well fed, and that he asks each of them whether they are hungry.',
        retired:
          'You stop near a hill with a cave in it, because Bao will not walk any farther from it. You tell yourself he is only tired. You build a door across the cave mouth with your own hands, and every night you sit against it, and every night something on the other side is kind to you through the wood.',
      },
    },
  },
  {
    characterId: 'coyote',
    hopeful: [
      'coyote-let-them-collect',
      'coyote-spoke-of-the-wagons',
      'coyote-asked-after-them',
      'coyote-warned-the-road',
      'coyote-kept-the-fire',
      'coyote-told-it-straight',
      'coyote-carried-it-honest',
      'coyote-laid-down-the-gun',
    ],
    dark: ['coyote-sold-the-runaways'],
    redeems: ['coyote-turned-the-wagon-loose'],
    endings: {
      hopeful: {
        id: 'coyote-one-fire',
        tone: 'hopeful',
        title: 'One Fire',
        path: 'A gun laid down, a fire kept for strangers',
        opening:
          'Somewhere along the road you stopped counting the days before somebody collected the price on your head, and started counting the children you had turned back from the gate instead. It is not a large number. It is larger than the number of wagons you drove. You keep it in your head, where the price used to be.',
        complete:
          "You cross the Verge with a bundle of kindling on your back and nobody's money on your head that you know of. Past the last gate there is a crossroads the night wagons have to pass, and you build a fire there every evening and sit by it in plain sight. Drivers see your patch and turn round. One of them, once, climbs down and sits with you instead.",
        fallen:
          'The road takes you between one fire and the next, and the notice in Dustwater hangs over the counter until the paper browns. Nobody ever collects. Up on the Tablelands a lynx girl grown tall keeps a fire at a crossroads for strangers, and when anyone asks her why, she says a one-eyed coyote once kept one for her.',
        retired:
          'You stop short of the last gate, at a crossroads where three wagon roads meet, and you build a fire there and do not leave it. Travelers learn they can sit at it without being asked their names. Now and then a covered wagon comes through at night, sees who is sitting by the fire, and turns back the way it came.',
      },
      bittersweet: {
        id: 'coyote-paid-in-full',
        tone: 'bittersweet',
        title: 'Paid in Full',
        path: 'The price on your head, collected by someone who needed it',
        opening:
          "You were never going to outrun the notice. You understood that somewhere around the second land, and after that you only thought about who ought to collect it: not the water house's hunters, but someone with thirsty kits and an honest face, who needed a year of water more than you needed a year of road.",
        complete:
          'You cross the Verge, and a week later you walk back over it with a young family who never had a chance at anything. At the Dustwater counter you hold out your paws for the irons and let the father do the talking. His kits drink for a year. The lockup is cold. It is the first debt you ever paid in full, and the only one you chose.',
        fallen:
          'The road takes you before you can arrange it properly. A family who once shared your fire carries your hat back to Dustwater and lays it on the water house counter beside the notice. The clerk looks at the hat a long while. Then he pays them. Nobody in Dustwater ever says whether he had to.',
        retired:
          'You stop walking in the last land and send word back to Dustwater by a family who has nothing, telling them exactly where you sleep. They come. You go with them quietly, paws where they can see them, and they draw a year of water on your name. You think about the window bar in the lockup, and leave it alone.',
      },
      dark: {
        id: 'coyote-the-water-house-gun',
        tone: 'dark',
        title: 'The Water House Gun',
        path: 'Your notice burned, your seat on the wagon kept warm',
        opening:
          'The notice burned the night you nodded across the fire. The water house sent word after it: no hard feelings, good drivers are scarce, the seat is yours if you want it. You told yourself you would never want it. Then the road got long and the nights got cold, and the water house pays in water, and you know the way.',
        complete:
          'Past the Verge the water house has a gate of its own now, and you drive the night wagon up to it every new moon with the canvas tied down tight. You are good at it. You do not look under the canvas. When something small knocks on the boards, you start to whistle, and you whistle until it stops.',
        fallen:
          "You fall on the night road in the driver's seat, with the reins still in your paws. The mules carry the wagon on to the gate without you, because they know the way, and the sister in grey who opens it says only that Mother will be sorry. She asked after you. She always did.",
        retired:
          'You stop driving before the last gate and take a room over the Dustwater water house, where the clerk lets you sit out your days on the porch with a full jug at your elbow. You are never thirsty. Every new moon you hear the wagon go out under your window, and every new moon you find you have already drawn the curtain.',
      },
    },
  },
  {
    characterId: 'mags',
    hopeful: [
      'mags-told-the-mother',
      'mags-broke-the-fever',
      'mags-held-the-crowd',
      'mags-spared-the-driver',
      'mags-walked-him-through',
      'mags-let-him-be-someone-else',
      'mags-told-another-mother',
      'mags-nursed-the-fever',
    ],
    dark: ['mags-lit-the-torches'],
    redeems: ['mags-set-down-the-gun'],
    endings: {
      hopeful: {
        id: 'mags-every-name-on-the-wall',
        tone: 'hopeful',
        title: 'Every Name on the Wall',
        path: 'A bar where no child goes up any road unasked',
        opening:
          'Somewhere on the road you stopped looking for one bent ear in every crowd and started looking at every face. You still carry his notice. You have stopped carrying it like a lit fuse. The gun rides on your back now, not across your knees, and some days you forget it is there.',
        complete:
          "Beyond the Verge you open a bar with a long wall and no mirror. You pin up every notice anyone brings you, and you feed the children who come in alone before you ask them anything. Some notices come down again with a line through them, which here means found. Lark's stays up at the top, in his pencil and yours. No child leaves your door for any road without you asking where it leads.",
        fallen:
          "The road takes you before the last gate, and the travelers who walked with you carry your scattergun the rest of the way, unloaded. They pin your boy's notice on the first wall they find past the Verge, and under it, in somebody's careful letters: MAGS, WHO ASKED. Mothers stop to read it. Some of them go home and ask.",
        retired:
          "You turn back to Dustwater and take the bar again. The first night you pour every cup of the water baron's water into the trough and tell the room why, and the room listens. After that, when a wagon with a bell on its tailboard comes through town, half of Dustwater is standing in the road before it stops. Nobody has to say a word.",
      },
      bittersweet: {
        id: 'mags-the-notice-comes-down',
        tone: 'bittersweet',
        title: 'The Notice Comes Down',
        path: 'The truth, all of it, and a life on the far side of it',
        opening:
          'You found out. Not everything, but enough: the wagon, the gate, the stair, and the kind voice that lifted him down. Nobody had to sell you the truth in the end. You walked to it. It weighs what you thought it would, and you are still standing, which you did not expect.',
        complete:
          'Beyond the Verge you take the notice out of your hatband for the last time and bury it under a young tree at the edge of a town that has never heard of the mission road. You tend bar again. When a mother asks you something, you tell her the truth, all of it, and pour her a drink, and stay. That is all the kindness you have left. It turns out to be a great deal.',
        fallen:
          "You fall on the road with your boy's notice in your hatband and the truth about him in your head, and both go into the ground with you. A stranger who shared your fire once carries the story back to Dustwater and tells the whole bar: the wagon, the gate, the stair. Nobody laughs. The next wagon with a bell on its tailboard leaves Dustwater empty.",
        retired:
          'You stop short of the last gate and go home to Dustwater, and take his notice down from the wall behind the bar. The square where it hung stays paler than the rest of the boards. You leave it that way. When folk ask what used to be there, you tell them, and you do not stop telling until they understand.',
      },
      dark: {
        id: 'mags-thirty-lamps',
        tone: 'dark',
        title: 'Thirty Lamps',
        path: 'Grief that found a match and kept it',
        opening:
          'You stopped asking questions somewhere on the road. Questions are slow and fire is quick, and there are always folk who will follow a mother with a scattergun and a reason. You have thirty lamps behind you now. You have not found your boy. You have stopped expecting to.',
        complete:
          "Beyond the Verge the sister houses go dark when they hear you are coming. They empty in the night and move on, and you burn what they leave, and the crowd behind you cheers. Nobody asks anymore where the sisters take whoever was inside. Not even you. Lark's notice is black at the edges now from being held too near the fire.",
        fallen:
          'You fall on a night of torches, at a gate you were sure of, and the crowd goes on without you, because a crowd always does. They do not remember your name for long, only the fire. Somewhere a sister house stands a little longer because of it, and a kind voice inside says how sad it is, all that grief.',
        retired:
          'You stop when the crowd stops following, which is sooner than you thought. You go home to Dustwater. The bar is still there. His notice is still on the wall. You sit under it with the scattergun across your knees and wait for somebody to come in and tell you that you were right. Nobody does.',
      },
    },
  },
  {
    characterId: 'hollis',
    hopeful: [
      'hollis-worked-for-bread',
      'hollis-scrubbed-the-mark',
      'hollis-laid-down-the-rifle',
      'hollis-paid-back-the-caravan',
      'hollis-stood-the-watch',
      'hollis-refused-the-wardens',
      'hollis-opened-the-lid',
      'hollis-confessed-the-ration',
    ],
    dark: ['hollis-took-the-wardens-coin'],
    redeems: ['hollis-bought-them-through'],
    endings: {
      hopeful: {
        id: 'hollis-kits-out-of-the-rocks',
        tone: 'hopeful',
        title: 'Kits Out of the Rocks',
        path: 'A band that put the rifle down and still ate',
        opening:
          'Somewhere on the road your kits stopped hiding. It happened so slowly you never saw it go: one day a wagon came round the bend and the three of them stayed where they were, out in the open, and waved. You stood there with empty paws and no rifle on your shoulder, and you let them.',
        complete:
          'You cross the Verge with the band behind you, thinner than it started and every one of them alive. On the far side there is a valley with a creek in it that nobody has put a lid on. You dig a well beside it anyway, out of habit, and leave it open. Travelers drink there. Some of them know your notched ear. You let them, and you pour them a cup.',
        fallen:
          'The road takes you before the last gate, on a cold night with the band around you. They do not scatter. Your oldest kit takes the lead the way you showed her, and the crew follows her because she does it your way: share first, ask second, and leave the rifle on the wall where it hangs. Somewhere behind you a well stays open because of you.',
        retired:
          'You stop at a farm on the edge of the Homestead where an old widow needs her potatoes dug and her fence mended, and the band stays one season, and then another. Nobody chalks anything on her gate. Your kits go to a school with a stove in it, and come home and tell you what a word means, and you pretend you did not know it.',
      },
      bittersweet: {
        id: 'hollis-everyone-fed-nobody-together',
        tone: 'bittersweet',
        title: 'Everyone Fed, Nobody Together',
        path: 'The band scattered to honest work, and you alone with the kits',
        opening:
          'The band did not break so much as wear thin. One stayed on at a farm, one drove salt for a widow, two went back the way they came. Each time you said yes, go, eat. By the end it was you and three kits and a road that had stopped needing a band at all, and you were not sure whether you had won something or lost it.',
        complete:
          'You cross the Verge with three kits and no crew. On the far side you take work hauling stone, and you are good at it, and the kits eat every day. Sometimes a stranger whistles two notes on the road, low then high, and you turn before you can stop yourself. It is never anyone. You whistle back anyway, so whoever it is will know somebody heard.',
        fallen:
          "The road takes you somewhere between one honest job and the next. Word goes out along the old routes, the way word used to go out for a raid, and it reaches the ones who left. Four of them come back to stand at the grave. Each takes a kit's paw, and between them they work out, without one argument, who will feed whom.",
        retired:
          'You stop short of the last gate in a town that will hire a jackal so long as she does not carry a rifle. You do not. The kits grow up in a house with a door, and you sit on its step in the evenings and watch the road, counting wagons out of old habit, and never once telling anybody which of them are worth stopping.',
      },
      dark: {
        id: 'hollis-holder-of-the-crossings',
        tone: 'dark',
        title: 'Holder of the Crossings',
        path: 'Fed by the wardens, and the gate held',
        opening:
          'Your kits have not been hungry since you signed. They sleep under a roof, in coats that fit, and they have stopped asking what the band does on the wall all day. You told them it was guarding. It is guarding. You have learned to say it so it sounds like the whole truth, and some days you almost hear it that way yourself.',
        complete:
          'Beyond the Verge the wardens give your band the crossings to hold, and you hold them well. You decide which families pass and which wait for next season, and you decide quickly, because you were always good at counting. Your kits ride with you now. The oldest keeps a rifle across her knees. She learned how to sit with it by watching you.',
        fallen:
          'You fall holding a gate, on the wrong side of it, and the wardens pay the band for one more month and then let them go. The crew walks back out onto the road among the families they turned away. Some of those families share with them anyway. Your kits are fed that winter by mothers you once kept out.',
        retired:
          'You hand the gate to another crew and walk away with a full purse and three kits who look at a road the way the wardens taught them, as something to be held. You buy a well with a lid on it, and a lock, and you sit beside it with the key. You never sell it by the cup. You never open it to anyone at all.',
      },
    },
  },
  {
    characterId: 'sister-wren',
    hopeful: [
      'wren-wrote-go-again',
      'wren-spoke-aloud',
      'wren-swam-them-out',
      'wren-kept-the-kit-hidden',
      'wren-locked-the-stair',
      'wren-turned-the-arrows',
      'wren-sat-with-the-dying',
      'wren-stood-for-the-runaways',
    ],
    dark: ['wren-gave-up-the-kit'],
    redeems: ['wren-said-all-of-it'],
    endings: {
      hopeful: {
        id: 'wren-counting-every-night',
        tone: 'hopeful',
        title: 'Counting Every Night',
        path: 'A house with its cellar nailed shut, and every bed full in the morning',
        opening:
          'You were afraid the whole way. You are still afraid. Somewhere on the road you found out that being afraid and doing it anyway are not two different things, only one thing done slowly. Your paws still shake. They shook when you held the doors open, too.',
        complete:
          'Beyond the Verge you take a house with a garden gone to seed and nail its cellar door shut with planks before you unpack anything. The children come, one and then several: runaways, strays, the small ones nobody wrote down. You count them every night, out loud, by name. Every morning the number is the same, and you count them again anyway, to hear it.',
        fallen:
          'You do not reach the end of the road. The rabbit kit who ran with you does, carried on by folk you asked to carry her. Years later, in a town past the Verge, a grown rabbit counts her own kits at bedtime, every one by name, and tells them a frightened otter taught her how.',
        retired:
          'You stop at a farm a long way from the mission and stay, and keep a lamp in the window every night for anyone walking away from somewhere. Most nights nobody comes. Some nights a small figure in grey does, paws in her sleeves, and you open the door before she knocks and say her name kindly, the way a name should be said.',
      },
      bittersweet: {
        id: 'wren-given-here-gone-now',
        tone: 'bittersweet',
        title: 'Given Here, Gone Now',
        path: 'Free, and no home to be free in',
        opening:
          'You got out. You keep getting out: of rooms, of towns, of any place where somebody is kind to you too quickly. You were given to that house before you could walk, and nothing was ever yours before it. The road is the first thing you ever chose, so you keep choosing it.',
        complete:
          "Beyond the Verge you find work and a room and kind neighbors, and you leave after a season, and again after another. Wherever you go you stop at the wells. In every town with a convent you drop a folded scrap into a bucket, one word in a careful novice's hand, and walk on before anyone draws it up. You never learn how many were read.",
        fallen:
          'The road takes you between one well and the next. In your coat the folk who find you discover a stub of pencil and a stack of paper scraps, each folded small, each with one word on it. They do not know what it means. A young otter among them keeps one scrap anyway, and some years later she understands.',
        retired:
          'You stop in a river town that has never had a convent and work the ferry, because you can swim and nobody asks why you are so careful with the children aboard. You are not happy, exactly. But you sleep with your door unlocked, which you never once did in that house, and that is something.',
      },
      dark: {
        id: 'wren-back-by-vespers',
        tone: 'dark',
        title: 'Back by Vespers',
        path: 'Forgiven, and kept',
        opening:
          'You went back. It was easier than you thought; it always is. The Abbess met you at the gate and did not scold you, and gave you a bath and a supper and your old cot, and you slept for two days. When you woke, she had given you the keys. She said she had always known you would come home.',
        complete:
          'Beyond the Verge there is a new sister house, and you keep it now, with perfect manners and a warm kitchen and a stair door you unlock at the hour the bell would ring if it could. You do not count the beds anymore. Sometimes a young novice watches you with her paws shaking, and you are very kind to her, the way you were taught.',
        fallen:
          "You fall on the road carrying the house's keys, and the sisters bury you with them and say you were the most obedient novice the house ever kept. The rabbit kit who ran with you once hears of it years later, a long way off, and does not know whether to grieve for you or for herself.",
        retired:
          "You stop at the old house and never leave it again. You sweep the courtyard and polish the bell that does not ring and carry the water up from the well. Once, at sundown, you find a folded scrap floating in the bucket, one word in a novice's careful hand. You burn it in the kitchen fire and say nothing to anyone.",
      },
    },
  },
  {
    characterId: 'brother-peddler',
    hopeful: [
      'peddler-gave-away-the-seep',
      'peddler-carried-it-for-nothing',
      'peddler-refused-the-purse',
      'peddler-confessed-the-trade',
      'peddler-taught-the-boiling',
      'peddler-gave-back-the-ring',
      'peddler-told-her-it-was-water',
      'peddler-cut-the-poppy',
    ],
    dark: ['peddler-took-the-sisters-purse'],
    redeems: ['peddler-warned-them-off-the-south'],
    endings: {
      hopeful: {
        id: 'peddler-the-free-jar',
        tone: 'hopeful',
        title: 'The Free Jar',
        path: 'A con man who ends up digging wells',
        opening:
          'You still ring the bell. You still do the patter, the jar held up so it shines, the pause before the word blessed. But somewhere on the road you started giving away more jars than you sold, and telling folk what was in them when they asked, and they kept coming anyway. You never did work out why.',
        complete:
          "Beyond the Verge you find a dry town and dig it a well with your own paws, a whole season of digging, and when the water comes up you ring your little bell over it and call it blessed, and charge nothing. Folk call you Brother and mean something by it now. You let them. On the well's stone lip you scratch: It's water. It's wet. That's the blessing.",
        fallen:
          'The road takes you between one seep and the next, with a jar in each coat pocket, and whoever finds you drinks them and goes on. Years later, on a dozen roads, there are cairns pointing to water someone once showed someone, and travelers stop at each one and ring whatever they carry: a cup, a buckle, a little tin bell.',
        retired:
          'You stop at the first seep that nobody owns, build a lean-to beside it, and stay. Families coming off the dry road find a hare in a black coat who gives them water and rings a bell over their children, for luck, for nothing. Some leave a coin anyway. You keep the coins in a jar for the next family that needs bark.',
      },
      bittersweet: {
        id: 'peddler-both',
        tone: 'bittersweet',
        title: 'Both',
        path: 'The lie and the kindness, never quite apart',
        opening:
          'You never did decide. Some days you sold hope to folk who could not afford it; some days you gave it away to folk who could. Some of what you said was true and most was not, and the water was always only water, and sometimes, held up to the sun, it was enough.',
        complete:
          "Beyond the Verge you set up on a new road with new jars and the same bell. You charge the rich double and the poor nothing and the in-between whatever they look like they can spare, and you are wrong about that half the time. A kit asks you once if the water is really blessed. You tell her it is today. You can't remember afterward whether that was the patter.",
        fallen:
          "You fall on the road with a full jar in your paw and a family's coin in your coat, and nobody who knew you can agree whether you were a crook or a saint. They argue it at your grave for an hour. In the end they ring your little bell over you, pour the jar into the ground, and call it blessed. You would have liked that.",
        retired:
          'You stop selling at last, in a small town that does not need you, and sit on the boardwalk with your bell in your lap. When a stranger comes through with a sick child and a look you know, you get up and fetch a jar and do the patter one more time, for free, and hate yourself a little, and do it again the next time.',
      },
      dark: {
        id: 'peddler-the-sisters-brother',
        tone: 'dark',
        title: "The Sisters' Brother",
        path: 'Paid by the house to send them south',
        opening:
          'The sisters pay well, and they pay on time, and the purse is always full. All you do is tell sick families what the sisters would tell them: that there is a kind house to the south where children are fed. You used to sell water. Now you sell the road. Your coat has never been cleaner.',
        complete:
          'Beyond the Verge there are new sister houses, and you walk ahead of them, ringing your little bell in towns where nobody knows you and telling mothers about the kind house over the hill. The sisters send your jars now, sealed with black wax and a little bell pressed into it. You have stopped asking what is in them. You have stopped watching the road for anyone coming back.',
        fallen:
          "You fall on the road with the sisters' purse in your coat, and they come and take it back before they bury you. A season later a mother you once sent south walks back up that road alone, and stops at the stone with your bell hung on it. She takes the bell down. She does not say why.",
        retired:
          'You stop when the purse stops coming, which is the day the sisters find a younger hare with a cleaner coat. You go back to the delta and fill jars at your old seep and sell them by the road, honest water at an honest price. Nobody buys. They have all gone south.',
      },
    },
  },
  {
    characterId: 'old-ash',
    hopeful: [
      'ash-named-the-price',
      'ash-paid-with-her-own',
      'ash-read-the-abbess-true',
      'ash-feathered-the-children',
      'ash-taught-the-fledgling',
      'ash-faced-the-coven',
      'ash-lit-the-way',
      'ash-saw-the-true-face',
    ],
    dark: ['ash-took-the-sweetest-memory'],
    redeems: ['ash-gave-back-a-memory'],
    endings: {
      hopeful: {
        id: 'ash-price-said-first',
        tone: 'hopeful',
        title: 'The Price Said First',
        path: 'A witch who learned to pay her own way',
        opening:
          "Somewhere on the long road you stopped taking memories. You still sell sight, because sight is what you have, but you say the price before you look now, and most nights the price is yours: a feather, a night's sleep, a little of what you remember of the cave. You have less of yourself than you started with. It turns out to be enough.",
        complete:
          'Beyond the Verge there is a crossroads with no dead tree, so you plant one: a crooked live thorn that will take forty years to bear your weight. Travelers stop and ask what you sell, and you tell them first what it costs. Some walk on. Some sit. One spring a young crow with cave-grey flight feathers lands on the fence and asks to learn, and you teach her the way you wish you had been taught: price first, every time.',
        fallen:
          'The road takes you at a fork, in the evening, with your eyes open. The crows who find you do not take your feathers, which is the custom. They take your string of beads and break them, and far off a drover, a father and an old ferryman each sit down hard in the dust, remembering a face they had forgotten they had lost. Nobody knows to thank you. You would not have wanted it.',
        retired:
          'You stop before the last gate and fly home the long way, to the deep cave. The coven has kept your stool. You sit on it, and you do not write in their book, and nobody asks you to. In the years after, the young ones bring their buyers to you before they look, and you make them say the price out loud until saying it is the custom and the book gathers dust.',
      },
      bittersweet: {
        id: 'ash-paid-in-full',
        tone: 'bittersweet',
        title: 'Paid in Full',
        path: 'Every price your own, until there was nothing left to pay with',
        opening:
          "You paid your own way, every time: a memory for a lost child found, a memory for a road read true, a memory for a name kept in a stranger's mouth. Somewhere past the canyons you reached for the cave, for your mother's voice, for the colour of the deep water, and found smooth places where they used to be. You can still see. You have nothing left to see by.",
        complete:
          "You cross the Verge without knowing what you left behind, which is a mercy of a kind. Beyond it you read the way for anyone who asks and charge nothing, because there is nothing left in you to take. Travelers say the old crow at the fork knows everyone's way home but her own. They are right, and when they say it to your face you nod as if it were a story about someone else.",
        fallen:
          "The road takes you on a cold night at a fork you could have read with your eyes shut. When the coven hears, they cannot write you in the book, because nobody remembers your true name, not even them. They write Old Ash, and under it, for the first time in the book's long history, the words paid in full.",
        retired:
          'You stop at a farm on the edge of the Homestead, where a family lets you roost in the barn in return for reading the weather. You are good at it. You cannot remember where you came from or why there is ash on your wings, and some mornings you wake certain you left something in a cave. Then the children bring you bread, and you forget to wonder.',
      },
      dark: {
        id: 'ash-a-full-string',
        tone: 'dark',
        title: 'A Full String',
        path: "The coven's price, taken the coven's way",
        opening:
          'You took the sweetest one, the way you were taught, and it was easy, and it fed you for a week. After that it was easier. The string round your neck grows heavier at every crossroads: a first word here, a wedding there, the face of a child who was looked for and never quite remembered. You sleep well now. That is the worst of it.',
        complete:
          'Beyond the Verge you set up at the busiest crossroads in the black country and sell sight to everyone who comes, and you never once say the price until after. Your string is wound three times round your neck. The coven sends a fledgling to ask you home to your old stool. You take her price too, before you send her back. She does not remember why she came.',
        fallen:
          "The road takes you with your string full, and every bead cracks when you fall. For a mile around the crossroads, travelers stop in the road, struck by faces and days and names they had forgotten were ever theirs. Some weep. Some sit down and laugh. A father on the mission road remembers his daughter's face all at once, and walks faster.",
        retired:
          "You fly home to the deep cave with your string full and lay it on the coven's table, and they make you eldest. You keep the new book yourself, in a fine clear hand, and no debt in it is ever paid, because you never say what is owed. Sometimes, in the dark, you reach for a memory of your own and find somebody else's.",
      },
    },
  },
  {
    characterId: 'hester-kell',
    hopeful: [
      'hester-asked-why',
      'hester-paid-it-down',
      'hester-found-the-flaw',
      'hester-drew-a-line',
      'hester-heard-him-out',
      'hester-tore-the-writ',
      'hester-showed-the-book',
      'hester-served-the-water-house',
    ],
    dark: ['hester-served-the-boys-writ'],
    redeems: [],
    endings: {
      hopeful: {
        id: 'hester-the-writ-turned-round',
        tone: 'hopeful',
        title: 'The Writ Turned Round',
        path: 'An honest hunter who serves paper on the ones who write it',
        opening:
          'Somewhere on the road your book changed. The first half is names and prices, honest as the day you wrote them. The second half is questions: who wrote the paper, what it was really for, and who was paid to keep quiet. You still read every writ aloud. You just read more of them back to the ones who signed them.',
        complete:
          'You cross the Verge with your book under your arm and a writ in your coat that names a water house, a land office and a quarry company. Past the last gate there are magistrates nobody has bought yet, and you find one. Other hunters ask what you hunt these days. You tell them, honest as ever: paper, and the ones who write it.',
        fallen:
          'The road takes you with a writ still in your coat, and the magistrate who finds it on you reads it through twice. She seals a fresh copy and gives it to the next hunter who asks for work, a young one, and tells her to read it aloud to whoever she serves it on. The young one does. She keeps a book too.',
        retired:
          'You stop before the last gate, at a crossroads where three counties meet, and hang out a shingle: writs read, aloud and free. Families bring you the paper served on them, and you read it to them slowly, every date and every figure. More often than anyone would expect, you find the mistake.',
      },
      bittersweet: {
        id: 'hester-the-last-line-in-the-book',
        tone: 'bittersweet',
        title: 'The Last Line in the Book',
        path: 'A hunter who stopped, and wrote down why',
        opening:
          'You hunted the coyote across every land there is, and somewhere on the way you stopped being sure who you were hunting him for. The writ is still in your coat. Some nights you read it by the fire, every word, and it says what it always said. It is you who reads it differently now.',
        complete:
          'Past the Verge you write the last line in your book: no more writs, the date, and your own name signed under it. You sell your rope and your irons. You keep the book. Some nights you read it from the first page, all those names, and try to remember which of them were right, and there are more you are unsure of than you would like.',
        fallen:
          'The road takes you before you close the book. Whoever finds it reads every line, the names and prices and dates, and the last pages full of crossings-out and second thoughts. They do not know what to make of it. They bury it with you, which is probably what you would have wanted.',
        retired:
          'You stop short of the last gate and take work that has nothing to do with paper: mending fences for a widow who never asks what you did before. The writ you carried all that way goes into her stove one cold evening. In the book you do not write lost. You write burned, and the reason, and the date.',
      },
      dark: {
        id: 'hester-a-good-writ',
        tone: 'dark',
        title: 'A Good Writ',
        path: 'Paper that is always good, served on whoever it names',
        opening:
          'Every writ you served was good paper: dated, sealed and signed. You checked them all. That is what you tell yourself, and it is true, and that is the trouble with it. After the boy on the ledge it got easier. The fee went in the purse, the name went in the book, and the lines all looked the same.',
        complete:
          'Beyond the Verge there are companies with more paper than they can serve, and you are the hunter they send. You are honest about it. You read every writ aloud. Debtors, runaways, children, whoever the paper names, you read it to them first, and then you take them in. Your book fills up, and you buy a second one.',
        fallen:
          'The road takes you with your book full. A company clerk collects your things, keeps the irons and the rope, and sends the book back to the office, where they find it very useful: every name, every date, every price, in a square honest hand. They give it to the next hunter, who does not bother to read anything aloud.',
        retired:
          'You stop before the last gate with a full purse and buy a house in a company town where your work is respected. On the mantel your books stand in a row. Some mornings a child goes past the window on the way to the quarry, and you find yourself reaching for a pen to check the date.',
      },
    },
  },
  {
    characterId: 'gideon-vane',
    hopeful: [
      'gideon-gave-back-the-water',
      'gideon-said-it-aloud',
      'gideon-carried-the-names',
      'gideon-waited-his-turn',
      'gideon-filled-the-boys-jug',
      'gideon-told-how-it-starts',
      'gideon-weighed-it-fair',
    ],
    dark: ['gideon-wrote-three-names'],
    redeems: ['gideon-broke-the-bargain'],
    endings: {
      hopeful: {
        id: 'gideon-the-water-goes-home',
        tone: 'hopeful',
        title: 'The Water Goes Home',
        path: 'Every cup given back, every name carried',
        opening:
          "You walked out of Dustwater with the town's water in your coat and eleven names you had taught yourself to forget. Somewhere along the road you gave back the first and found the second. You did not become a good man. You became a man who knows exactly what he did and says so, and that turns out to be the only place to start.",
        complete:
          'Beyond the Verge you find four of the eleven, taller than you remembered, and you ask them for nothing. You take work digging wells for towns that cannot pay, and you leave every one of them unlocked. In the first stone of each new well you scratch a name, and you keep digging until you have used all eleven.',
        fallen:
          'The road takes you somewhere between one well and the next. Dustwater never puts up a plate for you, and you would not have wanted one. But the town water runs free past the old water house now, and the children who drink at the trough have never had to hold up a ticket, and not one of them knows your name.',
        retired:
          'You stop before the last gate and stay in a dry little town with a dry little well, and you spend the rest of your days keeping it honest: a chalk ration line, a key on a nail, a cup for anybody. Children come to the well without being sent. You watch them come and go, and you count them, and they are always all there.',
      },
      bittersweet: {
        id: 'gideon-the-plate-in-the-ditch',
        tone: 'bittersweet',
        title: 'The Plate in the Ditch',
        path: 'Sorry, said aloud, and never quite enough',
        opening:
          "You tried. Nobody on the road could say you didn't. You gave back what you could and said out loud what you had done, and every word was true, and none of it brought anyone home. The water flows. The names are written down. The ledger at the mission is still open, and you were not the one who closed it.",
        complete:
          'You cross the Verge alone and find a town that has never heard of Dustwater, and you tell them anyway, the first night, in the tavern, the whole of it. They listen politely. Then they go back to their cards. You learn that being sorry is a thing you carry by yourself, and you carry it through every town after that.',
        fallen:
          'The road takes you with eleven names written on the back of a deed that no longer means anything, and whoever finds you reads the list and does not understand it. They bury the deed with you. Somewhere a grown girl in a grey apron hears that you are dead, finds she does not know what to feel, and goes on ladling.',
        retired:
          'You stop walking and go back to Dustwater, which is the hardest road of all, and you live in a shed behind the town trough where anyone who wants to can find you and say what they need to say. Most days nobody comes. Some days somebody does, and you stand there and take it, and you are grateful.',
      },
      dark: {
        id: 'gideon-the-spring-flows',
        tone: 'dark',
        title: 'The Spring Flows',
        path: 'Water again, on the old terms',
        opening:
          'You walked away from it once. That was the hard part, and you did it, and then the road was long and the drought was longer, and Mother wrote so kindly. Three names. Then three more. The spring flows for whoever holds the deed, and you still hold it, and Mother has kept your chair.',
        complete:
          'Past the Verge there are towns dying of thirst, and you bring them water, as much as they can drink. They put up brass plates for you. You do not ask what Mother asks in return, because you know, and the towns do not ask either. Every new moon a wagon goes out with its canvas tied down. You have stopped counting them.',
        fallen:
          'The road takes you before you can enjoy it, and the deed passes, as such things do, to whoever was standing nearest. Mother writes to them the very next week. Her letter is very kind. In it she asks only for a few names, and mentions in passing how generous you always were.',
        retired:
          'You stop before the last gate and go home to Dustwater, where the water house is yours again, the town is grateful again, and the plate on the mission gate is polished every week. You have a good chair by the window. From it you can see the road, and the wagons on it, and you have taught yourself not to look.',
      },
    },
  },
  {
    characterId: 'tamsin',
    hopeful: [
      'tamsin-led-the-catchers-astray',
      'tamsin-read-the-ledger',
      'tamsin-cleared-the-children',
      'tamsin-marked-the-glass',
      'tamsin-taught-her-daughter',
      'tamsin-reset-the-line',
      'tamsin-spoke-for-the-widow',
      'tamsin-counted-the-five-years',
    ],
    dark: ['tamsin-led-the-catchers'],
    redeems: ['tamsin-led-the-debtors-out'],
    endings: {
      hopeful: {
        id: 'tamsin-every-cairn-standing',
        tone: 'hopeful',
        title: 'Every Cairn Standing',
        path: 'A guide who builds the road for the ones behind her',
        opening:
          'Somewhere along the road you stopped picking up stones to sell the way and started picking them up to give it away. Wenna noticed before you did. She carries her own pocketful now, and builds where you tell her, and sometimes where you do not, and she is usually right.',
        complete:
          'You cross the Verge, and the first thing you do on the far side is build a cairn, three stones high, so the next ones know the ground holds. Then you take work guiding for the territory, paid by the season and not by the traveler. Your name is on no board anywhere. Wenna learns to read, Pip learns to count, and on the way to school they straighten any marker that has fallen.',
        fallen:
          'The road takes you before the last gate. Behind you, across the Tablelands and the caves and the black glass, the cairns you built go on standing, and travelers who never heard your name walk past them every day without a wrong step. Wenna keeps building them. When strangers ask who taught her, she says her mother did, on a ledge, by undoing it.',
        retired:
          'You go back to the Tablelands and stack the five cairns on the ledge yourself, one a day, with Pip handing you the stones. Then you guide anyone who asks, take what they can spare, and refuse nobody who cannot. The quarry company sends you a letter about the debt. You use it to light the stove, and the stove draws well.',
      },
      bittersweet: {
        id: 'tamsin-paid-late',
        tone: 'bittersweet',
        title: 'Paid, Late',
        path: 'The debt cleared, and the ledge still crooked',
        opening:
          'You did right, mostly, and it cost what right costs on a road like this one: food, and time, and the easy way. The debt is smaller than it was and it is not gone. Some of the cairns you rebuilt. Some you never got back to. You know which ones, and some nights you count them instead of sleeping.',
        complete:
          'Beyond the Verge you find work guiding wagons over passes nobody owns yet. It pays. Each season you send what you can to the quarry company, and each season the clerk writes back with a smaller number, until one spring the letter says nothing is owed. You read it twice. Then you sit down on the step and laugh until Wenna comes out to see what is wrong.',
        fallen:
          'The road takes you with the debt still on the board. The company writes to your children about it once, and Wenna, older now and able to read a ledger, writes back listing every figure in it that is wrong. They do not write again. She folds the letter into a cairn on the ledge where you once kicked five down, and leaves it there.',
        retired:
          'You stop on the far edge of the Tablelands, close enough to the ledge to keep the cairns standing and far enough from the quarry not to hear the hammers. It is a poor living. Pip grows up thinking every guide builds the way back behind her. Wenna knows better, and loves you anyway, which is the harder thing.',
      },
      dark: {
        id: 'tamsin-the-companys-guide',
        tone: 'dark',
        title: "The Company's Guide",
        path: 'A clean board, and every cairn pointing back to the quarry',
        opening:
          "The board is clean. Your name is gone, and Corran's, and nobody ever wrote the children's in. You have a company coat now and a company wage, paid in scrip, and a standing job reading the stones that runaways leave. You are the best there is. They tell you so at the quarry, every time a line comes back up the switchbacks.",
        complete:
          'Beyond the Verge the company opens a new cut, and it sends you ahead to read the country. You do. You also read the little cairns that debtors leave each other, three stones and a flat one, two and a split one, and you read them aloud to the catchers. Wenna rides with you now. She is good at it. You never taught her to be. She watched.',
        fallen:
          'The road takes you on a job, reading a trail for the catchers in a canyon you did not know well enough. The company sends your last pay to your children in scrip, good only at the company store. Wenna carries it up to the quarry rim, reads the debt board out of habit, and finds a fresh line someone has started under her own name.',
        retired:
          'You hand back the company coat and go home to the ledge where the five cairns used to stand. The company does not argue; you are owed nothing and owe nothing, which is what they promised. Some evenings a family comes along the ledge and asks the way, and you tell them. Some evenings you see small cairns in the forks below, and you do not go down to read them.',
      },
    },
  },
  {
    characterId: 'augustin',
    hopeful: [
      'augustin-stood-in-the-door',
      'augustin-told-the-boy-the-truth',
      'augustin-held-the-roof',
      'augustin-sat-down-in-the-ring',
      'augustin-heard-of-nell',
      'augustin-carried-the-mule',
      'augustin-hauled-for-five',
      'augustin-took-his-paper',
    ],
    dark: ['augustin-fought-for-the-purse'],
    redeems: ['augustin-gave-the-purse-away'],
    endings: {
      hopeful: {
        id: 'augustin-shoulders-for-the-small',
        tone: 'hopeful',
        title: 'Shoulders for the Small',
        path: 'A champion who kept his fists shut and his arms open',
        opening:
          'You never fought for a purse again. You lifted, and carried, and stood in doorways, and sat down in rings until the crowds went home, and somewhere along the road the children stopped staring at the size of you and started climbing on it. The bills in the Verge still call you the Iron Saint. Nobody who has met you does.',
        complete:
          'At the last gate you ask after a pangolin girl named Nell, as you have asked at every gate, and this time a warden points. She is older and wary, and she curls up tight the moment she sees you, because the last time she saw you was in the ring. You sit down in the dust and wait. It takes most of a day. Then she uncurls, and you carry her across the Verge on your shoulders.',
        fallen:
          'The road takes you holding something up: a roof, a cart, a door, it hardly matters which. The ones you held it for get out from under. Years later, beyond the Verge, a pangolin woman who once stood in an iron ring tells her children about the biggest gorilla in the world, who would not fight her, and spent the rest of his life making up for leaving.',
        retired:
          'You stop before the last gate at a farm on the edge of the Homestead, where a widow needed a field turned and never asked you to leave. You pull the plough in spring and lift the kits onto the hay in summer. Your old fight bill hangs in the barn, and the kits draw on it, a hat, a flower, a smile, until nobody could tell it was ever a fighter.',
      },
      bittersweet: {
        id: 'augustin-kept-the-vow',
        tone: 'bittersweet',
        title: 'Kept the Vow',
        path: 'Never a purse, never a blow, and never quite in time',
        opening:
          'You kept the vow. Not a purse, not a blow, not once, though there were nights when one blow would have saved a great deal of trouble and you knew it, and stood there anyway with your hands open and took what came. You are proud of that. You are also tired, and some of the trouble you did not stop fell on others.',
        complete:
          'You cross the Verge asking after a pangolin girl named Nell, and beyond it you find her name chalked on a schoolhouse slate in a careful hand, and a teacher who says she grew up and went west two summers ago, and was happy. You were too late to carry her out. Someone else did. You stand in the empty schoolroom a long time, and then you mend its roof, because it leaks.',
        fallen:
          'The road takes you standing in a doorway you would not leave and would not fight for. The ones behind you live; you made sure of it in the only way you had. When Madam Ferrule hears, she hangs your old bill over her ring with a black band across it and sells more tickets than ever. Nobody who knew you buys one.',
        retired:
          "You stop before the last gate and go back toward the Verge's iron rings alone, to stand outside their gates and talk the young ones out of going in. Most of them go in anyway. A few do not. You keep a tally on a fence post of the ones who walked away with you. It is a short tally, and you are prouder of it than of any belt you ever won.",
      },
      dark: {
        id: 'augustin-the-iron-saint-returns',
        tone: 'dark',
        title: 'The Iron Saint Returns',
        path: 'Back in the ring, for the purse and the roar',
        opening:
          "You took the purse, and the roar came up through your feet the way it always had, and it was the easiest night's work you had done in years. After that the road got shorter and the purses got bigger, and somewhere along it you stopped asking what anyone in the other corner was there for.",
        complete:
          'Beyond the Verge Madam Ferrule builds you a new ring of iron, taller than the old, and your face goes back up on the bills twice as wide as you are. You are unbeaten. One night they lead a small, frightened opponent through the gate, and you look at it a long time before you walk out. You do walk out. But it took you longer to decide than it did the first time, and the crowd saw.',
        fallen:
          'The road takes you in the ring, on a purse night, under the iron, with the crowd on its feet. It is a loud end and a quick one. Ferrule sells your old bill the same week. The young hare who once asked you to teach him to fight buys it with his first purse, hangs it over his cot, and goes on fighting.',
        retired:
          'You stop before the last gate with a purse heavy enough to buy a farm, and you buy one, and you sit on its porch with your hands on your knees. They have never stopped aching. Neighbors bring their children to see the famous fighter, and the children stare at your fists, and you put your hands in your pockets and keep them there until they go.',
      },
    },
  },
]

const roads = new Map(ROADS.map((road) => [road.characterId, road]))

export const PERSONAL_ROAD_IDS: readonly string[] = ROADS.map(
  (road) => road.characterId,
)

export function personalEndingsFor(
  characterId: string,
): readonly PersonalEndingCopy[] {
  const road = roads.get(characterId)
  return road ? PERSONAL_TONES.map((tone) => road.endings[tone]) : []
}

// The flags a traveler's thread reads: good turns, dark turns and the turns
// that undo a dark one.
export function personalThreadFlags(characterId: string): {
  hopeful: readonly string[]
  dark: readonly string[]
  redeems: readonly string[]
} | null {
  const road = roads.get(characterId)
  return road
    ? { hopeful: road.hopeful, dark: road.dark, redeems: road.redeems }
    : null
}

export const ALL_PERSONAL_ENDINGS: readonly PersonalEndingCopy[] =
  ROADS.flatMap((road) => personalEndingsFor(road.characterId))

// Which of a traveler's endings their road has earned so far.
export function personalTone(
  characterId: string,
  flags: readonly string[],
): PersonalTone | null {
  const road = roads.get(characterId)
  if (!road) return null
  const held = (flag: string) => flags.includes(flag)
  if (road.dark.some(held) && !road.redeems.some(held)) return 'dark'
  if (road.hopeful.filter(held).length >= HOPEFUL_AT) return 'hopeful'
  return 'bittersweet'
}

// Painted plates that have shipped under public/shifting-lands/endings/.
// Until an ending is listed here, the reader shows the traveler's portrait.
export const SHIPPED_PERSONAL_ENDING_PLATES: ReadonlySet<string> = new Set()
export const personalEndingPlatePath = (endingId: string): string =>
  `/shifting-lands/endings/${endingId}.webp`
export const personalEndingPlate = (endingId: string): string | null =>
  SHIPPED_PERSONAL_ENDING_PLATES.has(endingId)
    ? personalEndingPlatePath(endingId)
    : null

export type PersonalEnding = AuthoredEndingV6 & {
  personal: { characterId: string; endingId: string; tone: PersonalTone }
}

export function personalEndingV10(
  characterId: string,
  state: JourneyStateV6,
  trials: readonly TrialResult[],
): PersonalEnding | null {
  const shared = authoredEndingV7(state, trials)
  const tone = personalTone(characterId, state.flags)
  const phase = state.journey.phase
  if (!shared || !tone) return null
  if (phase !== 'complete' && phase !== 'fallen' && phase !== 'retired')
    return null
  const copy = roads.get(characterId)!.endings[tone]
  return {
    ...shared,
    title: copy.title,
    path: copy.path,
    // The shared opening and phase lines give way to the traveler's own; the
    // deed, the trial and any bargain or constellation the road earned stay.
    paragraphs: [copy.opening, ...shared.paragraphs.slice(2), copy[phase]],
    personal: { characterId, endingId: copy.id, tone },
  }
}

// The scrapbook's record: which of each traveler's own endings this player
// has reached, across every journey. Versioned; the store keeps it in its own
// localStorage key and components only read the pages below.
export const PERSONAL_ENDINGS_RECORD_VERSION = 1
export type PersonalEndingsRecord = {
  version: 1
  found: Record<string, string[]>
}

export const emptyPersonalEndingsRecord = (): PersonalEndingsRecord => ({
  version: PERSONAL_ENDINGS_RECORD_VERSION,
  found: {},
})

// Reads a stored record, keeping only real travelers and their real endings,
// in catalog order. Anything unreadable becomes an empty record.
export function readPersonalEndingsRecord(
  value: unknown,
): PersonalEndingsRecord {
  const record = emptyPersonalEndingsRecord()
  if (!value || typeof value !== 'object' || Array.isArray(value)) return record
  const saved = value as { version?: unknown; found?: unknown }
  if (
    saved.version !== PERSONAL_ENDINGS_RECORD_VERSION ||
    !saved.found ||
    typeof saved.found !== 'object' ||
    Array.isArray(saved.found)
  )
    return record
  const found = saved.found as Record<string, unknown>
  for (const road of ROADS) {
    const ids = Object.hasOwn(found, road.characterId)
      ? found[road.characterId]
      : null
    if (!Array.isArray(ids)) continue
    const kept = personalEndingsFor(road.characterId)
      .map((ending) => ending.id)
      .filter((id) => ids.includes(id))
    if (kept.length) record.found[road.characterId] = kept
  }
  return record
}

// The record with one more ending found; the same object when nothing is new.
export function withPersonalEnding(
  record: PersonalEndingsRecord,
  characterId: string,
  endingId: string,
): PersonalEndingsRecord {
  const catalog = personalEndingsFor(characterId).map((ending) => ending.id)
  const had = record.found[characterId] ?? []
  if (!catalog.includes(endingId) || had.includes(endingId)) return record
  return {
    ...record,
    found: {
      ...record.found,
      [characterId]: catalog.filter(
        (id) => id === endingId || had.includes(id),
      ),
    },
  }
}

export type PersonalScrapbookPage = {
  characterId: string
  name: string
  found: number
  total: number
  endings: Array<{
    id: string
    tone: PersonalTone
    title: string
    found: boolean
    plate: string | null
  }>
}

// One page per premade traveler, in roster order: X of N endings found.
export function personalScrapbook(
  record: PersonalEndingsRecord,
): PersonalScrapbookPage[] {
  return PREMADE_CHARACTERS.filter((entry) => roads.has(entry.id)).map(
    (entry) => {
      const had = record.found[entry.id] ?? []
      const endings = personalEndingsFor(entry.id).map((ending) => ({
        id: ending.id,
        tone: ending.tone,
        title: ending.title,
        found: had.includes(ending.id),
        plate: personalEndingPlate(ending.id),
      }))
      return {
        characterId: entry.id,
        name: entry.name,
        found: endings.filter((ending) => ending.found).length,
        total: endings.length,
        endings,
      }
    },
  )
}
