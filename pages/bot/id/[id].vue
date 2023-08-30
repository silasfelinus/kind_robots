<template>
  <main>
    <NuxtLayout>
      <ContentDoc path="/bot/">
        <template #not-found> Bot Not Found </template>
        <template #empty> That Bot is missing! Send out the houndbots! </template>
      </ContentDoc>
    </NuxtLayout>
  </main>
</template>
