<template>
  <div class="landing-page">
    <!-- Navigation Header -->
    <nav class="nav-header">
      <div class="nav-container">
        <h2 class="logo">Daily Drink Tracker</h2>
        <div class="nav-buttons">
          <button @click="goToLogin" class="btn-secondary">Sign In</button>
          <button @click="scrollToOnboarding" class="btn-primary">Get Started Free</button>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">Track Smarter. Drink Mindfully.</h1>
        <p class="hero-subtitle">
          Evidence-based tools to help you moderate alcohol use with AI-powered insights,
          CBT strategies, and mindfulness exercises.
        </p>
        <button @click="scrollToOnboarding" class="btn-hero">Start Free Today</button>
        <p class="hero-trust">No credit card required • Free forever plan • Privacy-first</p>
      </div>
    </section>

    <!-- Problem Statement -->
    <section class="problem">
      <div class="section-container">
        <h2>You Know Your Drinking Has Crept Up</h2>
        <p>
          Maybe you've told yourself you'll cut back... tomorrow. Generic counter apps feel cold and empty.
          Traditional programs aren't quite right for where you are.
        </p>
        <p>
          <strong>You need something evidence-based, private, and actually helpful in the moment when you're reaching for that drink.</strong>
        </p>
      </div>
    </section>

    <!-- Features Grid -->
    <section class="features">
      <div class="section-container">
        <h2>Science-Backed Tools That Actually Work</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🧠</div>
            <h3>AI-Powered Insights</h3>
            <p>Personalized advice from Grok AI based on YOUR patterns, triggers, and progress. Not generic tips.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>Smart Tracking</h3>
            <p>Log drinks with context (mood, location, triggers). See patterns over 30 days with beautiful charts.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🧘</div>
            <h3>Mindfulness Exercises</h3>
            <p>Breathing exercises, urge surfing, and acceptance strategies proven to reduce cravings.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">💭</div>
            <h3>CBT Strategies</h3>
            <p>Identify triggers, reframe negative thoughts, and build real coping skills for high-risk situations.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🔒</div>
            <h3>Privacy-First</h3>
            <p>Your data is encrypted and never shared. Track honestly without judgment or exposure.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📚</div>
            <h3>Evidence-Based</h3>
            <p>Built on peer-reviewed research. MBRP and CBT techniques proven to reduce drinking.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section class="pricing" id="pricing">
      <div class="section-container">
        <h2>Choose Your Plan</h2>
        <p class="pricing-subtitle">Start free. Upgrade anytime for more AI insights.</p>

        <div class="pricing-cards">
          <!-- Free Tier -->
          <div class="pricing-card">
            <div class="pricing-header">
              <h3>Free</h3>
              <div class="price">
                <span class="price-amount">$0</span>
                <span class="price-period">/forever</span>
              </div>
              <p class="pricing-description">Perfect for getting started</p>
            </div>
            <ul class="pricing-features">
              <li>✓ Unlimited drink tracking</li>
              <li>✓ <strong>10 AI insights per month</strong></li>
              <li>✓ CBT & mindfulness exercises</li>
              <li>✓ Progress charts & analytics</li>
              <li>✓ Trigger & reflection tracking</li>
              <li>✓ Privacy-first & secure</li>
            </ul>
            <button @click="scrollToOnboarding" class="btn-pricing btn-free">Start Free</button>
            <p class="pricing-note">No credit card required</p>
          </div>

          <!-- Premium Tier -->
          <div class="pricing-card pricing-card-featured">
            <div class="pricing-badge">Most Popular</div>
            <div class="pricing-header">
              <h3>Premium</h3>
              <div class="price">
                <span class="price-amount">$9</span>
                <span class="price-period">/month</span>
              </div>
              <p class="pricing-description">For deeper insights & support</p>
            </div>
            <ul class="pricing-features">
              <li>✓ Everything in Free</li>
              <li>✓ <strong>100 AI insights per month</strong></li>
              <li>✓ Priority support</li>
              <li>✓ Advanced analytics (coming soon)</li>
              <li>✓ Early access to new features</li>
              <li>✓ Support our development</li>
            </ul>
            <button @click="scrollToOnboarding" class="btn-pricing btn-premium">Start Free Trial</button>
            <p class="pricing-note">Cancel anytime • No commitments</p>
          </div>
        </div>

        <div class="pricing-info">
          <p><strong>💡 What are "AI insights"?</strong></p>
          <p>
            Each time you view your Dashboard or get a Mindfulness tip, our AI analyzes YOUR data
            (drinking patterns, triggers, reflections) to give personalized advice. Free users get 10/month.
            Premium users get 100/month.
          </p>
          <p class="pricing-value">
            <strong>The more data you share, the better your AI insights become.</strong>
            Track contexts, log triggers, write reflections – and watch the AI get smarter about helping YOU.
          </p>
        </div>
      </div>
    </section>

    <!-- Social Proof / Credibility -->
    <section class="credibility">
      <div class="section-container">
        <h2>Built on Science</h2>
        <p>
          Our approach combines Mindfulness-Based Relapse Prevention (MBRP) and Cognitive Behavioral Therapy (CBT) –
          two evidence-based methods proven to reduce alcohol consumption and prevent relapse.
        </p>
        <div class="credibility-stats">
          <div class="stat">
            <div class="stat-number">6+</div>
            <div class="stat-label">Peer-reviewed studies</div>
          </div>
          <div class="stat">
            <div class="stat-number">Privacy-first</div>
            <div class="stat-label">Your data stays yours</div>
          </div>
          <div class="stat">
            <div class="stat-number">Free forever</div>
            <div class="stat-label">No forced upgrades</div>
          </div>
        </div>
        <router-link to="/about-tracker" class="link-credibility">Read the research →</router-link>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta" id="get-started">
      <div class="section-container">
        <h2>Ready to Take Control?</h2>
        <p>Join others who are tracking smarter and drinking more mindfully.</p>
        <button @click="goToOnboarding" class="btn-cta">Get Started Free</button>
        <p class="cta-subtext">Takes 2 minutes • No credit card • Start tracking today</p>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="section-container">
        <p>Made with care by Marc from Rotterdam 🙏</p>
        <div class="footer-links">
          <router-link to="/about-tracker">About</router-link>
          <router-link to="/feedback">Feedback</router-link>
          <a href="mailto:support@example.com">Support</a>
        </div>
        <p class="footer-privacy">Privacy-first • Your data is never shared</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function scrollToOnboarding() {
  router.push('/onboarding')
}

