<template>
  <main>
    <NuxtLayout>
      <ContentDoc path="/bots/">
        <template #not-found>
          <bot-object />
        </template>
        <template #empty>
          <bot-object />
        </template>
      </ContentDoc>
    </NuxtLayout>
  </main>
</template>
