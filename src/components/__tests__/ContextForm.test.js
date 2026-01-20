// Tests for ContextForm component
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ContextForm from '../ContextForm.vue'

describe('ContextForm', () => {
  const mountForm = () => {
    return mount(ContextForm)
  }

  describe('rendering', () => {
    it('should render form with title', () => {
      const wrapper = mountForm()

      expect(wrapper.find('h3').text()).toBe('Log Drinks')
    })

    it('should render all select fields', () => {
      const wrapper = mountForm()
      const selects = wrapper.findAll('select')

      expect(selects.length).toBe(4)
    })

    it('should render location options', () => {
      const wrapper = mountForm()
      const locationSelect = wrapper.findAll('select')[0]
      const options = locationSelect.findAll('option')

      expect(options.map(o => o.text())).toContain('Home')
      expect(options.map(o => o.text())).toContain('Bar / Restaurant')
      expect(options.map(o => o.text())).toContain('Other')
    })

    it('should render company options', () => {
      const wrapper = mountForm()
      const companySelect = wrapper.findAll('select')[1]
      const options = companySelect.findAll('option')

      expect(options.map(o => o.text())).toContain('Alone')
      expect(options.map(o => o.text())).toContain('With friends')
      expect(options.map(o => o.text())).toContain('With family')
    })

    it('should render drink type options', () => {
      const wrapper = mountForm()
      const drinkSelect = wrapper.findAll('select')[2]
      const options = drinkSelect.findAll('option')

      expect(options.map(o => o.text())).toContain('Beer')
      expect(options.map(o => o.text())).toContain('Wine')
      expect(options.map(o => o.text())).toContain('Cocktail')
    })

    it('should render mood options', () => {
      const wrapper = mountForm()
      const moodSelect = wrapper.findAll('select')[3]
      const options = moodSelect.findAll('option')

      expect(options.map(o => o.text())).toContain('Happy / Celebrating')
      expect(options.map(o => o.text())).toContain('Stressed / Anxious')
      expect(options.map(o => o.text())).toContain('Neutral')
    })

    it('should render save button', () => {
      const wrapper = mountForm()
      const saveButton = wrapper.find('.save-btn')

      expect(saveButton.text()).toBe('Log Drink')
    })
  })

  describe('form submission', () => {
    it('should emit submit with empty context when no selections', async () => {
      const wrapper = mountForm()

      await wrapper.find('.save-btn').trigger('click')

      expect(wrapper.emitted('submit')).toBeTruthy()
      expect(wrapper.emitted('submit')[0][0]).toEqual({})
      expect(wrapper.emitted('submit')[0][1]).toBe(1) // default quantity
    })

    it('should emit submit with selected values', async () => {
      const wrapper = mountForm()

      await wrapper.findAll('select')[0].setValue('Home')
      await wrapper.findAll('select')[1].setValue('Alone')
      await wrapper.findAll('select')[2].setValue('beer')
      await wrapper.findAll('select')[3].setValue('happy')

      await wrapper.find('.save-btn').trigger('click')

      expect(wrapper.emitted('submit')[0][0]).toEqual({
        location: 'Home',
        company: 'Alone',
        drink_type: 'beer',
        mood: 'happy',
      })
      expect(wrapper.emitted('submit')[0][1]).toBe(1) // default quantity
    })

    it('should only include non-empty values in context', async () => {
      const wrapper = mountForm()

      await wrapper.findAll('select')[0].setValue('Bar')
      await wrapper.findAll('select')[2].setValue('wine')
      // Leave company and mood empty

      await wrapper.find('.save-btn').trigger('click')

      const emittedContext = wrapper.emitted('submit')[0][0]
      expect(emittedContext).toEqual({
        location: 'Bar',
        drink_type: 'wine',
      })
      expect(emittedContext.company).toBeUndefined()
      expect(emittedContext.mood).toBeUndefined()
    })
  })

  describe('v-model binding', () => {
    it('should update form state when selecting location', async () => {
      const wrapper = mountForm()
      const select = wrapper.findAll('select')[0]

      await select.setValue('Home')

      expect(select.element.value).toBe('Home')
    })

    it('should update form state when selecting company', async () => {
      const wrapper = mountForm()
      const select = wrapper.findAll('select')[1]

      await select.setValue('With friends')

      expect(select.element.value).toBe('With friends')
    })
  })

  describe('accessibility', () => {
    it('should have role="dialog" on overlay', () => {
      const wrapper = mountForm()
      const overlay = wrapper.find('.context-overlay')

      expect(overlay.attributes('role')).toBe('dialog')
    })

    it('should have aria-modal="true" on overlay', () => {
      const wrapper = mountForm()
      const overlay = wrapper.find('.context-overlay')

      expect(overlay.attributes('aria-modal')).toBe('true')
    })

    it('should have aria-labelledby pointing to title', () => {
      const wrapper = mountForm()
      const overlay = wrapper.find('.context-overlay')
      const title = wrapper.find('#context-form-title')

      expect(overlay.attributes('aria-labelledby')).toBe('context-form-title')
      expect(title.exists()).toBe(true)
    })

    it('should emit cancel on Escape key', async () => {
      const wrapper = mountForm()
      const overlay = wrapper.find('.context-overlay')

      await overlay.trigger('keydown.escape')

      expect(wrapper.emitted('cancel')).toBeTruthy()
    })

    it('should have aria-label on quantity buttons', () => {
      const wrapper = mountForm()
      const decreaseBtn = wrapper.find('button[aria-label="Decrease quantity"]')
      const increaseBtn = wrapper.find('button[aria-label="Increase quantity"]')

      expect(decreaseBtn.exists()).toBe(true)
      expect(increaseBtn.exists()).toBe(true)
    })

    it('should have labels for all form fields', () => {
      const wrapper = mountForm()

      expect(wrapper.find('label[for="location"]').exists()).toBe(true)
      expect(wrapper.find('label[for="company"]').exists()).toBe(true)
      expect(wrapper.find('label[for="drink_type"]').exists()).toBe(true)
      expect(wrapper.find('label[for="mood"]').exists()).toBe(true)
    })
  })
})
