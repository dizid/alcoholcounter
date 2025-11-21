# Daily Drink Tracker - Project Documentation

## Project Overview

**Daily Drink Tracker** is a Vue 3 web application designed to help users moderate alcohol consumption through evidence-based tools including:
- Daily drink tracking with contextual data (mood, location, triggers)
- AI-powered personalized insights from Grok AI
- Mindfulness-Based Relapse Prevention (MBRP) exercises
- Cognitive Behavioral Therapy (CBT) strategies
- Freemium business model with AI quota management

**Target Audience:** Moderate-to-heavy drinkers seeking to reduce consumption, track patterns, or support recovery.

**Business Model:**
- Free tier: 10 AI insights/month, unlimited tracking
- Premium tier: $9/month, 100 AI insights/month

---

## Tech Stack

### Frontend
- **Framework**: Vue 3 with Composition API (`<script setup>`)
- **Build Tool**: Vite
- **Routing**: Vue Router
- **State Management**: Pinia (subscriptions, onboarding, user)
- **Styling**: Pico CSS + custom CSS
- **Charts**: Chart.js
- **Markdown**: marked.js

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (JWT)
- **Serverless Functions**: Netlify Functions
- **AI**: Grok API (via x.ai)
- **Payments**: PayPal Subscriptions API (modular for Stripe)

### Infrastructure
- **Hosting**: Netlify
- **Database**: Supabase Cloud
- **Version Control**: Git/GitHub

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Vue 3 SPA)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Landing  │  │Onboarding│  │  Tracker │  │Dashboard │  │
│  │   Page   │→ │  Wizard  │→ │   /app   │  │          │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│         ↓              ↓            ↓             ↓         │
│  ┌───────────────────────────────────────────────────────┐ │
│  │        Pinia Stores (subscription, user, onboarding)  │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              NETLIFY FUNCTIONS (Serverless)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ grok-proxy   │  │ paypal-create│  │ paypal-webhook│    │
│  │ (AI + quota) │  │ -subscription│  │               │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
          ↓                    ↓                  ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐
