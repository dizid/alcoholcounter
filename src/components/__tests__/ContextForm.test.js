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

      expect(wrapper.find('h3').text()).toBe('Add Context (Optional)')
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
      expect(options.map(o => o.text())).toContain('Bar')
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

      expect(options.map(o => o.text())).toContain('beer')
      expect(options.map(o => o.text())).toContain('wine')
      expect(options.map(o => o.text())).toContain('stronger')
    })

    it('should render mood options', () => {
      const wrapper = mountForm()
      const moodSelect = wrapper.findAll('select')[3]
      const options = moodSelect.findAll('option')

      expect(options.map(o => o.text())).toContain('positive')
      expect(options.map(o => o.text())).toContain('negative')
      expect(options.map(o => o.text())).toContain('neutral')
    })

    it('should render save button', () => {
      const wrapper = mountForm()

      expect(wrapper.find('button').text()).toBe('Save')
    })
  })

  describe('form submission', () => {
    it('should emit submit with empty context when no selections', async () => {
      const wrapper = mountForm()

      await wrapper.find('button').trigger('click')

      expect(wrapper.emitted('submit')).toBeTruthy()
      expect(wrapper.emitted('submit')[0][0]).toEqual({})
    })

    it('should emit submit with selected values', async () => {
      const wrapper = mountForm()

      await wrapper.findAll('select')[0].setValue('Home')
      await wrapper.findAll('select')[1].setValue('Alone')
      await wrapper.findAll('select')[2].setValue('beer')
      await wrapper.findAll('select')[3].setValue('positive')

      await wrapper.find('button').trigger('click')

      expect(wrapper.emitted('submit')[0][0]).toEqual({
        location: 'Home',
        company: 'Alone',
        drink_type: 'beer',
        mood: 'positive',
      })
    })

    it('should only include non-empty values in context', async () => {
      const wrapper = mountForm()

      await wrapper.findAll('select')[0].setValue('Bar')
      await wrapper.findAll('select')[2].setValue('wine')
      // Leave company and mood empty

      await wrapper.find('button').trigger('click')

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
})
