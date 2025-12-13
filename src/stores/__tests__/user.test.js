// Tests for user store
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '../user.js'

describe('user store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should have null user initially', () => {
    const store = useUserStore()

    expect(store.user).toBeNull()
  })

  it('should set user with setUser', () => {
    const store = useUserStore()
    const mockUser = { id: 'user-123', email: 'test@example.com' }

    store.setUser(mockUser)

    expect(store.user).toEqual(mockUser)
  })

  it('should clear user by setting to null', () => {
    const store = useUserStore()
    store.setUser({ id: 'user-123' })

    store.setUser(null)

    expect(store.user).toBeNull()
  })

  it('should update user with new data', () => {
    const store = useUserStore()
    store.setUser({ id: 'user-123', email: 'old@example.com' })

    store.setUser({ id: 'user-123', email: 'new@example.com' })

    expect(store.user.email).toBe('new@example.com')
  })
})