│  SUPABASE        │  │  GROK AI API     │  │  PAYPAL API  │
│  (PostgreSQL)    │  │  (x.ai)          │  │  (Sandbox)   │
│  - subscriptions │  │  - Completions   │  │  - Billing   │
│  - ai_usage      │  │  - grok-3 model  │  │  - Webhooks  │
│  - drink_logs    │  │                  │  │              │
└──────────────────┘  └──────────────────┘  └──────────────┘
```

---

## Key Features

### 1. **User Onboarding** (5-step wizard)
- **Step 1**: Primary goal (reduce/track/recovery)
- **Step 2**: Current habits (drinks/week, contexts)
- **Step 3**: Triggers & challenges
- **Step 4**: Plan selection (Free vs Premium)
- **Step 5**: Account creation
- **localStorage persistence**: Resume after 7 days
- **Purpose**: Collects data for AI personalization

### 2. **Drink Tracking**
- Log drinks with context (mood, location, company, drink type)
- View current day count
- Real-time motivational messages
- Compare to 30-day average

### 3. **AI-Powered Insights** (Quota-based)
- **Dashboard**: Personalized advice analyzing triggers, patterns, reflections
- **Mindfulness Tips**: Contextual suggestions for managing urges
- **Quota System**:
  - Free: 10 AI calls/month
  - Premium: 100 AI calls/month
  - Server-side enforcement in `grok-proxy.js`
  - Automatic monthly reset (1st of month)

### 4. **Mindfulness Exercises** (MBRP)
- **Present-Moment Awareness**: Breathing timer with speech synthesis
- **Acceptance Strategies**: AI-generated coping tips
- **Urge Surfing**: Interactive checklist
- User reflections with history
- Streak tracking

### 5. **CBT Tools**
- **Trigger Identification**: Log triggers with coping strategies
- **Thought Reframing**: Reframe negative thoughts
- **Skills Training**: Practice refusal techniques

### 6. **Analytics Dashboard**
- 30-day bar chart of daily drinks
- Historical patterns analysis
- AI advice based on all user data

### 7. **Subscription Management**
- Free tier (default)
- Premium upgrade via PayPal
- Subscription settings page
- Cancel anytime
- Quota display in navbar

---

## Database Schema

### Core Tables

#### `subscriptions`
```sql
id UUID PRIMARY KEY
user_id UUID UNIQUE (FK auth.users)
tier VARCHAR(20) DEFAULT 'free'  -- 'free' | 'premium'
status VARCHAR(20) DEFAULT 'active'  -- 'active' | 'cancelled' | 'expired'
paypal_subscription_id VARCHAR(255)
paypal_payer_id VARCHAR(255)
current_period_start TIMESTAMP
current_period_end TIMESTAMP
created_at TIMESTAMP
metadata JSONB
```

#### `ai_usage`
```sql
id UUID PRIMARY KEY
user_id UUID (FK auth.users)
request_type VARCHAR(50)  -- 'dashboard' | 'mindfulness'
tokens_input INTEGER
tokens_output INTEGER
cost_estimate DECIMAL(10,6)
created_at TIMESTAMP  -- Used for monthly quota calculation
```

#### `payments`
```sql
id UUID PRIMARY KEY
user_id UUID (FK auth.users)
amount DECIMAL(10,2)
currency VARCHAR(3) DEFAULT 'USD'
status VARCHAR(20)  -- 'pending' | 'completed' | 'failed'
provider VARCHAR(50)  -- 'paypal' | 'stripe'
provider_transaction_id VARCHAR(255)
payment_type VARCHAR(50)  -- 'subscription' | 'one_time'
created_at TIMESTAMP
metadata JSONB
```

#### `drink_logs`
```sql
id UUID PRIMARY KEY
user_id UUID (FK auth.users)
location TEXT
company TEXT
drink_type TEXT
mood TEXT
created_at TIMESTAMP
```

#### `user_triggers`
```sql
id UUID PRIMARY KEY
user_id UUID (FK auth.users)
trigger_text TEXT
coping_strategy TEXT
created_at TIMESTAMP
```

#### `user_reflections`
```sql
id UUID PRIMARY KEY
user_id UUID (FK auth.users)
reflection_text TEXT
exercise_type VARCHAR(50)  -- 'awareness' | 'acceptance' | 'intervention'
created_at TIMESTAMP
```

#### `user_mindfulness_sessions`
```sql
id UUID PRIMARY KEY
user_id UUID (FK auth.users)
session_date DATE
```

### SQL Functions

#### `get_user_quota_info(p_user_id UUID)`
Returns JSON with:
- `tier`: 'free' or 'premium'
- `quota_limit`: 10 or 100
- `usage_count`: Current month usage
- `remaining`: Quota left
- `reset_date`: First day of next month

#### `get_current_month_ai_usage(p_user_id UUID)`
Returns INTEGER count of AI calls this month.

### Triggers

#### `create_free_subscription_for_new_user()`
Auto-creates free subscription on user signup.

---

## File Structure

```
alcoholcounter/
├── netlify/
│   └── functions/
│       ├── grok-proxy.js              # AI proxy with quota enforcement
│       ├── paypal-create-subscription.js
│       ├── paypal-webhook.js
│       └── paypal-cancel-subscription.js
├── src/
│   ├── assets/
│   │   └── styles.css
│   ├── components/
│   │   ├── MainMenu.vue
│   │   ├── ContextForm.vue
│   │   ├── QuotaDisplay.vue          # Shows AI usage in navbar
│   │   ├── UpgradeModal.vue          # Shown when quota exceeded
│   │   └── Onboarding/
│   │       ├── Step1Welcome.vue
│   │       ├── Step2Habits.vue
│   │       ├── Step3Triggers.vue
│   │       ├── Step4Pricing.vue
│   │       └── Step5Signup.vue
│   ├── services/
│   │   ├── auth.js
│   │   ├── db.js                     # Supabase database queries
│   │   ├── grok.js                   # AI service
│   │   ├── paymentService.js         # Payment abstraction layer
│   │   ├── quotaService.js           # Quota checking/tracking
│   │   └── providers/
│   │       └── paypalProvider.js     # PayPal implementation
│   ├── stores/
│   │   ├── user.js                   # User auth state
│   │   ├── subscription.js           # Tier, quota, usage
│   │   └── onboarding.js             # Wizard state + localStorage
│   ├── views/
│   │   ├── LandingPage.vue           # Public homepage (/)
│   │   ├── OnboardingWizard.vue      # 5-step wizard (/onboarding)
│   │   ├── Login.vue                 # Auth (/login)
│   │   ├── MainTracker.vue           # Drink tracker (/app)
│   │   ├── Dashboard.vue             # Analytics (/dashboard)
│   │   ├── SubscriptionSettings.vue  # Manage plan (/subscription)
│   │   ├── AboutTracker.vue          # About page
│   │   └── Feedback.vue              # Feedback form
│   ├── main.js
│   ├── router.js
│   └── supabase.js
├── supabase-migrations.sql           # Database schema
├── .env.example
├── package.json
└── vite.config.js
```

---

## Development Setup

### 1. Prerequisites
```bash
- Node.js 18+
- npm or pnpm
- Git
- Netlify CLI: npm install -g netlify-cli
```

### 2. Clone & Install
```bash
git clone <repo-url>
cd alcoholcounter
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Grok AI
GROK_API_KEY=your-grok-api-key

