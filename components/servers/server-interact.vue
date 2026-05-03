<!-- /components/server/server-interact.vue -->
<template>
  <section class="flex w-full flex-col gap-4 rounded-2xl bg-base-200 p-4">
    <header
      class="rounded-2xl border border-base-300 bg-base-100 p-4 text-center shadow-md"
    >
      <h1 class="text-2xl font-bold text-primary md:text-3xl">Server Tools</h1>

      <p
        class="mx-auto mt-2 max-w-3xl text-sm text-base-content/70 md:text-base"
      >
        Inspect active art and text servers, ping them, and keep the engines
        honest.
      </p>
    </header>

    <section class="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <article class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <h2 class="mb-3 text-xl font-bold text-primary">Active Art Server</h2>

        <server-card
          v-if="serverStore.activeArtServer"
          :server="serverStore.activeArtServer"
          :selected="true"
          :show-actions="true"
          :allow-delete="false"
          @edit="editServer"
          @test="testServer"
        />

        <server-gallery
          v-else
          mode="art"
          variant="dropdown"
          title="Art Server"
          subtitle="Choose an art server."
          :show-controls="false"
          :show-toolbar="false"
        />
      </article>

      <article class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <h2 class="mb-3 text-xl font-bold text-secondary">
          Active Text Server
        </h2>

        <server-card
          v-if="serverStore.activeTextServer"
          :server="serverStore.activeTextServer"
          :selected="true"
          :show-actions="true"
          :allow-delete="false"
          @edit="editServer"
          @test="testServer"
        />

        <server-gallery
          v-else
          mode="text"
          variant="dropdown"
          title="Text Server"
          subtitle="Choose a text server."
          :show-controls="false"
          :show-toolbar="false"
        />
      </article>
    </section>

    <section
      v-if="healthMessage"
      class="rounded-2xl border p-3 text-sm"
      :class="
        healthOk
          ? 'border-success/40 bg-success/10 text-success'
          : 'border-error/40 bg-error/10 text-error'
      "
    >
      {{ healthMessage }}
    </section>

    <section
      v-if="showServerForm"
      class="rounded-2xl border border-base-300 bg-base-100 p-3 shadow-md"
    >
      <add-server @saved="handleServerSaved" @close="showServerForm = false" />
    </section>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useServerStore } from '@/stores/serverStore'

const serverStore = useServerStore()

const showServerForm = ref(false)
const healthMessage = ref('')
const healthOk = ref(false)

async function editServer(id: number) {
  const server =
    serverStore.getServerById(id) ?? (await serverStore.fetchServerById(id))

  if (!server) return

  serverStore.selectServer(id)
  serverStore.serverForm = {
    ...server,
  }

  showServerForm.value = true
}

async function testServer(id: number) {
  healthMessage.value = ''

  const result = await serverStore.testServerHealth(id)

  healthOk.value = Boolean(result.success && result.data?.ok)
  healthMessage.value =
    result.message ||
    (healthOk.value ? 'Server is online.' : 'Server is offline.')
}

async function handleServerSaved() {
  showServerForm.value = false
  await serverStore.fetchAllServers(true)
}
</script>
