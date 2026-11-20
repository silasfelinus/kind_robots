<template>
  <main class="kr-surface kr-scroll min-h-0">
    <div
      class="mx-auto flex h-full min-h-0 w-full max-w-[1500px] flex-col gap-2 p-2 sm:p-3"
    >
      <header-page-bar>
        <nav
          class="flex min-w-0 flex-1 items-center gap-2"
          aria-label="Meme maker navigation"
        >
          <NuxtLink to="/play/arcade" class="btn btn-ghost btn-sm shrink-0">
            ← Arcade
          </NuxtLink>
          <span class="min-w-0 flex-1 truncate text-sm font-bold">
            Account Banned · Meme Lab
          </span>
          <button
            type="button"
            class="btn btn-primary btn-sm shrink-0"
            :disabled="!ready || exporting"
            @click="downloadImage"
          >
            {{ exporting ? 'Exporting…' : 'Save PNG' }}
          </button>
        </nav>
      </header-page-bar>

      <div
        class="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(15rem,19rem)] sm:grid-rows-1 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,21rem)]"
      >
        <section
          class="relative flex min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-2xl border border-base-content/20 bg-[#0f0e1d] p-1 shadow-xl sm:p-3"
          aria-label="Live meme preview"
        >
          <canvas
            ref="previewCanvas"
            width="2048"
            height="2048"
            role="img"
            :aria-label="`Account Banned meme: due to you ${normalizedReason}. This ban is permanent and is not eligible for appeal.`"
            class="block aspect-square max-h-full max-w-full object-contain"
            data-testid="ban-meme-preview"
          />
          <p v-if="!ready" class="absolute text-sm text-white">
            Preparing the crime scene…
          </p>
        </section>

        <aside
          class="flex min-h-0 min-w-0 flex-col gap-3 rounded-2xl border border-base-content/20 bg-base-200 p-3 shadow-lg lg:p-4"
          aria-label="Edit your ban notice"
        >
          <div class="hidden lg:block">
            <p class="text-xs font-bold uppercase tracking-[.2em] text-primary">
              You have been accused
            </p>
            <h2 class="text-2xl font-black">Rewrite the crime.</h2>
            <p class="mt-1 text-xs opacity-65">
              Same screenshot. New outrage. Absolutely no appeals.
            </p>
          </div>

          <label class="flex min-h-0 flex-col gap-1.5" for="ban-reason">
            <span class="text-sm font-bold">Due to you…</span>
            <textarea
              id="ban-reason"
              v-model="reason"
              maxlength="220"
              rows="3"
              class="textarea textarea-bordered w-full resize-none text-base leading-snug"
              placeholder="walking past the dog twenty times without petting him"
              spellcheck="true"
              data-testid="ban-meme-reason"
            />
          </label>

          <div
            class="flex items-center justify-between gap-2 text-xs opacity-65"
          >
            <span>The original permanent-ban line stays intact.</span>
            <span class="shrink-0 tabular-nums">{{ reason.length }}/220</span>
          </div>

          <div class="flex flex-wrap gap-1.5" aria-label="Example offenses">
            <button
              v-for="example in examples"
              :key="example.label"
              type="button"
              class="btn btn-outline btn-xs"
              @click="reason = example.text"
            >
              {{ example.label }}
            </button>
          </div>

          <div class="flex gap-2 lg:mt-auto">
            <button
              type="button"
              class="btn btn-primary min-w-0 flex-1"
              :disabled="!ready || exporting"
              @click="downloadImage"
            >
              Save image
            </button>
            <button
              type="button"
              class="btn btn-secondary min-w-0 flex-1"
              :disabled="!ready || exporting"
              @click="shareImage"
            >
              Share
            </button>
            <button
              type="button"
              class="btn btn-ghost"
              aria-label="Reset example offense"
              title="Reset example offense"
              @click="reason = initialReason"
            >
              Reset
            </button>
          </div>
          <GuestFundraiserStrip />
          <p v-if="feedback" class="text-xs" role="status">
            {{ feedback }}
          </p>
          <p class="hidden text-[.7rem] opacity-50 lg:block">
            Unofficial parody. Not affiliated with Rockstar Games.
          </p>
        </aside>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { gameLinkPreviewMeta } from '~/utils/gameLinkPreview'
import { shareableUrl } from '~/utils/supportShare'

