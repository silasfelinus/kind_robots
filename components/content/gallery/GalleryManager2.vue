<template>
  <div>
    <h1>Galleries</h1>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Content</th>
          <th>Description</th>
          <th>Highlight Image</th>
          <th>Mat?</th>
          <th>Requires Auth?</th>
          <th>User</th>
          <th>Created At</th>
          <th>Updated At</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="gallery in galleries" :key="gallery.id">
          <td>{{ gallery.id }}</td>
          <td>{{ gallery.name }}</td>
          <td>{{ gallery.content }}</td>
          <td>{{ gallery.description }}</td>
          <td>
            <img
              v-if="gallery.highlightImage"
              :src="gallery.highlightImage"
              alt="Highlight"
            />
          </td>
          <td>{{ gallery.isMature ? 'Yes' : 'No' }}</td>
          <td>{{ gallery.isAuth ? 'Yes' : 'No' }}</td>
          <td>{{ gallery.user }}</td>
          <td>{{ new Date(gallery.createdAt).toLocaleString() }}</td>
          <td>{{ new Date(gallery.updatedAt).toLocaleString() }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
// Define the gallery type
interface Gallery {
  id: number
  name: string
  content: string
  description: string
  highlightImage: string | null
  isMature: boolean
  isAuth: boolean
  user: string
  createdAt: string
  updatedAt: string
}

// Define the ref with the Gallery type
const galleries = ref<Gallery[]>([])

onMounted(async () => {
  const res = await fetch('/api/galleries')
  if (!res.ok) {
    // handle error
    console.error('Failed to fetch galleries')
    return
  }
  galleries.value = await res.json() // Expecting it to return Gallery[]
})
</script>
