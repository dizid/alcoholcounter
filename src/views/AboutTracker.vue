<template>
  <!-- Main container for the About Tracker page -->
  <div class="container">
    <h1>About Your Alcohol Support Tracker</h1>
    <p>Learn how our app empowers you to moderate alcohol use with science-backed tools and personalized AI advice.</p>
    
    <!-- Sticky submenu for navigation -->
    <nav class="submenu">
      <ul class="submenu-links">
        <li><a href="#brief" class="submenu-link" @click.prevent="scrollToSection('brief')">Overview</a></li>
        <li><a href="#detailed" class="submenu-link" @click.prevent="scrollToSection('detailed')">Why It Works</a></li>
        <li><a href="#creator" class="submenu-link" @click.prevent="scrollToSection('creator')">Creator's Story</a></li>
        <li><a href="#references" class="submenu-link" @click.prevent="scrollToSection('references')">Scientific References</a></li>
        <li><a href="#resources" class="submenu-link" @click.prevent="scrollToSection('resources')">Further Help</a></li>
      </ul>
    </nav>
    
    <!-- Section 1: Brief Explanation -->
    <section id="brief" class="section">
      <h2>Overview</h2>
      <div v-html="parsedBriefExplanation" class="section-content"></div>
    </section>
    
    <!-- Section 2: Long Explanation -->
    <section id="detailed" class="section">
      <h2>Why It Works and How to Use It</h2>
      <div v-html="parsedLongExplanation" class="section-content"></div>
    </section>
    
    <!-- Section 3: Creator's Story (from old About.vue) -->
    <section id="creator" class="section">
      <h2>Creator's Story</h2>
      <div class="section-content">
        <p>Hi, I am Marc from Rotterdam</p>
        <p>Because I drink too much I made this app. I hope it will benefit you too 🙏</p>
        <p>Good luck, have fun.</p>
        <div class="logo-container">
          <img src="@/assets/logo.png" alt="Cheerful Alcohol Support Tracker Logo" class="logo-image" />
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
import { computed } from 'vue' // Import for computed properties
import { marked } from 'marked' // Import for Markdown parsing

// Define the brief explanation as raw Markdown
const briefExplanation = `
The Alcohol Support Tracker is a user-friendly mobile and web app designed to empower individuals seeking to moderate or reduce their alcohol consumption through evidence-based tools and personalized AI guidance. Featuring daily drink tracking, progress dashboards with visual charts, interactive mindfulness exercises, CBT strategies for trigger management, and Grok AI-powered advice, it combines self-monitoring with therapeutic interventions to foster sustainable habits. **Why it works**: Backed by proven methods like Cognitive Behavioral Therapy (CBT), which helps rewire negative thought patterns and build coping skills, and Mindfulness-Based Relapse Prevention (MBRP), which promotes present-moment awareness to handle cravings—both shown to reduce relapse rates and drinking severity. Personalized AI analyzes your data for tailored recommendations, enhancing engagement and outcomes as seen in digital therapeutic studies. **Best use**: Log drinks daily, engage with exercises during urges, review AI insights weekly, and persist for 8-12 weeks to see results. Ideal for anyone in early recovery or aiming for moderation, it's secure, free to start, and accessible via web or app.
`

