<template>
  <section
    class="mc-console @container flex h-full min-h-0 w-full flex-col overflow-hidden text-white"
    data-testid="monstress-point-click"
  >
    <div v-if="screen === 'title'" class="mc-opening relative flex min-h-0 flex-1 flex-col">
      <div class="mc-night relative min-h-0 flex-1 overflow-hidden">
        <div class="mc-moon" aria-hidden="true" />
        <div class="mc-motel" aria-hidden="true">
          <div class="mc-windows">
            <span v-for="n in 8" :key="n" class="mc-window" />
          </div>
          <div class="mc-marquee">
            <span class="mc-marquee-top">THE GRAND GLOAMING</span>
            <strong>MONSTRESS <span>CON</span></strong>
            <small>ONE NIGHT ONLY · ROOMS STILL AVAILABLE</small>
          </div>
          <div class="mc-entrance" />
        </div>
        <div class="mc-opening-title">
          <p class="mc-eyebrow">A DEEPLY UNOFFICIAL INVESTIGATION</p>
          <h1>Monstress<br /><em>Convention</em></h1>
          <p class="mc-tagline">Everybody's a monster. Somebody's a murderer.</p>
        </div>
        <div class="mc-rain" aria-hidden="true" />
      </div>
      <div class="mc-title-footer flex shrink-0 flex-wrap items-center justify-between gap-3 p-3">
        <span class="mc-caption">GRAND GLOAMING HOTEL · OPENING CASE</span>
        <button
          type="button"
          class="mc-action-primary"
          data-testid="monstress-start"
          @click="begin"
        >
          <Icon name="kind-icon:door-open" class="size-5" />
          CHECK IN
        </button>
      </div>
    </div>

    <template v-else>
      <div class="mc-action-bar flex shrink-0 flex-wrap items-center gap-2 px-3 py-2">
        <div class="min-w-0 flex-1">
          <p class="mc-eyebrow">{{ room.floor === 2 ? 'SECOND FLOOR' : 'GROUND FLOOR' }}</p>
          <h2 class="mc-location truncate">{{ room.label }}</h2>
        </div>
        <button type="button" class="mc-actor-chip" @click="story.switchActor()">
          <span class="mc-portrait" :class="'is-' + story.state.actor">
            {{ story.state.actor === 'iris' ? 'I' : 'N' }}
          </span>
          <span class="text-left">
            <strong>{{ story.state.actor === 'iris' ? 'IRIS' : 'NICO' }}</strong>
            <small>SWAP <span aria-hidden="true">⇄</span></small>
          </span>
        </button>
        <button
          type="button"
          class="mc-icon-button"
          :aria-pressed="drawer === 'case'"
          aria-label="Case notebook"
          title="Case notebook"
          @click="toggleDrawer('case')"
        >
          <Icon name="kind-icon:book-open" class="size-5" />
          <span class="mc-count">{{ story.state.evidence.length }}</span>
        </button>
        <button
          type="button"
          class="mc-icon-button"
          :aria-pressed="drawer === 'map'"
          aria-label="Hotel floor map"
          title="Hotel floor map"
          @click="toggleDrawer('map')"
        >
          <Icon name="kind-icon:map" class="size-5" />
        </button>
      </div>

      <div
        class="mc-scene relative min-h-0 flex-1 overflow-hidden"
        :data-room="story.state.room"
        :aria-label="room.label"
      >
        <svg
          class="mc-painted-scene absolute inset-0 size-full"
          viewBox="0 0 1000 580"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="mc-wall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#2e314e" />
              <stop offset="1" stop-color="#75515b" />
            </linearGradient>
            <linearGradient id="mc-windowlight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#ffc693" />
              <stop offset="1" stop-color="#a35b89" />
            </linearGradient>
            <linearGradient id="mc-floor" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#2e253b" />
              <stop offset="1" stop-color="#5f2e47" />
            </linearGradient>
          </defs>
          <g v-if="story.state.room === 'parking'">
            <rect width="1000" height="580" fill="#141c38" />
            <circle cx="780" cy="100" r="58" fill="#e6cbb7" opacity=".82" />
            <path d="M0 310L180 270L320 320L580 290L820 330L1000 260V580H0Z" fill="#242a42" />
            <rect x="75" y="160" width="850" height="340" fill="#4b374b" />
            <rect x="110" y="190" width="780" height="245" fill="#715569" />
            <path d="M95 170H905L940 205H60Z" fill="#211e2e" />
            <g v-for="col in 5" :key="col">
              <rect :x="135 + (col - 1) * 150" y="218" width="94" height="95" fill="#1e2034" />
              <rect :x="142 + (col - 1) * 150" y="224" width="80" height="80" fill="url(#mc-windowlight)" />
              <path :d="'M' + (182 + (col - 1) * 150) + ' 224v80'" stroke="#27273d" stroke-width="7" />
            </g>
            <rect x="435" y="329" width="132" height="171" rx="6" fill="#19192d" />
            <rect x="449" y="342" width="103" height="150" fill="#956b76" />
            <rect x="110" y="142" width="500" height="57" rx="8" fill="#2a162d" stroke="#fa6f9f" stroke-width="7" />
            <text x="134" y="182" fill="#ffd7e8" font-size="31" font-weight="900" letter-spacing="4">MONSTRESS CON</text>
            <path d="M0 500H1000V580H0Z" fill="#2d2c49" />
            <path d="M20 545L380 500M520 500L990 555" stroke="#7692a4" opacity=".7" stroke-width="5" />
          </g>
          <g v-else-if="story.state.room === 'courtyard'">
            <rect width="1000" height="580" fill="#182c38" />
            <path d="M0 0H1000V330H0Z" fill="#344758" />
            <path d="M0 330L1000 305V580H0Z" fill="#5f475a" />
            <rect x="160" y="360" width="700" height="155" rx="76" fill="#d7a5a1" />
            <rect x="185" y="374" width="650" height="118" rx="58" fill="#238d98" />
            <g fill="#bbdef1" opacity=".38">
              <ellipse cx="360" cy="300" rx="65" ry="35" />
              <ellipse cx="500" cy="290" rx="90" ry="42" />
              <ellipse cx="660" cy="320" rx="72" ry="30" />
            </g>
            <path d="M60 400V130M915 390V100" stroke="#1b3134" stroke-width="40" />
            <path d="M20 240Q70 90 130 225M865 200Q925 90 995 240" stroke="#3c5e54" stroke-width="32" fill="none" />
            <circle cx="815" cy="115" r="47" fill="#f7b5bc" opacity=".5" />
          </g>
          <g v-else-if="story.state.room === 'stairwell'">
            <rect width="1000" height="580" fill="#343342" />
            <path d="M0 580L850 130H1000V580Z" fill="#514652" />
            <path d="M70 550L850 120" stroke="#ad7f7d" stroke-width="27" />
            <path d="M130 570L920 130" stroke="#202c39" stroke-width="9" />
            <path d="M200 0V580M780 0V580" stroke="#77747d" stroke-width="40" />
            <path d="M260 160H770" stroke="#b6a7a3" stroke-width="20" />
            <circle cx="730" cy="155" r="43" fill="#c99e72" stroke="#292d3c" stroke-width="13" />
            <rect x="650" y="210" width="220" height="215" fill="#242431" />
          </g>
          <g v-else-if="story.state.room === 'suite-205'">
            <rect width="1000" height="580" fill="#392b47" />
            <path d="M0 440L1000 360V580H0Z" fill="#231f33" />
            <rect x="370" y="80" width="320" height="340" rx="90" fill="#6f566c" stroke="#c4a1ad" stroke-width="18" />
            <rect x="405" y="112" width="250" height="274" rx="85" fill="#a0a0b7" opacity=".7" />
            <path d="M440 335Q520 140 610 335" fill="#d0d0e1" opacity=".24" />
            <ellipse cx="520" cy="210" rx="46" ry="55" fill="#dce7ed" opacity=".52" />
            <path d="M455 255Q520 220 585 255L620 360H420Z" fill="#e7eff4" opacity=".4" />
            <path d="M40 410H350V515H40Z" fill="#744d5a" stroke="#a28485" stroke-width="18" />
            <path d="M720 395H970V495H720Z" fill="#744d5a" stroke="#a28485" stroke-width="18" />
          </g>
          <g v-else>
            <rect width="1000" height="580" fill="url(#mc-wall)" />
            <path d="M0 375L1000 360V580H0Z" fill="url(#mc-floor)" />
            <path d="M0 370L1000 356" stroke="#c29b99" stroke-width="11" />
            <rect x="85" y="110" width="250" height="265" fill="#31273c" stroke="#bb9a98" stroke-width="24" />
            <rect x="110" y="130" width="200" height="218" fill="url(#mc-windowlight)" />
            <path d="M208 130V348" stroke="#402f4e" stroke-width="15" />
            <rect x="760" y="105" width="160" height="266" fill="#44334a" stroke="#b09b99" stroke-width="20" />
            <circle cx="840" cy="250" r="8" fill="#e9c9a9" />
            <path d="M395 380V235Q510 185 650 230V378Z" fill="#55344e" stroke="#bc9399" stroke-width="18" />
            <path d="M425 312H615" stroke="#b68c8f" stroke-width="12" />
            <path d="M500 0V75" stroke="#c6ada3" stroke-width="9" />
            <path d="M410 70H585L615 120H380Z" fill="#d7bcb4" />
            <circle cx="500" cy="115" r="35" fill="#ffe4bb" opacity=".8" />
            <g v-if="story.state.room === 'convention'">
              <path d="M0 0H130L170 360H20Z" fill="#842a58" />
              <path d="M880 0H1000V370H840Z" fill="#842a58" />
              <rect x="330" y="375" width="420" height="145" fill="#5f314d" />
              <path d="M320 380H755" stroke="#eabf8d" stroke-width="13" />
            </g>
            <g v-if="story.state.room === 'registration'">
              <rect x="160" y="330" width="680" height="155" fill="#80566b" />
              <path d="M135 335H860" stroke="#deb6a9" stroke-width="19" />
              <rect x="370" y="348" width="260" height="65" fill="#efd0b0" />
            </g>
          </g>
        </svg>
        <div class="mc-shadow absolute inset-0" aria-hidden="true" />
        <p class="mc-scene-stamp">{{ room.floor === 2 ? 'UPSTAIRS' : 'GRAND GLOAMING' }}</p>

        <button
          v-for="hotspot in room.hotspots"
          :key="hotspot.id"
          type="button"
          class="mc-hotspot absolute"
          :class="{ 'is-selected': selected === hotspot.id }"
          :style="{ left: hotspot.x + '%', top: hotspot.y + '%' }"
          :aria-pressed="selected === hotspot.id"
          :aria-label="'Inspect ' + hotspot.label"
          @click="selected = selected === hotspot.id ? null : hotspot.id"
        >
          <span class="mc-hotspot-pip"><Icon name="kind-icon:search" class="size-4" /></span>
          <span class="mc-hotspot-name">{{ hotspot.label }}</span>
        </button>

        <aside v-if="drawer" class="mc-drawer absolute inset-y-0 right-0 z-20 flex flex-col">
          <header class="mc-drawer-header flex items-center gap-2">
            <strong>{{ drawer === 'case' ? 'CASE NOTEBOOK' : 'HOTEL MAP' }}</strong>
            <button
              type="button"
              class="ml-auto rounded-md p-2"
              aria-label="Close drawer"
              @click="drawer = null"
            >
              <Icon name="kind-icon:close" />
            </button>
          </header>
          <div class="kr-scroll min-h-0 flex-1 overflow-y-auto p-3">
            <template v-if="drawer === 'case'">
              <h3 class="mc-eyebrow">EVIDENCE · {{ story.state.evidence.length }}</h3>
              <ul class="mc-note-list">
                <li v-for="entry in story.state.evidence" :key="entry">
                  <Icon name="kind-icon:camera" class="size-4 shrink-0" />
                  {{ EVIDENCE[entry] ?? entry }}
                </li>
                <li v-if="!story.state.evidence.length">No evidence collected. Yet.</li>
              </ul>
              <h3 class="mc-eyebrow mt-4">CONVERSATION TOPICS</h3>
              <ul class="mc-note-list">
                <li v-for="topic in story.state.topics" :key="topic">
                  <Icon name="kind-icon:message-circle" class="size-4 shrink-0" />
                  {{ TOPICS[topic] ?? topic }}
                </li>
              </ul>
            </template>
            <template v-else>
              <h3 class="mc-eyebrow">EXITS FROM {{ room.label }}</h3>
              <div class="flex flex-col gap-2 pt-3">
                <button
                  v-for="exit in room.exits"
                  :key="exit"
                  type="button"
                  class="mc-exit"
                  @click="go(exit)"
                >
                  <Icon name="kind-icon:footprints" class="size-4" />
                  {{ HOTEL_ROOMS[exit].label }}
                </button>
              </div>
            </template>
          </div>
        </aside>
      </div>

      <div class="mc-dialogue flex min-h-0 shrink-0 items-start gap-3 px-3 py-3" aria-live="polite">
        <div class="mc-dialogue-portrait" :class="'is-' + story.state.actor">
          <span>{{ story.state.actor === 'iris' ? 'I' : 'N' }}</span>
        </div>
        <p class="mc-line min-w-0 flex-1">{{ story.currentLine }}</p>
      </div>
      <div v-if="selected && activeHotspot" class="mc-verbs shrink-0 px-3 py-2">
        <div class="flex flex-wrap items-center gap-2">
          <strong class="mc-target mr-auto">{{ activeHotspot.label }}</strong>
          <button
            v-for="verb in activeHotspot.verbs.filter((v) => v !== 'ask')"
            :key="verb"
            type="button"
            class="mc-verb"
            :title="verb"
            @click="story.takeAction({ verb, target: selected! })"
          >
            <Icon :name="verbIcon(verb)" class="size-4" />
            {{ verb }}
          </button>
        </div>
        <div v-if="activeTopics.length" class="flex flex-wrap gap-2 border-t border-white/10 pt-2">
          <button
            v-for="topic in activeTopics"
            :key="topic"
            type="button"
            class="mc-topic"
            @click="story.takeAction({ verb: 'ask', target: selected!, topic })"
          >
            <Icon name="kind-icon:message-circle" class="size-3" />
            {{ TOPICS[topic] ?? topic }}
          </button>
        </div>
      </div>

      <footer class="mc-footer flex min-h-0 shrink-0 items-center gap-2 px-3 py-2">
        <button type="button" class="mc-verb" @click="toggleDrawer('map')">
          <Icon name="kind-icon:map" class="size-4" /> Exits
        </button>
        <div class="mc-inventory flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
          <span class="mc-eyebrow shrink-0">INVENTORY</span>
          <span v-for="item in story.state.inventory" :key="item" class="mc-item">
            <Icon :name="item === 'camera' ? 'kind-icon:camera' : 'kind-icon:ticket'" class="size-4" />
            {{ item === 'fan-pass' ? 'Fan pass' : 'Camera' }}
          </span>
        </div>
        <button type="button" class="mc-verb" @click="screen = 'title'">
          <Icon name="kind-icon:home" class="size-4" />
          <span class="hidden @md:inline">Title</span>
        </button>
      </footer>
      <div v-if="story.state.ending" class="mc-ending absolute inset-0 z-30 grid place-items-center p-5">
        <div class="mc-ending-card max-w-lg space-y-4 text-center">
          <p class="mc-eyebrow">THE FIRST EDITION</p>
          <h2 class="text-3xl font-bold">
            {{ story.state.ending === 'responsible' ? 'An Honest First Edition' : 'A Headline Too Early' }}
          </h2>
          <p class="text-lg">{{ story.currentLine }}</p>
          <button class="mc-action-primary" type="button" @click="begin">NEW CASE</button>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useMonstressConventionStore } from '~/stores/monstressConventionStore'
