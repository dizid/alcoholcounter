<template>
  <!-- Main container for the About Tracker page -->
  <div class="container">
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
          <img src="@/assets/logo.png" alt="DrinkTracker Logo" class="logo-image" />
        </div>
        <h3>Privacy Policy</h3>
        <p>Your privacy is important to us. We will never share your information with anyone. We only use your data to improve your experience. By using our service, you agree to this simple policy. If you have any questions, feel free to contact us.</p>
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
            <td>RCT demonstrating that a full smartphone app for tracking alcohol reduced typical weekly consumption more than an educational-only version, with supportive evidence for reducing unhealthy drinking.</td>
            <td><a href="https://www.sciencedirect.com/science/article/pii/S221478292400040X" target="_blank" rel="noopener noreferrer">View Study</a></td>
          </tr>
          <tr>
            <td>Randomized trial of the Drink Less app, where sensitivity analysis showed a greater reduction in weekly alcohol units compared to standard NHS advice, highlighting the role of tracking in behavior change.</td>
            <td><a href="https://www.sciencedirect.com/science/article/pii/S2589537024001135" target="_blank" rel="noopener noreferrer">View Study</a></td>
          </tr>
          <tr>
            <td>Mixed-methods evaluation of the Drinkaware app, finding that self-monitoring led to reduced alcohol consumption, especially in the first week, among motivated high-risk drinkers.</td>
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
        <li><a href="https://www.samhsa.gov/find-help/national-helpline" target="_blank" rel="noopener noreferrer">SAMHSA National Helpline</a> - Free, confidential 24/7 support at 1-800-662-HELP (4357).</li>
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
DrinkTracker is a mobile and web app to help you moderate alcohol use with evidence-based tools. Track drinks daily, view progress charts, and use mindfulness and CBT exercises to manage urges. Grok AI provides personalized advice based on your data, enhancing engagement. **Why it works**: CBT rewires negative thoughts, and Mindfulness-Based Relapse Prevention (MBRP) reduces cravings, proven to lower drinking. **Best use**: Log drinks daily, use exercises during urges, and review AI insights weekly for 8-12 weeks. Secure, free to start, and ideal for recovery or moderation.
`

// Define the long explanation as raw Markdown (shortened to ~300 words)
const longExplanation = `
### Why DrinkTracker Works

DrinkTracker empowers users to manage alcohol use through a blend of science-backed tools and AI, available on web, iOS, and Android. Built by Marc from Rotterdam, it’s a supportive companion for moderation or recovery.

#### Science-Backed Approach
- **Cognitive Behavioral Therapy (CBT)**: CBT helps you identify triggers (e.g., stress), reframe thoughts (like "I need a drink" to "I can relax differently"), and build skills for high-risk situations. Studies show CBT reduces drinking by fostering coping strategies, with digital tools boosting abstinence.
- **Mindfulness-Based Relapse Prevention (MBRP)**: Exercises like breathing, acceptance, and urge surfing help you manage cravings by staying present. Research confirms MBRP lowers heavy drinking and relapse risk, enhancing emotional control.
- **Personalized AI Advice**: Grok AI analyzes your drink logs, contexts, and triggers to suggest tailored CBT and mindfulness strategies (e.g., breathing for stress). Digital therapeutics with AI improve outcomes by personalizing interventions, reducing cravings and risky drinking, per a Frontiers study.

This combination excels because self-monitoring builds awareness, CBT equips skills, mindfulness fosters calm, and AI ensures relevance, outperforming single-method approaches.

#### How to Use It
1. **Start**: Sign up and log drinks with context (e.g., mood, location) for a week.
2. **Engage**: Use the "Mindful Pause" for breathing or urge surfing, and CBT to log triggers and reframe thoughts.
3. **Review**: Check the dashboard for charts and AI advice weekly. Practice suggested skills (e.g., refusal techniques).
4. **Stay Consistent**: Use for 8-12 weeks for best results, combining with professional support if needed.

#### Why It Stands Out
Unlike generic trackers, this app offers a therapeutic ecosystem. It’s secure, user-friendly, and affordable (free tier available). Start today to take control of your habits with confidence.
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
/* Scoped styles for submenu to avoid global conflicts */
.submenu {
  background-color: #ffffff; /* Clean white background */
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #ddd;
}

/* Submenu toggle button for mobile */
.submenu-toggle {
  display: flex;
  align-items: center;
  background-color: #3498db; /* Match app’s blue theme */
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.2rem;
  width: 100%;
  justify-content: center;
}

.submenu-toggle-icon {
  margin-right: 0.5rem;
}

.submenu-toggle-text {
  font-weight: bold;
}

.submenu-toggle:hover {
  background-color: #2980b9; /* Darker blue on hover */
}

/* Submenu links */
.submenu-links {
  display: none; /* Hidden by default on mobile */
  flex-direction: column;
  list-style: none;
  margin: 0.5rem 0 0;
  padding: 0;
}

.submenu-links-open {
  display: flex; /* Show when toggled */
}

.submenu-link {
  display: block;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: #ffffff;
  background-color: #3498db; /* Blue buttons for consistency */
  border-radius: 4px;
  margin-bottom: 0.5rem;
  font-size: 1.2rem; /* Larger for touch */
  text-align: center;
  min-height: 48px; /* Touch-friendly size */
}

.submenu-link:hover {
  background-color: #2980b9; /* Darker blue on hover */
}

/* Desktop: Show submenu inline, hide toggle */
@media (min-width: 769px) {
  .submenu-toggle {
    display: none; /* Hide toggle on desktop */
  }
  .submenu-links {
    display: flex !important; /* Always visible */
    flex-direction: row;
    justify-content: center;
    gap: 1rem;
  }
  .submenu-link {
    width: auto;
    margin-bottom: 0;
  }
}
</style>