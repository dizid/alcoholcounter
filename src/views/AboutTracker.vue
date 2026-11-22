<template>
  <!-- Main container for the About Tracker page. T-0636: "screen" = the side padding and the room
       above the bottom menu every other screen has (its old padding was in the unloaded styles.css) -->
  <div class="main-container screen">
    <h1>About DrinkTracker</h1>
    <p>Learn how our app empowers you to moderate alcohol use with science-backed tools and AI advice.</p>
    
    <!-- Collapsible submenu for navigation -->
    <nav class="submenu">
      <button class="submenu-toggle" @click="toggleSubmenu" aria-label="Toggle submenu">
        <span class="submenu-toggle-icon">{{ isSubmenuOpen ? '✖' : '☰' }}</span>
        <span class="submenu-toggle-text">Menu</span>
      </button>
      <ul :class="{ 'submenu-links': true, 'submenu-links-open': isSubmenuOpen }">
        <li><a href="#brief" class="submenu-link" @click.prevent="scrollToSection('brief')">Overview</a></li>
        <li><a href="#detailed" class="submenu-link" @click.prevent="scrollToSection('detailed')">Why It Works</a></li>
        <li><a href="#creator" class="submenu-link" @click.prevent="scrollToSection('creator')">Creator's Story</a></li>
        <li><a href="#references" class="submenu-link" @click.prevent="scrollToSection('references')">Scientific References</a></li>
        <li><a href="#resources" class="submenu-link" @click.prevent="scrollToSection('resources')">Further Help</a></li>
      </ul>
    </nav>
    
    <!-- Section 1: Brief Explanation (Shortened) -->
    <section id="brief" class="section">
      <h2>Overview</h2>
      <div v-html="parsedBriefExplanation" class="section-content"></div>
    </section>
    
    <!-- Section 2: Long Explanation (Shortened) -->
    <section id="detailed" class="section">
      <h2>Why It Works</h2>
      <div v-html="parsedLongExplanation" class="section-content"></div>
    </section>
    
    <!-- Section 3: Creator's Story -->
    <section id="creator" class="section">
      <h2>Creator's Story</h2>
      <div class="section-content">
        <p>Hi, I am Marc from Rotterdam</p>
        <p>Because I drink too much I made this app. I hope it will benefit you too 🙏</p>
        <p>Good luck, have fun.</p>
        <div class="logo-container">
          <router-link to="/" class="logo-link">
            <img src="@/assets/logo.png" alt="DrinkTracker Logo" class="logo-image" />
          </router-link>
        </div>
        <h3>Privacy</h3>
        <!-- T-0636: the old one-line policy here contradicted the real notice; point to it instead -->
        <p>What we store, where it is kept and what the coach and Google Analytics get (only after your OK): see the <router-link to="/privacy">privacy page</router-link>.</p>
      </div>
    </section>
    
    <!-- Section 4: References -->
    <section id="references" class="section">
      <h2>Scientific References</h2>
      <p>Below is a curated list of studies supporting the effectiveness of tracking alcohol consumption and related interventions.</p>
      <table class="references-table" aria-label="Scientific References Table">
        <thead>
          <tr>
            <th>Reference Description</th>
            <th>URL</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Randomized controlled trial showing that a digital alcohol intervention with weekly self-monitoring and feedback significantly reduced total weekly alcohol consumption and heavy episodic drinking compared to basic alcohol information.</td>
            <td><a href="https://bmcmedicine.biomedcentral.com/articles/10.1186/s12916-022-02374-5" target="_blank" rel="noopener noreferrer">View Study</a></td>
          </tr>
          <tr>
            <td>RCT (761 Canadian adults) where the full smartphone app reduced typical weekly drinking more than an education-only version of the same app after six months; no clear difference in heavy drinking days.</td>
            <td><a href="https://www.sciencedirect.com/science/article/pii/S221478292400040X" target="_blank" rel="noopener noreferrer">View Study</a></td>
          </tr>
          <tr>
            <td>Randomized trial of the Drink Less app (5,602 UK drinkers) against the NHS alcohol advice webpage: the main analysis found no clear difference; the planned sensitivity analysis found a weekly drop 2 units bigger with the app after six months.</td>
            <td><a href="https://www.sciencedirect.com/science/article/pii/S2589537024001135" target="_blank" rel="noopener noreferrer">View Study</a></td>
          </tr>
          <tr>
            <td>Mixed-methods evaluation of the Drinkaware app: people who kept logging reported drinking less, with most of the change in the first week; it helped most for users already motivated to cut down.</td>
            <td><a href="https://bmcpublichealth.biomedcentral.com/articles/10.1186/s12889-017-4358-9" target="_blank" rel="noopener noreferrer">View Study</a></td>
          </tr>
          <tr>
            <td>Qualitative study on patient perceptions, showing that self-monitoring alcohol apps help assess, track, and control consumption, improving communication with clinicians and supporting behavior change.</td>
            <td><a href="https://www.tandfonline.com/doi/full/10.1080/10826084.2023.2269578" target="_blank" rel="noopener noreferrer">View Study</a></td>
          </tr>
          <tr>
            <td>Paper on the development of the Drink Less app, citing self-monitoring as an effective behavior change technique in alcohol interventions, supported by evidence from prior studies.</td>
            <td><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC6417151/" target="_blank" rel="noopener noreferrer">View Study</a></td>
          </tr>
        </tbody>
      </table>
    </section>
    
    <!-- Section 5: Further Help and Tools -->
    <section id="resources" class="section">
      <h2>Further Help and Tools</h2>
      <p>Explore these trusted resources for additional support in managing alcohol use and improving mental health.</p>
      <ul class="resources-list">
        <li><a href="https://www.aa.org/" target="_blank" rel="noopener noreferrer">Alcoholics Anonymous (AA)</a> - Find local or virtual support groups for recovery.</li>
        <li><a href="https://www.samhsa.gov/find-help/helplines/national-helpline" target="_blank" rel="noopener noreferrer">SAMHSA National Helpline</a> - Free, confidential 24/7 support at 1-800-662-HELP (4357).</li>
        <li><a href="https://www.smartrecovery.org/" target="_blank" rel="noopener noreferrer">SMART Recovery</a> - Science-based, self-empowered recovery programs with online meetings.</li>
        <li><a href="https://www.headspace.com/" target="_blank" rel="noopener noreferrer">Headspace</a> - Guided mindfulness and meditation app to reduce stress and cravings.</li>
        <li><a href="https://www.niaaa.nih.gov/" target="_blank" rel="noopener noreferrer">NIAAA</a> - Research and resources on alcohol use disorder from the National Institute on Alcohol Abuse and Alcoholism.</li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue' // Added ref for submenu toggle