const originalWidth = 2048
const initialReason = 'walking past the dog twenty times without petting him'
const reason = ref(initialReason)
const normalizedReason = computed(
  () => reason.value.trim().replace(/\s+/g, ' ') || 'doing absolutely nothing',
)
const examples = [
  { label: 'Petting violation', text: initialReason },
  {
    label: 'In-game scrolling',
    text: 'spending the last 36 hours in-game scrolling on your phone',
  },
  { label: 'Unpaid gratitude', text: 'not tipping the barista' },
] as const

const previewCanvas = ref<HTMLCanvasElement | null>(null)
const ready = ref(false)
const exporting = ref(false)
const feedback = ref('')
let baseImage: HTMLImageElement | null = null

function wrapLines(
  context: CanvasRenderingContext2D,
  copy: string,
  maxWidth: number,
) {
  const lines: string[] = []
  let line = ''

  for (const word of copy.split(' ')) {
    const candidate = line ? `${line} ${word}` : word
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
  return lines
}

function drawNotice() {
  const canvas = previewCanvas.value
  if (!canvas || !baseImage) return

  const context = canvas.getContext('2d')
  if (!context) return
  context.clearRect(0, 0, originalWidth, originalWidth)
  context.drawImage(baseImage, 0, 0, originalWidth, originalWidth)

  const offense = normalizedReason.value
  const endMark = /[.!?…]$/.test(offense) ? '' : '.'
  const copy =
    'Your Rockstar Games account has been permanently banned from ' +
    `Grand Theft Auto VI due to you ${offense}${endMark}`

  const maxTextWidth = 1530
  let fontSize = 47
  let lines: string[] = []
  for (; fontSize >= 27; fontSize -= 1) {
    context.font = `600 ${fontSize}px Arial, Helvetica, sans-serif`
    lines = wrapLines(context, copy, maxTextWidth)
    if (lines.length * fontSize * 1.26 <= 249) break
  }

  const lineHeight = fontSize * 1.26
  const blockHeight = lines.length * lineHeight
  const firstBaseline = 1193 - blockHeight / 2 + lineHeight * 0.75

  context.save()
  context.fillStyle = '#f6f5f8'
  context.textAlign = 'center'
  context.textBaseline = 'alphabetic'
  context.shadowColor = 'rgba(0, 0, 0, 0.96)'
  context.shadowBlur = 4
  context.shadowOffsetX = 2
  context.shadowOffsetY = 3
  for (const [index, line] of lines.entries()) {
    context.fillText(
      line,
      originalWidth / 2,
      firstBaseline + index * lineHeight,
      maxTextWidth,
    )
  }
  context.restore()
}

function getPng() {
  const canvas = previewCanvas.value
  return new Promise<Blob | null>((resolve) => {
    if (!canvas) return resolve(null)
    canvas.toBlob(resolve, 'image/png')
  })
}

function saveBlob(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'account-banned-kind-robots.png'
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function downloadImage() {
  if (!ready.value || exporting.value) return
  exporting.value = true
  feedback.value = ''
  try {
    const blob = await getPng()
    if (!blob) throw new Error('Image export failed')
    saveBlob(blob)
    feedback.value = 'Saved as a PNG.'
  } catch {
    feedback.value = 'Could not save the image on this device.'
  } finally {
    exporting.value = false
  }
}

async function shareImage() {
  if (!ready.value || exporting.value) return
  exporting.value = true
  feedback.value = ''
  try {
    const blob = await getPng()
    if (!blob) throw new Error('Image export failed')
    const file = new File([blob], 'account-banned.png', { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'Account Banned Meme Lab',
        text: `Make your own ban notice at ${shareableUrl('/play')}. Free, ad-free, and supporting malaria prevention.`,
      })
    } else {
      saveBlob(blob)
      feedback.value = 'Image saved. You can share it from your downloads.'
    }
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'AbortError')) {
      feedback.value = 'Could not share the image on this device.'
    }
  } finally {
    exporting.value = false
  }
}

watch(reason, drawNotice)
onMounted(() => {
  const image = new Image()
  image.onload = () => {
    baseImage = image
    ready.value = true
    drawNotice()
  }
  image.onerror = () => {
    if (image.src.endsWith('/ban-meme/base.avif')) {
      image.src = '/ban-meme/base.webp'
      return
    }
    feedback.value = 'The screenshot template could not be loaded.'
  }
  image.src = '/ban-meme/base.avif'
})

useHead({ title: 'Account Banned Meme Lab · Kind Robots' })
useSeoMeta(
  gameLinkPreviewMeta('ban-meme', useRuntimeConfig().public.appBaseUrl) ?? {},
)
</script>