// Define the long explanation as raw Markdown
const longExplanation = `
### Introducing the Alcohol Support Tracker: Your Personalized Path to Mindful Moderation

The Alcohol Support Tracker stands out as a comprehensive, science-backed tool that doesn't just track your habits—it actively empowers you to change them. Built on a foundation of empathy and innovation, this app is designed for adults navigating alcohol use, whether you're in early recovery, seeking moderation, or simply wanting more control over your choices. Available on web, iOS, and Android, it's powered by secure cloud storage (via Supabase) and integrates cutting-edge AI from Grok (by xAI) for truly personalized support. No judgment, no overwhelming complexity—just practical tools to help you build a healthier relationship with alcohol.

At its core, the app features a simple daily drink tracker where you log each drink with optional context (e.g., mood, location, company). This feeds into a dynamic dashboard with bar charts visualizing your progress over the past 30 days, highlighting trends like average intake or spikes. But it goes deeper with interactive sections for mindfulness pauses and CBT strategies, plus AI-generated advice that evolves with your data.

### Why It Works: Science-Backed Strategies for Lasting Change

The app's effectiveness stems from its integration of proven psychological approaches, drawing from decades of research in addiction recovery. Here's how its key components work:

- **Cognitive Behavioral Therapy (CBT)**: CBT is a goal-oriented therapy that focuses on identifying and changing unhelpful thought patterns and behaviors. For alcohol use disorder (AUD), it works by helping users recognize triggers (e.g., stress or social pressure), challenge distorted thoughts (like "I need a drink to unwind"), and develop practical skills for high-risk situations, such as refusal techniques or alternative coping mechanisms. Studies show CBT has high empirical support, reducing substance use as a standalone or combined treatment. In the app, this translates to interactive tabs where you log triggers (persisted securely for reflection), reframe thoughts with guided prompts, and practice skills—leading to measurable reductions in drinking, as seen in digital CBT interventions that boost abstinence rates and ease cravings.

- **Mindfulness-Based Approaches**: Rooted in Mindfulness-Based Relapse Prevention (MBRP), this app incorporates exercises like present-moment awareness (e.g., breathing techniques), acceptance strategies (observing urges without judgment), and urge surfing (riding out cravings like waves). MBRP works by targeting neurocognitive mechanisms, helping users detach from automatic responses to cravings and reduce relapse risk. Research demonstrates it lowers heavy drinking and substance use compared to standard treatments, with benefits persisting post-treatment. The app's collapsible mindfulness section makes these accessible during moments of temptation, fostering emotional regulation and long-term resilience.

- **Personalized AI Advice**: Powered by Grok AI, the app analyzes your logged data—drink counts, contexts, and user-entered triggers—to deliver custom insights. For instance, if stress emerges as a pattern, Grok might suggest CBT reframing ("Challenge 'I need a drink' with 'I can breathe through this'") blended with mindfulness ("Try a 4-count breath to stay present"). This AI-driven approach mirrors digital therapeutics, which studies show correlate with better outcomes by increasing engagement and tailoring interventions. A Frontiers study on CBT-based digital tools for AUD found significant reductions in risky drinking, cravings, and anxiety, with higher abstinence rates than controls—proving why personalized, tech-enabled support like this app drives real change.

Why does this combination work? Traditional recovery often feels isolating or rigid, but the app's blend of tracking, therapy, and AI creates a supportive ecosystem. Self-monitoring builds awareness, CBT equips skills, mindfulness cultivates calm, and AI ensures relevance—resulting in reduced consumption, better mental health, and sustained motivation, as evidenced by integrated programs outperforming single modalities.

### How to Best Use the App: A Step-by-Step Guide for Success

To maximize benefits, treat the app as a daily companion rather than a one-off tool. Here's how:

1. **Get Started**: Sign up via email or Google, then log your baseline habits for a week to establish patterns.
2. **Daily Tracking**: Use the "Add Drink" button to record each drink with context (e.g., mood: stressed, location: home). This builds accurate data for AI analysis—aim for honesty to unlock insights.
3. **Engage with Therapeutic Sections**: When an urge hits, toggle the "Mindful Pause" for quick breathing or urge surfing exercises. In CBT, log triggers (e.g., "work stress") and use the reframing tool to shift thoughts. Review saved triggers weekly to spot patterns.
4. **Review Progress and AI Advice**: Visit the dashboard daily or weekly to see charts and Grok's personalized recommendations. For example, if AI flags "social settings" as a trigger, practice CBT refusal skills before events.
5. **Consistency is Key**: Use for at least 8-12 weeks, as studies show sustained engagement yields the best results. Combine with professional support if needed, and celebrate milestones—like below-average days—with the app's motivational messages.

**Pro Tip**: Enable notifications for daily check-ins and integrate non-alcoholic alternatives into your routine, amplifying the app's therapeutic effects.

### The Bottom Line: Transform Your Habits with Confidence

In today's fast-paced world, the Alcohol Support Tracker isn't just an app—it's a lifeline for reclaiming control. Priced affordably (free tier with premium AI unlocks), it's backed by cutting-edge tech and timeless psychology, delivering results where generic trackers fall short. Whether you're reducing social drinks or overcoming dependence, this app works because it meets you where you are, with tools that adapt and empower. Download today and start your journey to a balanced, healthier life—your future self will thank you.
`

// Parse Markdown for rendering
const parsedBriefExplanation = computed(() => marked.parse(briefExplanation, { breaks: true }))
const parsedLongExplanation = computed(() => marked.parse(longExplanation, { breaks: true }))

// Smooth scroll to section
function scrollToSection(id) {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<style scoped>
/* Scoped styles for submenu to avoid global conflicts */
.submenu {
  position: sticky;
  top: 60px; /* Below header */
  background-color: #f9f9f9;
  padding: 1rem;
  border-bottom: 1px solid #ddd;
  z-index: 1000;
}

.submenu-links {
  display: flex;
  justify-content: center;
  gap: 1rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.submenu-link {
  padding: 0.75rem 1.25rem; /* Larger padding for touch targets */
  text-decoration: none;
  color: #3498db;
  border-radius: 4px;
  transition: background 0.3s;
  font-size: 1.1rem; /* Slightly larger for mobile readability */
}

.submenu-link:hover {
  background-color: rgba(52, 152, 219, 0.2); /* Stronger hover contrast */
}

/* Mobile: Stack submenu links vertically with enhanced touch targets */
@media (max-width: 768px) {
  .submenu-links {
    flex-direction: column;
    align-items: center;
  }
  .submenu-link {
    width: 100%; /* Full width for easier tapping */
    text-align: center;
    padding: 1rem; /* Larger padding for touch */
    font-size: 1.2rem; /* Larger font for readability */
    min-height: 44px; /* Minimum touch target size */
  }
}
</style>