import { marked } from 'marked' // Import for Markdown parsing

// Reactive state for submenu toggle
const isSubmenuOpen = ref(false)

// Toggle submenu visibility
function toggleSubmenu() {
  isSubmenuOpen.value = !isSubmenuOpen.value
}

// Define the brief explanation as raw Markdown (shortened to ~100 words)
const briefExplanation = `
DrinkTracker is a web app (on your phone or computer) to help you moderate alcohol use with evidence-based tools. Track drinks daily, view progress charts, and use mindfulness and CBT exercises to manage urges. An optional AI coach (Grok) gives personalized advice based on your numbers, only after your OK. **Why it works**: CBT rewires negative thoughts, and Mindfulness-Based Relapse Prevention (MBRP) reduces cravings, proven to lower drinking. **Best use**: Log drinks daily, use exercises during urges, and review your Insights weekly for 8-12 weeks. Free, private, and ideal for recovery or moderation.
`

// Define the long explanation as raw Markdown (shortened to ~300 words)
const longExplanation = `
### Why DrinkTracker Works

DrinkTracker empowers users to manage alcohol use through a blend of science-backed tools and AI. It runs in your browser on any phone or computer. Built by Marc from Rotterdam, it’s a supportive companion for moderation or recovery.

#### Science-Backed Approach
- **Cognitive Behavioral Therapy (CBT)**: CBT helps you identify triggers (e.g., stress), reframe thoughts (like "I need a drink" to "I can relax differently"), and build skills for high-risk situations. Studies show CBT reduces drinking by fostering coping strategies, with digital tools boosting abstinence.
- **Mindfulness-Based Relapse Prevention (MBRP)**: Exercises like breathing, acceptance, and urge surfing help you manage cravings by staying present. Research confirms MBRP lowers heavy drinking and relapse risk, enhancing emotional control.
- **Personalized AI Advice** (optional, asks your OK first): Grok AI looks at your drinks per day and how often you logged each mood, place and trigger to suggest tailored CBT and mindfulness strategies (e.g., breathing for stress).

The idea: self-monitoring builds awareness, CBT gives you skills, mindfulness helps you stay calm, and the optional coach keeps tips relevant to your own numbers.

#### How to Use It
1. **Start**: Sign up and log drinks with context (e.g., mood, location) for a week.
2. **Engage**: Use the exercises at the bottom of Today: breathing or urge surfing, and the CBT tools to note triggers and reframe thoughts.
3. **Review**: Check Insights for your week, month and year, and ask the coach if you like. Practice suggested skills (e.g., refusal techniques).
4. **Stay Consistent**: Use for 8-12 weeks for best results, combining with professional support if needed.

#### Why It Stands Out
Unlike generic trackers, this app offers a therapeutic ecosystem. It’s private, user-friendly and free. Start today to take control of your habits with confidence.
`

