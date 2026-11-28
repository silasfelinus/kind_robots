<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useGroupChatStore } from '~/stores/groupChatStore'
import { useUserStore } from '~/stores/userStore'
import { CHAT_MESSAGE_MAX, chatRoomBySlug } from '~/utils/community/rooms'

const props = defineProps<{ room: string }>()
const emit = defineEmits<{ sent: [] }>()

const store = useGroupChatStore()
const userStore = useUserStore()
const draft = ref('')
const list = ref<HTMLElement | null>(null)

const spec = computed(() => chatRoomBySlug(props.room))
const state = computed(() => store.room(props.room))
const canJoin = computed(
  () => userStore.isLoggedIn && !userStore.isMaturityRestricted,
)

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

async function send() {
  if (await store.send(props.room, draft.value)) {
    draft.value = ''
    emit('sent')
  }
}

watch(
  () => state.value.messages.length,
  async () => {
    await nextTick()
    const el = list.value
    if (el) el.scrollTop = el.scrollHeight
  },
)

watch(canJoin, (joined) => {
  if (joined) store.open(props.room)
  else store.close(props.room)
})

onMounted(() => {
  if (canJoin.value) store.open(props.room)
})
onBeforeUnmount(() => store.close(props.room))
</script>

<template>
  <section
    class="flex min-h-0 flex-1 flex-col gap-2"
    :aria-label="spec?.title ?? 'Group chat'"
    data-testid="group-chat"
  >
    <header class="flex flex-wrap items-baseline gap-x-2 px-1">
      <h2 class="shrink-0 whitespace-nowrap text-sm font-black">
        {{ spec?.title }}
      </h2>
      <span class="text-xs opacity-75">{{ spec?.welcome }}</span>
    </header>

    <div
      v-if="!canJoin"
      class="grid flex-1 place-content-center rounded-2xl border border-base-content/10 p-6 text-center text-sm"
    >
      <p v-if="!userStore.isLoggedIn">Sign in to join the conversation.</p>
      <p v-else>Group chat is for adult accounts.</p>
    </div>

    <template v-else>
      <ol
        ref="list"
        class="kr-scroll space-y-2 rounded-2xl border border-base-content/10 bg-base-200/60 p-3"
        aria-live="polite"
      >
        <li
          v-if="!state.messages.length"
          class="py-6 text-center text-xs opacity-75"
        >
          No messages yet. Say hello!
        </li>
        <li
          v-for="message in state.messages"
          :key="message.id"
          class="group flex flex-col"
          :class="message.mine ? 'items-end' : 'items-start'"
        >
          <span class="text-[10px] opacity-75">
            {{ message.mine ? 'You' : message.author }} ·
            {{ timeOf(message.createdAt) }}
          </span>
          <p
            class="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-1.5 text-sm"
            :class="
              message.hidden
                ? 'italic opacity-70'
                : message.mine
                  ? 'bg-primary text-primary-content'
                  : 'bg-base-100'
            "
          >
            {{ message.hidden ? 'Message removed' : message.body }}
          </p>
          <button
            v-if="!message.hidden && (message.mine || userStore.isAdmin)"
            class="btn btn-ghost btn-xs opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
            type="button"
            :aria-label="`Remove message from ${message.author}`"
            @click="store.remove(room, message.id)"
          >
            Remove
          </button>
        </li>
      </ol>
      <p v-if="state.error" class="text-xs text-error" role="alert">
        {{ state.error }}
      </p>
      <form class="flex gap-2" @submit.prevent="send">
        <input
          v-model="draft"
          class="input input-bordered input-sm min-w-0 flex-1"
          :maxlength="CHAT_MESSAGE_MAX"
          aria-label="Message"
          placeholder="Share a kind word…"
          autocomplete="off"
        />
        <button
          class="btn btn-primary btn-sm"
          type="submit"
          :disabled="state.sending || !draft.trim()"
        >
          Send
        </button>
      </form>
    </template>
  </section>
</template>