# PayPal (Sandbox for testing)
PAYPAL_CLIENT_ID=your-sandbox-client-id
PAYPAL_CLIENT_SECRET=your-sandbox-secret
PAYPAL_PLAN_ID=your-plan-id
PAYPAL_WEBHOOK_ID=your-webhook-id
PAYPAL_SANDBOX=true

# Site
URL=http://localhost:8888
NODE_ENV=development
```

### 4. Database Setup
1. Go to Supabase Dashboard → SQL Editor
2. Run entire `supabase-migrations.sql` file
3. Verify tables created:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public';
   ```

### 5. PayPal Setup (Sandbox)
1. **Create App**: [developer.paypal.com](https://developer.paypal.com)
   - Sandbox → Apps → Create App
   - Copy Client ID & Secret

2. **Create Billing Plan**:
   - Products → Plans → Create Plan
   - Product: "Daily Drink Tracker Premium"
   - Billing: $9/month, recurring monthly
   - Copy Plan ID

3. **Create Webhook**:
   - Webhooks → Create Webhook
   - URL: `https://your-site.netlify.app/.netlify/functions/paypal-webhook`
   - Events: Select all `BILLING.SUBSCRIPTION.*` and `PAYMENT.SALE.*`
   - Copy Webhook ID

### 6. Run Locally
```bash
netlify dev
# Opens http://localhost:8888
```

---

## Payment Flow

### Upgrade to Premium
```
User clicks "Upgrade"
  ↓
subscriptionStore.upgradeToPremium()
  ↓
Calls /.netlify/functions/paypal-create-subscription
  ↓
Creates subscription in PayPal
  ↓
Returns approval URL
  ↓
Redirects user to PayPal checkout
  ↓
User approves
  ↓
PayPal redirects to /app?paypal=success
  ↓
PayPal sends webhook to /paypal-webhook
  ↓
Webhook updates DB: tier='premium', status='active'
  ↓
User sees 100 AI insights quota
```

### Cancel Subscription
```
User clicks "Cancel" in /subscription
  ↓
subscriptionStore.cancelSubscription()
  ↓
Calls /.netlify/functions/paypal-cancel-subscription
  ↓
Cancels in PayPal API
  ↓
Updates DB: tier='free', status='cancelled'
  ↓
User downgraded to 10 AI insights/month
```

---

## AI Quota Enforcement

### How It Works

1. **Pre-Check (Client)**:
   ```javascript
   // Before making AI call
   const quotaInfo = await getUserQuotaInfo()
   if (quotaInfo.remaining <= 0) {
     showUpgradeModal()
     return
   }
   ```

2. **Server-Side Enforcement** (`grok-proxy.js`):
   ```javascript
   // Extract user from auth token
   const userId = await getUserIdFromRequest(event)

   // Check quota using SQL function
   const { allowed, quotaInfo } = await checkQuota(userId)

   if (!allowed) {
     return 429 {
       error: 'Quota exceeded',
       message: 'Upgrade to Premium for 100 insights!'
     }
   }

   // Make AI call
   const response = await fetch('https://api.x.ai/v1/chat/completions', ...)

   // Track usage
   await trackUsage(userId, requestType, tokensUsed)
   ```

3. **Monthly Reset**:
   - Quota calculated dynamically based on `created_at >= first_day_of_month`
   - No cron job needed - automatic on 1st of month

---

## Important Code Patterns

### 1. **Using Subscription Store**
```javascript
import { useSubscriptionStore } from '@/stores/subscription'

const subscriptionStore = useSubscriptionStore()

// Initialize on app load
await subscriptionStore.initialize()

// Check quota before AI call
if (!subscriptionStore.hasQuotaAvailable) {
  showUpgradeModal()
  return
}

// Make AI call
const advice = await getGrokAdvice(userData)

// Refresh quota
await subscriptionStore.fetchAIUsage()
```

### 2. **Onboarding with localStorage**
```javascript
import { useOnboardingStore } from '@/stores/onboarding'

const onboardingStore = useOnboardingStore()

// On mount
const hasData = onboardingStore.loadFromLocalStorage()
if (hasData && onboardingStore.currentStep > 1) {
  showResumeModal()
}

// Save on step change
onboardingStore.updateStep1({ primaryGoal: 'reduce' })
// Auto-saves to localStorage with 7-day TTL

// Complete onboarding
onboardingStore.complete()  // Clears localStorage
```

### 3. **Database Queries with RLS**
```javascript
import { supabase } from '@/supabase'

// User is automatically from JWT token via RLS
const { data, error } = await supabase
  .from('drink_logs')
  .select('*')
  .order('created_at', { ascending: false })
// Only returns current user's logs (RLS enforced)
```

### 4. **Error Handling Pattern**
```javascript
try {
  const result = await someAsyncOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  // User-friendly error message
  errorMessage.value = 'Something went wrong. Please try again.'
  // Don't throw - let user continue
}
```

---

## Testing Checklist

### Local Testing

**1. Landing Page**
- [ ] Loads at `http://localhost:8888/`
- [ ] Pricing cards show Free ($0) and Premium ($9)
- [ ] "Get Started Free" → redirects to `/onboarding`

**2. Onboarding Wizard**
- [ ] Step 1: Select goal → enabled "Next" button
- [ ] Step 2: Optional fields work
- [ ] Step 3: Add trigger → shows as tag
- [ ] Step 4: Plan selection → shows in summary
- [ ] Step 5: Create account → redirects to `/app`
- [ ] localStorage: Refresh page → asks to resume
- [ ] localStorage: After 7 days → starts fresh

**3. Quota System**
- [ ] New user: Shows 0/10 used
- [ ] View Dashboard: Increments to 1/10
- [ ] Get Mindfulness Tip: Increments to 2/10
- [ ] Use 10 times: Shows UpgradeModal
- [ ] Premium user: Shows 0/100

**4. PayPal Integration** (Sandbox)
- [ ] Click "Upgrade to Premium"
- [ ] Redirects to PayPal sandbox
- [ ] Login with sandbox buyer account
- [ ] Approve subscription
- [ ] Redirects back to `/app`
- [ ] Database: `tier='premium'`, `paypal_subscription_id` set
- [ ] Quota: Now shows 0/100

**5. Subscription Management**
- [ ] `/subscription` page loads
- [ ] Shows current plan (Free or Premium)
- [ ] Shows quota bar
- [ ] Premium: "Cancel Subscription" button
- [ ] Cancel: Downgrades to free tier
- [ ] Database: `tier='free'`, `status='cancelled'`

**6. AI Calls**
- [ ] Dashboard: Returns personalized advice
- [ ] Mindfulness: Returns coping tip
- [ ] Quota exceeded: Returns 429 error
- [ ] `ai_usage` table: New row after each call

---

## Deployment

### Netlify Deploy

```bash
# Link to Netlify
netlify link

# Deploy
netlify deploy --prod
```

### Post-Deployment Checklist

**1. Environment Variables** (Netlify Dashboard → Site Settings → Environment Variables)
- [ ] All variables from `.env.example` added
- [ ] `PAYPAL_SANDBOX=false` for production
- [ ] Use production PayPal credentials

**2. Supabase**
- [ ] Migrations run on production database
- [ ] RLS policies enabled
- [ ] Service role key in Netlify env vars

**3. PayPal Production**
- [ ] Create production app (not sandbox)
- [ ] Create production billing plan
- [ ] Create webhook pointing to production URL
- [ ] Update env vars with production credentials

**4. DNS**
- [ ] Custom domain configured
- [ ] HTTPS enabled

**5. Testing**
- [ ] Full user journey: Landing → Onboarding → Tracking → Upgrade → Cancel
- [ ] Real PayPal transaction (refund after)

---

## Troubleshooting

### Common Issues

**1. "Quota exceeded" but user is premium**
- **Cause**: Subscription not synced to database
- **Fix**: Check `subscriptions` table, verify `tier='premium'`
- **Debug**: `SELECT * FROM subscriptions WHERE user_id = 'USER_ID'`

**2. AI call returns 401 Unauthorized**
- **Cause**: Missing or invalid auth token
- **Fix**: Ensure `Authorization: Bearer <token>` header sent
- **Debug**: Check browser DevTools → Network → Request Headers

**3. PayPal redirect fails**
- **Cause**: Invalid `return_url` or `cancel_url`
- **Fix**: Check `URL` env var matches deployment URL
- **Debug**: Check Netlify function logs

**4. Webhook not updating database**
- **Cause**: Webhook signature validation failing
- **Fix**: Verify `PAYPAL_WEBHOOK_ID` is correct
- **Debug**: Check Netlify function logs for "Invalid signature"

**5. Onboarding localStorage not persisting**
- **Cause**: Browser privacy mode or localStorage disabled
- **Fix**: Check browser settings, try different browser
- **Debug**: `localStorage.getItem('alcohol_tracker_onboarding')`

---

## Support

### Resources

- **Supabase Docs**: https://supabase.com/docs
- **Vue 3 Docs**: https://vuejs.org/
- **PayPal API**: https://developer.paypal.com/docs/api/overview/
- **Netlify Functions**: https://docs.netlify.com/functions/overview/

### Contact

- **Creator**: Marc from Rotterdam
- **Feedback**: Via app feedback form

---

**Last Updated**: November 2025
**Version**: 0.7.0 (Freemium + PayPal Integration)
