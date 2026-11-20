// About page (T-0636, Nov 20 2026): keep it true to what the app is.
// There are no iOS/Android apps and no paid tier, and privacy facts live on /privacy.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import AboutTracker from '../AboutTracker.vue'

async function mountAbout() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/about-tracker', component: AboutTracker },
      { path: '/privacy', component: { template: '<div>Privacy</div>' } },
    ],
  })
  await router.push('/about-tracker')
  await router.isReady()
  return mount(AboutTracker, { global: { plugins: [router] } })
}

describe('About page', () => {
  it('makes no claims about native apps or a paid tier', async () => {
    const text = (await mountAbout()).text()
    expect(text).not.toMatch(/iOS|Android|free tier|free to start/i)
  })

  it('points to the privacy page instead of its own policy text', async () => {
    const wrapper = await mountAbout()
    expect(wrapper.text()).not.toMatch(/never share your information/i)
    expect(wrapper.find('a[href="/privacy"]').exists()).toBe(true)
  })
})
