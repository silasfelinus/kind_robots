<template>
  <main>
    <NuxtLayout :name="page.layout">
      <ContentDoc path="/bot/">
        <template #not-found> Bot Not Found </template>
        <template #empty> That Bot is missing! </template>
      </ContentDoc>
    </NuxtLayout>
  </main>
</template>

<script setup lang="ts">
const { page } = useContent()
</script>
