// Analytics question (T-0609) and the page room it reserves (T-0636, Nov 24 2026):
// while the banner floats over the bottom of the page, the page gets that much extra
// room (--consent-room), so the last buttons of a screen can still be reached.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import ConsentBanner from '../ConsentBanner.vue'

async function mountBanner() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/privacy', component: { template: '<div>Privacy</div>' } },
    ],
  })
  await router.push('/')
  await router.isReady()
  return mount(ConsentBanner, { global: { plugins: [router] }, attachTo: document.body })
}

const room = () => document.documentElement.style.getPropertyValue('--consent-room')

describe('ConsentBanner', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.style.removeProperty('--consent-room')
  })

  it('reserves room at the bottom of the page while the question is open', async () => {
    const wrapper = await mountBanner()
    expect(wrapper.find('.consent').exists()).toBe(true)
    // jsdom has no layout (height 0), so only the 8 px gap shows up here
    expect(room()).toBe('8px')
    wrapper.unmount()
  })

  it('gives the room back once the question is answered', async () => {
    const wrapper = await mountBanner()
    await wrapper.find('button.btn-2').trigger('click')
    expect(wrapper.find('.consent').exists()).toBe(false)
    expect(localStorage.getItem('analyticsConsent')).toBe('denied')
    expect(room()).toBe('')
    wrapper.unmount()
  })

  it('reserves nothing when the choice was made before', async () => {
    localStorage.setItem('analyticsConsent', 'denied')
    const wrapper = await mountBanner()
    expect(wrapper.find('.consent').exists()).toBe(false)
    expect(room()).toBe('')
    wrapper.unmount()
  })
})