import {
  availableTopics,
  EVIDENCE,
  HOTEL_ROOMS,
  TOPICS,
  type RoomId,
  type Verb,
} from '~/utils/monstressConvention/prologue'

const story = useMonstressConventionStore()
const screen = ref<'title' | 'stage'>('title')
const drawer = ref<'case' | 'map' | null>(null)
const selected = ref<string | null>(null)
const room = computed(() => HOTEL_ROOMS[story.state.room])
const activeHotspot = computed(() =>
  room.value.hotspots.find((hotspot) => hotspot.id === selected.value),
)
const activeTopics = computed(() =>
  selected.value ? availableTopics(story.state, selected.value) : [],
)

onMounted(() => {
  if (story.state.transcript.length > 1) screen.value = 'stage'
})

function begin(): void {
  story.begin()
  selected.value = null
  drawer.value = null
  screen.value = 'stage'
}

function go(destination: RoomId): void {
  story.move(destination)
  selected.value = null
  drawer.value = null
}

function toggleDrawer(value: 'case' | 'map'): void {
  drawer.value = drawer.value === value ? null : value
  selected.value = null
}

function verbIcon(verb: Verb): string {
  const icons: Record<Verb, string> = {
    walk: 'kind-icon:footprints',
    look: 'kind-icon:eye',
    talk: 'kind-icon:message-circle',
    take: 'kind-icon:hand',
    use: 'kind-icon:hand-metal',
    photograph: 'kind-icon:camera',
    ask: 'kind-icon:message-circle',
  }
  return icons[verb]
}
</script>