// Parse Markdown for rendering
const parsedBriefExplanation = computed(() => marked.parse(briefExplanation, { breaks: true }))
const parsedLongExplanation = computed(() => marked.parse(longExplanation, { breaks: true }))

// Smooth scroll to section and close submenu on mobile
function scrollToSection(id) {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
    isSubmenuOpen.value = false // Close submenu after click on mobile
  }
}
</script>

<style scoped>
/* Scoped styles for submenu - Ocean Calm theme */
.submenu {
  background-color: var(--bg-primary);
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

/* Submenu toggle button for mobile */
.submenu-toggle {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
  color: white;
  border: none;
  padding: 0.875rem 1.25rem;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  width: 100%;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
  transition: all 0.2s ease;
}

.submenu-toggle-icon {
  margin-right: 0.5rem;
}

.submenu-toggle-text {
  font-weight: 600;
}

.submenu-toggle:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
}

/* Submenu links */
.submenu-links {
  display: none;
  flex-direction: column;
  list-style: none;
  margin: 0.75rem 0 0;
  padding: 0;
  gap: 0.5rem;
}

.submenu-links-open {
  display: flex;
}

.submenu-link {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 1.25rem;
  text-decoration: none;
  color: var(--text-primary);
  background-color: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 500;
  text-align: center;
  min-height: 48px;
  transition: all 0.2s ease;
}

.submenu-link:hover {
  background-color: var(--accent-light);
  border-color: var(--accent);
  color: var(--accent);
  transform: translateY(-1px);
}

/* Logo link styling */
.logo-link {
  display: inline-block;
  transition: transform 0.2s ease;
}

/* T-0636: the logo's size lived in assets/styles.css, which stopped loading with the redesign
   (T-0588). Without it the 1024 px logo made this page 1024 px wide and scroll sideways on
   phones. Same sizes as the old rule: max 200 px tall, 150 px on phones. */
.logo-container {
  margin-top: 1.5rem;
  text-align: center;
}

.logo-image {
  display: block;
  width: auto;
  max-width: 100%;
  height: auto;
  max-height: 200px;
  border-radius: 12px;
}

@media (max-width: 768px) {
  .logo-image {
    max-height: 150px;
  }
}

.logo-link:hover {
  transform: scale(1.02);
}

/* Desktop: Show submenu inline, hide toggle */
@media (min-width: 769px) {
  .submenu-toggle {
    display: none;
  }
  .submenu-links {
    display: flex !important;
    flex-direction: row;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  .submenu-link {
    width: auto;
    padding: 0.75rem 1.25rem;
  }
}
</style>