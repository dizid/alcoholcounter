// The add-drink sheet's live standard-drinks line (T-0636: it said "1 standard drinks")
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import AddDrinkSheet from '../AddDrinkSheet.vue'

// Opens the sheet the way the app does (open goes false -> true, which resets the form)
async function openSheet(initialType) {
  const wrapper = mount(AddDrinkSheet, {
    props: { open: false, initialType },
    global: { stubs: { teleport: true, transition: false } },
  })
  await wrapper.setProps({ open: true })
  await nextTick()
  return wrapper
}

const stdLine = wrapper => wrapper.find('.std').text().replace(/\s+/g, ' ')

describe('AddDrinkSheet standard drinks line', () => {
  it('uses the singular for exactly one standard drink', async () => {
    const wrapper = await openSheet('beer') // beer, regular = 1
    expect(stdLine(wrapper)).toBe('= 1 standard drink')
  })

  it('uses the plural for anything else', async () => {
    const wrapper = await openSheet('wine') // wine, regular = 1.2
    expect(stdLine(wrapper)).toBe('= 1.2 standard drinks')
    await wrapper.find('button[aria-label="One more"]').trigger('click')
    expect(stdLine(wrapper)).toBe('= 2.4 standard drinks')
  })
})
