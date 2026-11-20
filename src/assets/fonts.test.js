// Fonts are served from this site, not Google Fonts (T-0636, Nov 20 2026).
// Google Fonts sent every visitor's IP address to Google before the consent banner,
// and the privacy page no longer names Google Fonts, so a new Google Fonts link
// would make /privacy untrue. These checks keep the three places in step.
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const assetsDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(assetsDir, '../..')
const read = (relativePath) => readFileSync(resolve(repoRoot, relativePath), 'utf8')

describe('self-hosted fonts', () => {
  it('index.html loads nothing from Google Fonts', () => {
    const html = read('index.html')
    expect(html).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/)
  })

  it('every font file named in fonts.css exists', () => {
    const css = read('src/assets/fonts.css')
    const urls = [...css.matchAll(/url\('(\.\/fonts\/[^']+)'\)/g)].map((match) => match[1])
    expect(urls.length).toBe(4)
    for (const url of urls) {
      expect(existsSync(resolve(assetsDir, url)), url).toBe(true)
    }
  })

  it('the app imports fonts.css before the theme', () => {
    const main = read('src/main.js')
    const fontsAt = main.indexOf("import './assets/fonts.css'")
    const themeAt = main.indexOf("import './assets/theme.css'")
    expect(fontsAt).toBeGreaterThan(-1)
    expect(fontsAt).toBeLessThan(themeAt)
  })

  it('the security policy no longer allows Google font hosts', () => {
    const toml = read('netlify.toml')
    expect(toml).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/)
  })
})
