<template>
  <main>
    <NuxtLayout>
      <ContentDoc path="/bot/">
        <template #not-found>
          Bot Not Found
        </template>
        <template #empty>
          That Bot is missing!
        </template>
      </ContentDoc>
    </NuxtLayout>
  </main>
</template>