function scrollToPricing() {
  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
}

function goToLogin() {
  router.push('/login')
}

function goToOnboarding() {
  router.push('/onboarding')
}
</script>

<style scoped>
/* Global landing page styles */
.landing-page {
  width: 100%;
  overflow-x: hidden;
}

/* Navigation */
.nav-header {
  background: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 1rem 0;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
  margin: 0;
}

.nav-buttons {
  display: flex;
  gap: 1rem;
}

/* Hero Section */
.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 6rem 2rem;
  text-align: center;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.95;
  line-height: 1.6;
}

.btn-hero {
  background: white;
  color: #667eea;
  font-size: 1.25rem;
  padding: 1rem 2.5rem;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-hero:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
}

.hero-trust {
  margin-top: 1.5rem;
  font-size: 0.95rem;
  opacity: 0.9;
}

/* Section Container */
.section-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Problem Section */
.problem {
  padding: 4rem 2rem;
  background: #f8f9fa;
  text-align: center;
}

.problem h2 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.problem p {
  font-size: 1.1rem;
  max-width: 700px;
  margin: 1rem auto;
  line-height: 1.7;
  color: #555;
}

/* Features Grid */
.features {
  padding: 4rem 2rem;
}

.features h2 {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 3rem;
  color: #2c3e50;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 12px rgba(0,0,0,0.15);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
  color: #2c3e50;
}

.feature-card p {
  color: #666;
  line-height: 1.6;
}

/* Pricing Section */
.pricing {
  padding: 4rem 2rem;
  background: #f8f9fa;
}

.pricing h2 {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.pricing-subtitle {
  text-align: center;
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 3rem;
}

.pricing-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  max-width: 900px;
  margin: 0 auto 3rem;
}

.pricing-card {
  background: white;
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
}

.pricing-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.15);
}

.pricing-card-featured {
  border: 3px solid #667eea;
  transform: scale(1.05);
}

.pricing-badge {
  position: absolute;
  top: -12px;
  right: 20px;
  background: #667eea;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: bold;
}

.pricing-header h3 {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.price {
  margin: 1rem 0;
}

.price-amount {
  font-size: 3rem;
  font-weight: bold;
  color: #667eea;
}

.price-period {
  font-size: 1rem;
  color: #666;
}

.pricing-description {
  color: #666;
  margin-bottom: 1.5rem;
}

.pricing-features {
  list-style: none;
  padding: 0;
  margin: 2rem 0;
}

.pricing-features li {
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
  color: #555;
}

.pricing-features li:last-child {
  border-bottom: none;
}

.btn-pricing {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-free {
  background: #f0f0f0;
  color: #2c3e50;
}

.btn-free:hover {
  background: #e0e0e0;
}

.btn-premium {
  background: #667eea;
  color: white;
}

.btn-premium:hover {
  background: #5568d3;
}

.pricing-note {
  text-align: center;
  font-size: 0.85rem;
  color: #999;
  margin-top: 1rem;
}

.pricing-info {
  max-width: 700px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  border-left: 4px solid #667eea;
}

.pricing-info p {
  margin: 0.75rem 0;
  line-height: 1.7;
  color: #555;
}

.pricing-value {
  font-style: italic;
  color: #667eea;
}

/* Credibility Section */
.credibility {
  padding: 4rem 2rem;
  text-align: center;
}

.credibility h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.credibility-stats {
  display: flex;
  justify-content: center;
  gap: 3rem;
  margin: 3rem 0;
  flex-wrap: wrap;
}

.stat {
  text-align: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 1rem;
  color: #666;
}

.link-credibility {
  color: #667eea;
  font-size: 1.1rem;
  text-decoration: none;
  font-weight: bold;
}

.link-credibility:hover {
  text-decoration: underline;
}

/* CTA Section */
.cta {
  padding: 5rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
}

.cta h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.cta p {
  font-size: 1.25rem;
  margin-bottom: 2rem;
}

.btn-cta {
  background: white;
  color: #667eea;
  font-size: 1.25rem;
  padding: 1rem 2.5rem;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.3);
}

.cta-subtext {
  margin-top: 1rem;
  font-size: 0.95rem;
  opacity: 0.9;
}

/* Footer */
.footer {
  padding: 3rem 2rem;
  background: #2c3e50;
  color: white;
  text-align: center;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin: 1.5rem 0;
}

.footer-links a {
  color: white;
  text-decoration: none;
}

.footer-links a:hover {
  text-decoration: underline;
}

.footer-privacy {
  margin-top: 1.5rem;
  font-size: 0.9rem;
  opacity: 0.8;
}

/* Button Styles */
.btn-primary, .btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
}

.btn-secondary {
  background: transparent;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-secondary:hover {
  background: #667eea;
  color: white;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .features h2, .pricing h2, .credibility h2, .cta h2 {
    font-size: 1.75rem;
  }

  .pricing-card-featured {
    transform: scale(1);
  }

  .credibility-stats {
    flex-direction: column;
    gap: 2rem;
  }

  .nav-buttons {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
