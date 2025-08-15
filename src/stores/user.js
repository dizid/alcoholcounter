// Pinia store for user state
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)

  function setUser(newUser) {
    user.value = newUser
  }

  return { user, setUser }
})