<!-- NotFoundView.vue — shown for any address the app doesn't have (T-0636, Nov 21 2026).
     Before, an unknown address (a typo, an old link, /wp-login.php) showed a blank page.
     Netlify now answers those addresses with dist/404.html (HTTP 404, noindex, made by
     scripts/make-404.mjs) and the router's catch-all route draws this screen.
     Text only, in the existing theme: no new graphics. -->
<template>
  <div class="screen not-found">
    <header class="screen-head">
      <h1>Page not found</h1>
      <div class="date">This address isn't part of DrinkTracker.</div>
    </header>
    <p class="muted">Maybe the link is old or has a typo. Your data is safe.</p>
    <router-link to="/" class="btn-primary">Go to DrinkTracker</router-link>
  </div>
</template>

<style scoped>
.not-found h1 { margin: 0 0 4px; }
.not-found p { font-size: 15px; line-height: 1.55; margin: 0 0 24px; }
.not-found .btn-primary { text-decoration: none; }
</style>
