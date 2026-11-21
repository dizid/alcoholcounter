// Makes dist/404.html after `vite build` (T-0636, Nov 21 2026). Runs as part of `npm run build`.
// Netlify serves dist/404.html with HTTP status 404 for every address that has no file
// and no rule in public/_redirects (which lists only the app's routes). Before, every
// unknown address (/wp-login.php, typos, old links) answered 200 with the app, so search
// engines could index junk URLs as copies of the app.
// The file is the built app page with a "Page not found" title and robots noindex; the
// app then starts and the router's catch-all route shows src/views/NotFoundView.vue.
// Stops the build (exit 1) when index.html no longer has the tags it replaces.
import { readFileSync, writeFileSync } from 'node:fs'

const source = readFileSync('dist/index.html', 'utf8')

const replacements = [
  [/<title>[^<]*<\/title>/, '<title>Page not found | DrinkTracker</title>'],
  [/<meta name="robots" content="[^"]*"\s*\/?>/, '<meta name="robots" content="noindex" />'],
]

let page = source
for (const [pattern, replacement] of replacements) {
  if (!pattern.test(page)) {
    console.error(`make-404: dist/index.html has no match for ${pattern}; 404.html not written`)
    process.exit(1)
  }
  page = page.replace(pattern, replacement)
}

writeFileSync('dist/404.html', page)
console.log('make-404: dist/404.html written (title "Page not found", robots noindex)')