<style scoped>
.mc-console {
  font-family: ui-sans-serif, system-ui, sans-serif;
  background: #121a2b;
}
.mc-eyebrow,
.mc-caption,
.mc-target,
.mc-scene-stamp {
  font-size: 0.64rem;
  font-weight: 850;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.mc-opening {
  background: radial-gradient(circle at 75% 10%, #51415a, #10182a 75%);
}
.mc-night { isolation: isolate; }
.mc-moon {
  position: absolute; width: 11rem; aspect-ratio: 1; right: 10%; top: 9%;
  border-radius: 50%; background: #e9c5a8; box-shadow: 0 0 7rem #c18b9a55;
}
.mc-motel {
  position: absolute; width: min(84%, 67rem); height: 65%; left: 8%; bottom: 0;
  background: linear-gradient(#564355, #241b32); border: 0.45rem solid #37283c;
  transform: skewY(-3deg); box-shadow: 0 0 0 1rem #201b2c, 0 -1rem 5rem #0008;
}
.mc-windows {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 6% 7%;
  position: absolute; inset: 9% 6% 28%;
}
.mc-window { background: #daa5a1; border: 0.4rem solid #292437; box-shadow: inset 0 0 3rem #543449; }
.mc-marquee {
  position: absolute; z-index: 1; left: 4%; top: 20%; width: 69%;
  transform: rotate(-2deg); padding: 1.1rem; text-align: center;
  background: #1b1426; border: 0.25rem solid #ff84b4;
  box-shadow: 0 0 2rem #fa5790a0, inset 0 0 1.2rem #a24f6680;
}
.mc-marquee-top { display: block; font-size: clamp(.56rem, 1.4vw, 1rem); letter-spacing: .22em; color: #ffc3d7; }
.mc-marquee strong { display: block; font-size: clamp(1.8rem, 4.7vw, 5.5rem); letter-spacing: -.05em; color: #ff9abf; text-shadow: 0 0 1rem #fe55a9; }
.mc-marquee strong span { color: #ffdc9c; }
.mc-marquee small { font-size: clamp(.45rem, 1vw, .85rem); color: #ffd3d3; }
.mc-entrance { position: absolute; width: 17%; height: 31%; left: 43%; bottom: 0; background: #181627; border: .7rem solid #cca8ac; }
.mc-opening-title { position: absolute; z-index: 2; inset: auto 5% 7%; text-shadow: 0 .3rem 2rem #050716; }
.mc-opening-title h1 { margin: .6rem 0; font-family: Georgia, serif; font-weight: 900; font-size: clamp(3.5rem, 8vw, 8rem); letter-spacing: -.08em; line-height: .84; }
.mc-opening-title h1 em { color: #ff8fba; font-style: normal; }
.mc-tagline { font-size: clamp(.8rem, 1.6vw, 1.2rem); color: #ffe0cb; font-weight: 700; }
.mc-rain { position: absolute; inset: 0; background: repeating-linear-gradient(108deg, #ffffff14 0 1px, transparent 1px 33px); opacity: .6; pointer-events: none; }
.mc-title-footer, .mc-action-bar, .mc-footer { background: #191523; border-top: 1px solid #7d5366; }
.mc-action-primary {
  display: inline-flex; gap: .6rem; align-items: center; justify-content: center;
  border: .15rem solid #ffd0b2; padding: .75rem 1.35rem; background: #a83e71;
  color: white; font-weight: 900; letter-spacing: .12em; border-radius: .6rem;
  box-shadow: 0 .35rem 0 #4f2346;
}
.mc-location { font-family: Georgia, serif; font-size: clamp(1.1rem, 2.2vw, 1.65rem); font-weight: 800; }
.mc-actor-chip { display: flex; align-items: center; gap: .5rem; border: 1px solid #915b73; padding: .25rem .5rem; border-radius: .8rem; background: #31283b; }
.mc-actor-chip strong, .mc-actor-chip small { display: block; font-size: .65rem; letter-spacing: .13em; }
.mc-actor-chip small { opacity: .65; }
.mc-portrait, .mc-dialogue-portrait { display: grid; place-items: center; background: linear-gradient(120deg, #7e3256, #d895a7); color: white; font: 800 1.4rem Georgia, serif; border-radius: .65rem; }
.mc-portrait { width: 2.25rem; height: 2.25rem; }
.mc-portrait.is-iris, .mc-dialogue-portrait.is-iris { background: linear-gradient(120deg, #326870, #b5d2c5); color: #173744; }
.mc-icon-button { position: relative; display: grid; place-items: center; min-width: 2.6rem; height: 2.6rem; border-radius: .65rem; background: #322b43; border: 1px solid #7d5366; }
.mc-count { position: absolute; right: -.3rem; top: -.3rem; font-size: .6rem; padding: 0 .25rem; border-radius: 1rem; background: #ad4878; }
.mc-scene { background: #20253a; }
.mc-painted-scene { filter: saturate(.9) contrast(1.07); }
.mc-shadow { background: linear-gradient(180deg, #0e122344 0%, transparent 27%, transparent 64%, #080917a6 100%); }
.mc-scene-stamp { position: absolute; left: 1rem; top: .8rem; opacity: .55; text-shadow: 0 2px 10px black; }
.mc-hotspot { z-index: 4; transform: translate(-50%, -50%); display: flex; align-items: center; gap: .3rem; flex-direction: column; min-width: 2.65rem; }
.mc-hotspot-pip { display: grid; place-items: center; width: 2.65rem; height: 2.65rem; border-radius: 999px; border: 2px solid #ffdbbe; background: #391d40db; box-shadow: 0 0 1rem #ff83ad7a; }
.mc-hotspot-name { border-radius: .4rem; background: #171324e0; padding: .2rem .45rem; font-size: .67rem; font-weight: 800; white-space: nowrap; }
.mc-hotspot.is-selected .mc-hotspot-pip { background: #ac3d78; outline: 3px solid #fff6; }
.mc-dialogue { background: #251b32; border-top: 2px solid #93627a; min-height: 4.3rem; max-height: 6rem; overflow: hidden; }
.mc-dialogue-portrait { width: 2.75rem; height: 2.75rem; flex-shrink: 0; border: 2px solid #e0b7ad; }
.mc-line { font-family: Georgia, serif; font-size: clamp(.82rem, 1.4vw, 1.15rem); line-height: 1.35; }
.mc-verbs { background: #231c2f; border-top: 1px solid #5e4159; }
.mc-verb, .mc-topic, .mc-exit, .mc-item { display: inline-flex; align-items: center; gap: .35rem; white-space: nowrap; font-size: .75rem; border: 1px solid #806078; padding: .44rem .6rem; border-radius: .65rem; background: #392b49; text-transform: capitalize; }
.mc-verb:hover, .mc-topic:hover, .mc-exit:hover { background: #8a3f6d; }
.mc-topic { background: #3c4252; }
.mc-inventory { scrollbar-width: thin; }
.mc-item { background: #45364d; }
.mc-drawer { width: min(84%, 23rem); background: #211c2d; border-left: 2px solid #ad7990; box-shadow: -1rem 0 2rem #0008; }
.mc-drawer-header { padding: .85rem; border-bottom: 1px solid #95637d; font-size: .75rem; letter-spacing: .14em; }
.mc-note-list { padding-top: .7rem; display: grid; gap: .4rem; }
.mc-note-list li { display: flex; align-items: flex-start; gap: .5rem; padding: .55rem; background: #3a304a; border-radius: .55rem; font-size: .82rem; }
.mc-exit { text-align: left; white-space: normal; }
.mc-ending { background: #100f22ed; }
.mc-ending-card { background: #342338; border: 2px solid #e2a5ba; border-radius: 1.5rem; padding: 2rem; box-shadow: 0 0 5rem #f36a9b35; }
.mc-action-primary:focus-visible, .mc-verb:focus-visible, .mc-hotspot:focus-visible, .mc-icon-button:focus-visible, .mc-exit:focus-visible { outline: 3px solid #ffe4c7; outline-offset: 3px; }
@container (max-width: 36rem) {
  .mc-hotspot-name { display: none; }
  .mc-marquee { top: 10%; width: 82%; }
  .mc-opening-title { bottom: 12%; }
  .mc-title-footer { justify-content: center; }
  .mc-caption { display: none; }
  .mc-verbs { max-height: 9rem; overflow-y: auto; }
  .mc-actor-chip strong { font-size: .6rem; }
}
@media (prefers-reduced-motion: reduce) {
  .mc-rain { display: none; }
}
</style>
