<!-- PrivacyView.vue — privacy notice for alcohol.dizid.com (T-0609, Marc OK Nov 17 2026).
     Based on the T-0590 draft, with the facts checked in the code on Nov 17 2026:
     Neon Postgres in AWS ap-southeast-1 (Singapore), Firebase Auth (Google sign-in),
     xAI for the coach (after consent), Google Analytics (after consent), Google Fonts,
     Netlify hosting + Blobs AI counters, Google Forms for feedback.
     Keep this page true: update it whenever the app starts sending data somewhere new. -->
<template>
  <div class="screen privacy">
    <header class="screen-head">
      <router-link to="/" class="back">← DrinkTracker</router-link>
      <h1>Privacy</h1>
      <div class="date">Last updated 17 November 2026</div>
    </header>

    <section>
      <h2>In short</h2>
      <p>
        DrinkTracker stores what you log so it can show your progress. What you log is about your health, so we
        keep it to the app's purpose: no ads, no selling, no sharing for marketing. Nothing goes to the AI coach
        or to Google Analytics unless you say yes.
      </p>
    </section>

    <section>
      <h2>Who runs it</h2>
      <p>
        DrinkTracker is made by Marc de Ruijter (Dizid Web Development, registered in the Netherlands). Questions
        or requests: <a href="mailto:marc@dizid.com">marc@dizid.com</a>.
      </p>
    </section>

    <section>
      <h2>What we store</h2>
      <ul>
        <li><strong>Your account:</strong> you sign in with Google. Google Firebase Authentication keeps your Google
          email address, name, profile photo link and a user ID.</li>
        <li><strong>What you log:</strong> each drink (type, size, standard drinks, time) and, if you add them, the
          place, company, mood, trigger and note; the days you mark as alcohol-free.</li>
        <li><strong>Exercises:</strong> only what you choose to save there: a reflection after the breathing or urge
          exercise, and a trigger with your coping idea.</li>
        <li><strong>Your settings:</strong> goals and limits, quick drinks, whether the coach is on, when you agreed
          to the coach, and your time zone history (so each drink stays on the right day when you travel).</li>
      </ul>
      <p>
        This is stored in a Neon PostgreSQL database in Singapore (Amazon Web Services, region ap-southeast-1), linked
        to your user ID, not to your name.
      </p>
    </section>

    <section>
      <h2>The AI coach (xAI)</h2>
      <p>
        The coach is only asked when you tap "Ask the coach", and the first time we ask your OK. It then sends xAI
        (the company behind Grok, in the United States) your standard drinks per day for the last 30 days, and how
        often you logged each place, company, drink type, mood and trigger. It never sends your name, email, notes
        or what you save in the exercises. xAI
        handles this under its own <a href="https://x.ai/legal/privacy-policy" rel="noopener" target="_blank">privacy
        policy</a>. We don't keep a copy of your question or the answer, and nothing you send is written to our logs.
        To stop: turn the coach off in Me. That also withdraws your OK.
      </p>
    </section>

    <section>
      <h2>Google Analytics (only with your OK)</h2>
      <p>
        If you tap "Allow" in the cookie banner, Google Analytics counts visits: it sets cookies (_ga) and receives
        the pages you open, your browser and device type and your rough location. It never receives your drinks or
        moods. If you tap "No thanks", the Google Analytics script is never loaded. You can change this any time in
        Me → Privacy; switching it off removes the Analytics cookies from this browser.
      </p>
    </section>

    <section>
      <h2>Other services the app uses</h2>
      <ul>
        <li><strong>Netlify</strong> (United States) hosts the app and runs its server functions. It also keeps a
          small counter of AI answers per user per day, to enforce the daily limit.</li>
        <li><strong>Google Fonts:</strong> the app's fonts load from Google's servers, so Google sees your IP address
          when the app opens.</li>
        <li><strong>Feedback:</strong> the feedback page is a Google Form. Only what you type there is sent.</li>
      </ul>
      <p>Some of these services are outside the European Union (the United States and Singapore).</p>
    </section>

    <section>
      <h2>How long we keep it</h2>
      <p>
        As long as you have an account. You can delete single drinks in the app. To delete your account and
        everything linked to it, email <a href="mailto:marc@dizid.com">marc@dizid.com</a> from the address you sign
        in with; we do it within one month and confirm by email.
      </p>
    </section>

    <section>
      <h2>Your rights</h2>
      <p>
        You can ask to see, correct, delete or get a copy of your data, and you can withdraw your OK at any time.
        "Export my data (CSV)" in Me gives you all your drinks right away. If you think we handle your data wrongly,
        you can complain to the Dutch Data Protection Authority (Autoriteit Persoonsgegevens).
      </p>
    </section>

    <section>
      <h2>Not medical advice</h2>
      <p>
        DrinkTracker and its coach support your own choices; they are not a diagnosis or treatment. If you're worried
        about your drinking, talk to your doctor.
      </p>
    </section>
  </div>
</template>

<style scoped>
.back { display: inline-block; margin-bottom: 12px; font-size: 14px; color: var(--muted); }
.privacy h1 { margin: 0 0 4px; }
.privacy section { margin-bottom: 24px; }
.privacy h2 { font-size: 17px; font-weight: 600; margin: 0 0 8px; }
.privacy p, .privacy li { font-size: 15px; line-height: 1.55; color: var(--ink); }
.privacy ul { padding-left: 20px; margin: 0 0 8px; display: grid; gap: 6px; }
.privacy a:not(.back) { color: var(--drink); text-decoration: underline; }
</style>
