# AlcoholCounter - Comprehensive Codebase Documentation

**Application Name**: AlcoholCounter
**Version**: 0.6.1
**Last Analysis**: 2025-12-10
**Technology Stack**: Vue 3 + Vite + Pinia + Supabase + Netlify Functions + Grok AI

## Executive Summary

AlcoholCounter is a Vue 3 Progressive Web Application designed to help users track and moderate alcohol consumption through evidence-based mindfulness interventions. The application combines real-time drink tracking, AI-powered personalized advice, data visualization, and interactive mindfulness exercises with secure multi-user support via Supabase's Row Level Security.

**Core Architecture**: Client-side Vue.js SPA with Supabase Backend-as-a-Service (PostgreSQL + Auth) and Netlify serverless functions for AI integration. The app follows a unidirectional data flow pattern with a clean service layer abstraction, ensuring separation of concerns between UI components and backend operations.

---

## Table of Contents

1. [Directory Structure](#directory-structure)
2. [Technology Stack](#technology-stack)
3. [Application Architecture](#application-architecture)
4. [Entry Points](#entry-points)
5. [Core Components & Views](#core-components--views)
6. [Service Layer](#service-layer)
7. [Database Schema](#database-schema)
8. [Backend Integration](#backend-integration)
9. [Key Features](#key-features)
10. [Dependencies & Configuration](#dependencies--configuration)
11. [Build & Deployment](#build--deployment)
12. [Code Patterns & Conventions](#code-patterns--conventions)
13. [Security Considerations](#security-considerations)
14. [Potential Issues & Notes](#potential-issues--notes)
15. [Analysis Checkpoint](#analysis-checkpoint)
16. [Critical Files Reference](#critical-files-reference)
17. [Quick Start Guide](#quick-start-guide)

---

## Directory Structure

```
alcoholcounter/
├── index.html                          # HTML entry point with Google Analytics
├── package.json                        # Dependencies and npm scripts
├── vite.config.js                     # Vite build configuration
├── netlify.toml                       # Netlify deployment config
├── .env                               # Environment variables (gitignored)
├── .gitignore                         # Git exclusions
├── public/
│   └── _redirects                     # Netlify SPA routing rules
├── netlify/
│   └── functions/
│       └── grok-proxy.js             # Serverless AI API proxy (Grok-3)
└── src/
    ├── main.js                        # Application entry point
    ├── App.vue                        # Root component with session management
    ├── router.js                      # Vue Router with auth guards
    ├── supabase.js                    # Supabase client initialization
    ├── assets/
    │   ├── styles.css                # Global styles
    │   ├── logo.png                  # App logo
    │   └── logo-happy-face.jpg       # Additional logo variant
    ├── components/
    │   ├── MainMenu.vue              # Responsive navigation menu
    │   └── ContextForm.vue           # Drink context input form
    ├── views/
    │   ├── MainTracker.vue           # Main tracking interface (527 lines)
    │   ├── Dashboard.vue             # Analytics & AI advice (201 lines)
    │   ├── Login.vue                 # Authentication page (159 lines)
    │   ├── AboutTracker.vue          # Background info (238 lines)
    │   └── Feedback.vue              # User feedback form (36 lines)
    ├── services/
    │   ├── db.js                     # Database operations (169 lines)
    │   ├── auth.js                   # Authentication service (45 lines)
    │   ├── grok.js                   # AI service integration (45 lines)
    │   └── authErrorHandler.js       # Auth error handling (45 lines)
    └── stores/
        └── user.js                   # Pinia user state store (13 lines)
```

---

## Technology Stack

### Frontend Framework & Libraries

- **Vue.js** v3.5.18 - Progressive JavaScript framework
  - Composition API with `<script setup>` syntax
  - Reactive data binding with `ref()` and `computed()`
  - Component-based architecture
- **Vite** v7.1.1 - Next-generation build tool
  - Fast HMR (Hot Module Replacement)
  - Optimized production builds
  - ESBuild-powered transpilation
- **Pinia** v3.0.3 - State management
  - Official Vue store (Vuex successor)
  - Lightweight and intuitive API
- **Vue Router** v4.5.1 - Client-side routing
  - Navigation guards for authentication
  - SPA routing with history mode

### UI & Visualization

- **Pico CSS** v2 (Amber theme) - Minimal CSS framework (CDN)
  - Semantic HTML styling
  - Responsive by default
- **Chart.js** v4.5.0 - Data visualization
  - 30-day bar chart for drink tracking
  - Responsive canvas rendering
- **Vue Spinner** v1.0.4 - Loading indicators
- **Marked** v16.2.0 - Markdown parser
  - Renders AI-generated advice with formatting

### Backend & Services

- **Supabase** v2.55.0 - Backend-as-a-Service
  - PostgreSQL database with Row Level Security
  - User authentication (email/password, OAuth)
  - Real-time subscriptions capability
  - JWT-based session management
- **Netlify Functions** - Serverless compute
  - AI API proxy for secure key management
- **Grok AI API** (x.ai) - AI-powered advice
  - Model: grok-3
  - Personalized recommendations based on user data

### Development Tools

- **dotenv** v17.2.1 - Environment variable management
- **dotenv-expand** v12.0.2 - Variable expansion utilities
- **Google Analytics** (gtag.js) - User tracking

### Deployment

- **Netlify** - Hosting platform
  - Continuous deployment from Git
  - Serverless functions support
  - SPA routing configuration

---

## Application Architecture

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            Vue 3 Application (SPA)                     │ │
│  │                                                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │ Components   │  │  Pinia Store │  │ Vue Router  │ │ │
│  │  │ (UI Layer)   │  │  (Auth State)│  │ (Navigation)│ │ │
│  │  └──────┬───────┘  └──────────────┘  └─────────────┘ │ │
│  │         │                                             │ │
│  │         ▼                                             │ │
│  │  ┌──────────────────────────────────┐                │ │
│  │  │     Service Layer (Abstraction)  │                │ │
│  │  │  ┌────────┐ ┌──────┐ ┌────────┐ │                │ │
│  │  │  │ db.js  │ │auth.js│ │grok.js│ │                │ │
│  │  │  └────┬───┘ └───┬──┘ └───┬────┘ │                │ │
│  │  └───────┼─────────┼────────┼──────┘                │ │
│  └──────────┼─────────┼────────┼───────────────────────┘ │
└─────────────┼─────────┼────────┼────────────────────────┬─┘
              │         │        │                        │
              ▼         ▼        │                        │
      ┌─────────────────────┐    │                        │
      │  Supabase Backend   │    │                        │
      │  ┌───────────────┐  │    │                        │
      │  │ PostgreSQL DB │  │    │                        │
      │  │  (RLS enabled)│  │    │                        │
      │  └───────────────┘  │    │                        │
      │  ┌───────────────┐  │    │                        │
      │  │ Auth Service  │  │    │                        │
      │  │ (JWT tokens)  │  │    │                        │
      │  └───────────────┘  │    │                        │
      └─────────────────────┘    │                        │
                                 ▼                        │
                       ┌──────────────────┐               │
                       │ Netlify Function │               │
                       │  (grok-proxy.js) │               │
                       └────────┬─────────┘               │
                                │                         │
                                ▼                         │
                         ┌──────────────┐                 │
                         │  Grok AI API │                 │
                         │  (x.ai grok-3)│                │
                         └──────────────┘                 │
                                                          │
              Google Analytics ◄──────────────────────────┘
```

### Data Flow Pattern

**Unidirectional Data Flow**:

```
User Interaction → Component Event Handler → Service Layer Function
                                                     ↓
                                          Supabase API Call
                                                     ↓
                                          Backend Processing
                                                     ↓
                                          Database Operation
                                                     ↓
                                          Response Data
                                                     ↓
                                     Reactive State Update (ref)
                                                     ↓
                                     Template Re-render (automatic)
```

**Example Flow - Adding a Drink**:

1. User clicks "Add Drink" button in [MainTracker.vue](src/views/MainTracker.vue)
2. `handleAddDrink()` handler called in component
3. Calls `addDrinkLog(context)` from [db.js](src/services/db.js)
4. Service validates user authentication via Supabase
5. Inserts record into `drink_logs` table with user_id (RLS applied)
6. Response received and `drinkCount.value++` updates reactive state
7. Template automatically re-renders with new count
8. Progress message updates via `updateProgressMessage()`

### State Management

**Pinia Store** (Centralized):
- **Location**: [src/stores/user.js](src/stores/user.js)
- **Purpose**: Global authentication state only
- **State**: `user` (authenticated user object or null)
- **Actions**: `setUser(newUser)`

**Component State** (Local):
- Most UI state lives in component `ref()` declarations
- Examples: `drinkCount`, `showContextForm`, `progressMessage`, `timer`
- Computed properties for derived state (e.g., `timerDisplay`, `filteredReflections`)

**Session Persistence**:
- Supabase automatically handles JWT token storage in localStorage
- Session validated on app mount via `supabase.auth.getUser()`
- Auth state listener syncs changes globally

---

## Entry Points

### HTML Entry
**File**: [index.html](index.html)

- Contains Google Analytics integration (gtag.js, ID: G-MN2MDNRW4L)
- Links to Pico CSS v2 Amber theme via CDN
- Imports global styles from [src/assets/styles.css](src/assets/styles.css)
- Mounts Vue app to `<div id="app"></div>`

### JavaScript Entry
**File**: [src/main.js](src/main.js)

```javascript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())  // State management
app.use(router)         // Routing
app.mount('#app')
```

### Root Component
**File**: [src/App.vue](src/App.vue)

- Renders [MainMenu.vue](src/components/MainMenu.vue) navigation
- Contains `<router-view>` for page content
- Validates session on mount
- Sets up auth state change listener
- Configures browser notifications (30-min intervals)

### Router Configuration
**File**: [src/router.js](src/router.js)

Defines 5 routes with authentication guards:
- `/` → MainTracker (requires auth)
- `/login` → Login (public)
- `/dashboard` → Dashboard (requires auth)
- `/feedback` → Feedback (requires auth)
- `/about` → AboutTracker (public)

**Auth Guard Logic**:
```javascript
router.beforeEach(async (to, from, next) => {
  // Validates session with server before allowing access
  // Redirects to /login if authentication required but not present
})
```

---

## Core Components & Views

### Pages (Views)

#### 1. MainTracker.vue
**Location**: [src/views/MainTracker.vue](src/views/MainTracker.vue)
**Lines**: 527
**Purpose**: Primary user interface for daily tracking and mindfulness

**Features**:
- **Drink Counter**
  - Today's drink count with increment button
  - Optional context form (location, company, drink type, mood)
  - Dynamic progress messages with tips
- **Mindfulness Section** (3 tabs)
  - **Awareness Tab**: Breathing exercises with 60s timer
  - **Acceptance Tab**: Acceptance strategies with AI-generated tips
  - **Urge Surfing Tab**: Interactive checklist (6 steps) + reflections
- **Trigger Tracking**
  - Add triggers with coping strategies
  - View all user triggers
- **Reflection Journaling**
  - Save reflections tied to exercise type
  - View filtered reflections by tab
- **Mindfulness Streak**
  - Daily session logging
  - Streak counter with localStorage caching

**Key Functions**:
- `handleAddDrink()` - Adds drink with context
- `handleToggleMindfulness()` - Shows/hides mindfulness section
- `startTimer()`, `pauseTimer()`, `resetTimer()` - Breathing exercise controls
- `handleAcceptanceToggle()` - Requests AI mindfulness tip
- `updateProgressMessage()` - Dynamic motivational messages

#### 2. Dashboard.vue
**Location**: [src/views/Dashboard.vue](src/views/Dashboard.vue)
**Lines**: 201
**Purpose**: Analytics and AI-powered insights

**Features**:
- **30-Day Bar Chart**
  - Visualizes drinking patterns using Chart.js
  - Aggregates drinks by date
  - Responsive canvas rendering
- **AI-Generated Advice**
  - Personalized recommendations from Grok-3
  - Based on triggers, context, patterns, and reflections
  - Rendered as formatted markdown
- **Loading States**
  - Vue Spinner for async operations

**Key Functions**:
- `loadData()` - Fetches all user data (logs, triggers, reflections, context)
- `renderChart()` - Creates Chart.js bar chart instance
- `fetchAiAdvice()` - Calls Grok API for personalized advice

#### 3. Login.vue
**Location**: [src/views/Login.vue](src/views/Login.vue)
**Lines**: 159
**Purpose**: User authentication

**Features**:
- Email/password login
- New user sign-up with email confirmation
- OAuth provider support (Google configured)
- Error handling with user-friendly messages
- Redirect to intended page after login

**Key Functions**:
- `handleLogin()` - Email/password authentication
- `handleSignUp()` - User registration
- `handleGoogleLogin()` - OAuth login flow

#### 4. AboutTracker.vue
**Location**: [src/views/AboutTracker.vue](src/views/AboutTracker.vue)
**Lines**: 238
**Purpose**: Educational content and app information

**Sections**:
- Scientific background on mindfulness-based interventions
- Creator story and motivation
- Academic references
- Privacy policy

#### 5. Feedback.vue
**Location**: [src/views/Feedback.vue](src/views/Feedback.vue)
**Lines**: 36
**Purpose**: User feedback collection

---

### Reusable Components

#### MainMenu.vue
**Location**: [src/components/MainMenu.vue](src/components/MainMenu.vue)

**Features**:
- Responsive navigation with hamburger menu
- Links to all pages (Tracker, Dashboard, Feedback, Background)
- Logout button with confirmation
- Mobile-friendly design

#### ContextForm.vue
**Location**: [src/components/ContextForm.vue](src/components/ContextForm.vue)

**Features**:
- Optional context capture for drink logging
- 4 dropdowns: Location, Company, Drink Type, Mood
- Emits selected context to parent component

---

## Service Layer

All business logic abstracted into dedicated service files for clean separation of concerns.

### db.js
**Location**: [src/services/db.js](src/services/db.js)
**Lines**: 169
**Purpose**: Database operations (Supabase PostgreSQL)

**Functions**:

**Drink Logging**:
- `addDrinkLog(context)` - Insert drink with optional context (location, company, drink_type, mood)
- `getTodayDrinkCount()` - Get count for current day
- `getHistoricalCounts(days = 30)` - Retrieve aggregated counts for charting
- `getAverageDailyDrinks()` - Calculate user's average daily consumption
- `getContextFrequencies()` - Pattern analysis (most common contexts)
- `getAllDrinkLogs()` - Fetch complete user history

**Trigger Management**:
- `addUserTrigger(trigger, strategy)` - Add trigger with coping strategy
- `getUserTriggers()` - Retrieve all user's triggers

**Reflection Journaling**:
- `addUserReflection(text, exerciseType)` - Save reflection tied to mindfulness tab
- `getUserReflections()` - Fetch all user reflections

**Mindfulness Tracking**:
- `logMindfulnessSession()` - Record session and return all sessions

**RLS Pattern**: All functions automatically include `user_id` from authenticated session.

### auth.js
**Location**: [src/services/auth.js](src/services/auth.js)
**Lines**: 45
**Purpose**: Authentication operations

**Functions**:
- `login(email, password)` - Email/password authentication
- `signUp(email, password)` - User registration with email confirmation
- `loginWithProvider(provider)` - OAuth login (supports Google, GitHub, etc.)
- `logout()` - Session cleanup and sign out

### grok.js
**Location**: [src/services/grok.js](src/services/grok.js)
**Lines**: 45
**Purpose**: AI integration via Netlify Function proxy

**Functions**:
- `getGrokAdvice(userData)` - Fetch personalized advice
  - Input: User's triggers, logs, context, reflections
  - Output: Markdown-formatted advice string
- `getMindfulnessTip(triggers)` - Get context-aware mindfulness tip
  - Input: Array of trigger strings
  - Output: Short mindfulness strategy

**Backend**: Proxies through [netlify/functions/grok-proxy.js](netlify/functions/grok-proxy.js) to hide API keys

### authErrorHandler.js
**Location**: [src/services/authErrorHandler.js](src/services/authErrorHandler.js)
**Lines**: 45
**Purpose**: Centralized authentication error handling

**Functions**:
- `isAuthError(error)` - Detects auth-related errors by pattern matching
- `handleAuthError(error, context)` - Logs out user and redirects to login with error message

**Error Patterns Detected**:
- "not authenticated"
- "session expired"
- "invalid token"
- "jwt expired"
- "unauthorized"

---

## Database Schema

**Backend**: Supabase PostgreSQL with Row Level Security (RLS)

### Tables (inferred from code)

#### 1. drink_logs
**Purpose**: Main tracking table for drink logging

**Columns**:
- `id` - Primary key (auto-generated)
- `created_at` - Timestamp (default: now())
- `user_id` - Foreign key to auth.users (RLS filter)
- `location` - VARCHAR (optional, e.g., "Home", "Bar", "Restaurant")
- `company` - VARCHAR (optional, e.g., "Alone", "Friends", "Family")
- `drink_type` - VARCHAR (optional, e.g., "Beer", "Wine", "Spirits")
- `mood` - VARCHAR (optional, e.g., "Happy", "Stressed", "Sad")

**RLS Policy**: Users can only access their own records

#### 2. user_triggers
**Purpose**: CBT trigger tracking

**Columns**:
- `id` - Primary key
- `created_at` - Timestamp
- `user_id` - Foreign key (RLS filter)
- `trigger_text` - TEXT (description of trigger)
- `coping_strategy` - TEXT (strategy to handle trigger)

**RLS Policy**: Users can only access their own triggers

#### 3. user_reflections
**Purpose**: Mindfulness reflection journaling

**Columns**:
- `id` - Primary key
- `created_at` - Timestamp
- `user_id` - Foreign key (RLS filter)
- `reflection_text` - TEXT (journal entry)
- `exercise_type` - VARCHAR (tab: "awareness", "acceptance", or "urge")

**RLS Policy**: Users can only access their own reflections

#### 4. user_mindfulness_sessions
**Purpose**: Streak tracking for mindfulness practice

**Columns**:
- `id` - Primary key
- `user_id` - Foreign key (RLS filter)
- `session_date` - DATE (unique per user per day)

**RLS Policy**: Users can only access their own sessions

---

## Backend Integration

### Supabase Configuration

**Client Initialization**: [src/supabase.js](src/supabase.js)

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Environment Variables** (in `.env`):
- `VITE_SUPABASE_URL`: https://opdksxeczkuxjvwflmga.supabase.co
- `VITE_SUPABASE_ANON_KEY`: JWT token for anonymous/client-side access

**Features Used**:
- PostgreSQL database with RLS
- Email/password authentication
- OAuth providers (Google)
- Session management with JWT
- Real-time capabilities (not currently used but available)

### Netlify Functions

**Serverless Function**: [netlify/functions/grok-proxy.js](netlify/functions/grok-proxy.js)

**Purpose**: Proxy Grok AI API requests to hide API key from client

**Endpoints**:
- `/.netlify/functions/grok-proxy` (POST)

**Request Types**:
1. `mainAdvice` - Comprehensive personalized advice
2. `mindfulnessTip` - Quick mindfulness strategy

**Implementation**:
```javascript
// Proxies to: https://api.x.ai/v1/chat/completions
// Model: grok-3
// Headers: Authorization: Bearer ${process.env.GROK_API_KEY}
```

**Environment Variable** (Netlify dashboard):
- `GROK_API_KEY`: API key for x.ai

**Prompt Engineering**:
- Includes user's triggers, drinking patterns, context frequencies, and reflections
- Requests markdown-formatted, empathetic, actionable advice

---

## Key Features

### Core Functionality
- ✅ **Real-time Drink Tracking** - Increment counter with instant database sync
- ✅ **Context Capture** - Optional tracking of location, company, drink type, mood
- ✅ **Multi-User Support** - Complete data isolation via Row Level Security
- ✅ **Session Persistence** - JWT-based authentication with server validation

### Mindfulness Interventions
- ✅ **Breathing Exercises** - 60-second guided timer with pause/reset
- ✅ **Acceptance Strategies** - AI-generated tips based on user triggers
- ✅ **Urge Surfing** - Interactive 6-step checklist with reflection journaling
- ✅ **Trigger Tracking** - CBT-based trigger identification and coping strategies
- ✅ **Mindfulness Streaks** - Daily session tracking with localStorage caching

### Analytics & Insights
- ✅ **30-Day Visualization** - Bar chart of drinking patterns (Chart.js)
- ✅ **Pattern Analysis** - Most common contexts (location, company, mood, drink type)
- ✅ **AI-Powered Advice** - Personalized recommendations from Grok-3
- ✅ **Progress Messages** - Dynamic motivational feedback comparing to average

### User Experience
- ✅ **Browser Notifications** - Encouragement every 30 minutes (when opted in)
- ✅ **Responsive Design** - Mobile-friendly via Pico CSS
- ✅ **Progressive Web App** - Works on mobile and desktop browsers
- ✅ **Markdown Rendering** - Formatted AI advice with the Marked library

---

## Dependencies & Configuration

### Production Dependencies

```json
{
  "@supabase/supabase-js": "^2.55.0",
  "chart.js": "^4.5.0",
  "dotenv": "^17.2.1",
  "dotenv-expand": "^12.0.2",
  "marked": "^16.2.0",
  "pinia": "^3.0.3",
  "vue": "^3.5.18",
  "vue-router": "^4.5.1",
  "vue-spinner": "^1.0.4"
}
```

### Development Dependencies

```json
{
  "@vitejs/plugin-vue": "^6.0.1",
  "vite": "^7.1.1"
}
```

### External CDN Resources

- **Pico CSS v2** (Amber theme)
  URL: https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.amber.min.css
- **Google Analytics** (gtag.js)
  ID: G-MN2MDNRW4L

### Configuration Files

#### package.json
**Location**: [package.json](package.json)

**Scripts**:
- `npm run dev` - Start Vite development server
- `npm run build` - Production build to `/dist`
- `npm run preview` - Preview production build

**Node Requirements**: ^20.19.0 || >=22.12.0

#### vite.config.js
**Location**: [vite.config.js](vite.config.js)

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  assetsInclude: ['**/*.jpg', '**/*.png', '**/*.jpeg'],
  resolve: {
    alias: {
      '@': '/src'  // Enables import from '@/components/...'
    }
  }
})
```

#### netlify.toml
**Location**: [netlify.toml](netlify.toml)

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"
```

#### .env
**Location**: [.env](.env) (gitignored)

```
VITE_SUPABASE_URL=https://opdksxeczkuxjvwflmga.supabase.co
VITE_SUPABASE_ANON_KEY=<JWT_TOKEN>
```

**Note**: `GROK_API_KEY` configured in Netlify dashboard, not in `.env`

#### public/_redirects
**Location**: [public/_redirects](public/_redirects)

```
/* /index.html 200
```

Purpose: SPA fallback routing for Netlify

---

## Build & Deployment

### Development Workflow

```bash
# Install dependencies
npm install

# Start development server (localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Deployment Platform: Netlify

**Build Settings**:
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Functions Directory**: `netlify/functions`

**Environment Variables** (Netlify Dashboard):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `GROK_API_KEY`

**Deployment Trigger**:
- Automatic deployment on push to `master` branch
- Manual deployments via Netlify CLI

**SPA Routing**:
- Configured via [public/_redirects](public/_redirects)
- All routes fallback to `index.html` with 200 status

**Serverless Functions**:
- Deployed alongside site to `/.netlify/functions/`
- No cold start optimization currently configured

---

## Code Patterns & Conventions

### Naming Conventions

**Files**:
- Vue components: PascalCase (`MainTracker.vue`, `ContextForm.vue`)
- Services: camelCase (`auth.js`, `db.js`, `grok.js`)
- Routes: kebab-case URLs (`/main-tracker`, `/dashboard`)

**Code**:
- Functions: camelCase (`handleAddDrink`, `updateProgressMessage`)
- Constants: UPPER_SNAKE_CASE (not heavily used in this codebase)
- Component refs: camelCase (`drinkCount`, `showContextForm`)

### Architecture Patterns

#### 1. Service Layer Pattern
**Separation of Concerns**: UI components never directly call Supabase; all backend logic abstracted into service files.

```javascript
// Component (MainTracker.vue)
import { addDrinkLog } from '@/services/db'

async function handleAddDrink(context) {
  await addDrinkLog(context)  // Service handles all DB logic
  drinkCount.value += 1
}

// Service (db.js)
export async function addDrinkLog(context) {
  const { data: { user } } = await supabase.auth.getUser()
  const insertData = { user_id: user.id, ...context }
  return await supabase.from('drink_logs').insert([insertData])
}
```

#### 2. Authentication Guard Pattern
**Router-Level Protection**: Routes requiring authentication validated before navigation.

```javascript
// router.js
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return next({ path: '/login', query: { redirect: to.fullPath } })
    }
  }
  next()
})
```

#### 3. Composition API Pattern
**Vue 3 `<script setup>` Syntax**: All components use modern Composition API.

```javascript
<script setup>
import { ref, computed, onMounted } from 'vue'

const drinkCount = ref(0)
const progressMessage = ref('')

const displayMessage = computed(() =>
  `${progressMessage.value} (${drinkCount.value} drinks)`
)

onMounted(async () => {
  drinkCount.value = await getTodayDrinkCount()
})
</script>
```

#### 4. Reactive State Pattern
**`ref()` for Primitives, `computed()` for Derived State**:

```javascript
// Reactive state
const timer = ref(60)
const isPaused = ref(false)

// Computed derived state
const timerDisplay = computed(() => {
  const minutes = Math.floor(timer.value / 60)
  const seconds = timer.value % 60
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
})
```

#### 5. Row Level Security (RLS) Pattern
**User Isolation**: All database operations automatically filter by authenticated user.

```javascript
export async function getUserTriggers() {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('user_triggers')
    .select('*')
    .eq('user_id', user.id)  // RLS ensures only user's data
    .order('created_at', { ascending: false })
  return data
}
```

### Reactive Update Flow

```
User Action (click, input)
    ↓
Event Handler (handleAddDrink)
    ↓
Service Call (addDrinkLog)
    ↓
Backend Operation (Supabase insert)
    ↓
Reactive State Update (drinkCount.value++)
    ↓
Template Re-render (automatic via Vue reactivity)
    ↓
UI Updated (user sees new count)
```

---

## Security Considerations

### Implemented Security Measures

- ✅ **Row Level Security (RLS)** - All database tables enforce user isolation
- ✅ **Serverless API Proxy** - Grok API key hidden from client via Netlify Function
- ✅ **Session Validation** - Server-side user validation on app mount
- ✅ **Authentication Guards** - Protected routes require valid session
- ✅ **Centralized Error Handling** - Auth errors trigger logout and redirect
- ✅ **Environment Variables** - Sensitive config in `.env` (gitignored)
- ✅ **JWT Token Management** - Supabase handles secure token storage
- ✅ **HTTPS Enforcement** - Netlify enforces SSL/TLS

### Potential Security Improvements

- ⚠️ **No Rate Limiting** - AI API calls could be rate-limited per user
- ⚠️ **No Input Sanitization** - User inputs not explicitly sanitized (rely on Supabase)
- ⚠️ **No CORS Configuration** - Rely on Supabase default CORS policy
- ⚠️ **No Content Security Policy** - No CSP headers configured

---

## Potential Issues & Notes

### Missing Features

- ❌ **No Testing Framework** - No unit, integration, or e2e tests configured
  - **Recommendation**: Add Vitest for component and service testing
- ❌ **No Linting** - No ESLint or Prettier configuration
  - **Recommendation**: Add ESLint + Prettier for code quality
- ❌ **No CI/CD Pipeline** - No automated testing or deployment checks
  - **Recommendation**: Add GitHub Actions for automated checks
- ❌ **No Offline Support** - Application requires network connectivity
  - **Recommendation**: Implement service worker for PWA offline functionality
- ❌ **No TypeScript** - Pure JavaScript implementation
  - **Recommendation**: Consider TypeScript migration for type safety
- ❌ **No Error Boundary** - No global error handling for component crashes
  - **Recommendation**: Add Vue error boundary component

### Areas for Improvement

**Performance**:
- Chart.js instance not destroyed on unmount (potential memory leak)
- No lazy loading of routes
- No image optimization

**User Experience**:
- No loading skeleton states
- Limited error recovery options
- No confirmation dialogs for destructive actions (besides logout)

**Accessibility**:
- No ARIA labels for screen readers
- No keyboard navigation optimizations
- No focus management

**Monitoring**:
- Google Analytics only (no error tracking)
- No performance monitoring
- No user session replay

---

## Analysis Checkpoint

### Analysis Metadata

- **Analysis Date**: 2025-12-10
- **Coverage**: Complete codebase scan (all files reviewed)
- **Status**: Application is production-ready with active deployment
- **Git Branch**: `master`
- **Recent Commits**:
  - 30276cc - v0.6.1
  - 3171bd7 - v0.6.0
  - da825b2 - bug fix
  - 1e9e174 - updated about page
  - 8e289cd - v0.5.0 - Add "Mindful Pause" section

### Code Statistics

| Metric | Count |
|--------|-------|
| View Files | 5 |
| Component Files | 2 |
| Service Files | 4 |
| Database Tables | 4 |
| Serverless Functions | 1 |
| Total Lines (MainTracker) | 527 |
| Total Lines (Dashboard) | 201 |
| Total Lines (Login) | 159 |
| Total Lines (db.js) | 169 |
| Production Dependencies | 9 |
| Dev Dependencies | 2 |

### Feature Completeness

| Feature | Status |
|---------|--------|
| User Authentication | ✅ Complete |
| Drink Tracking | ✅ Complete |
| Context Capture | ✅ Complete |
| Mindfulness Exercises | ✅ Complete |
| Trigger Tracking | ✅ Complete |
| Reflection Journaling | ✅ Complete |
| AI Advice | ✅ Complete |
| Analytics Dashboard | ✅ Complete |
| Browser Notifications | ✅ Complete |
| Responsive Design | ✅ Complete |
| Testing | ❌ Not Implemented |
| Offline Support | ❌ Not Implemented |

---

## Critical Files Reference

### Must-Read Files (Implementation)

1. **[src/views/MainTracker.vue](src/views/MainTracker.vue)** (527 lines)
   - Primary user interface
   - All mindfulness features
   - Trigger and reflection management

2. **[src/services/db.js](src/services/db.js)** (169 lines)
   - All database operations
   - RLS pattern implementation
   - Data aggregation functions

3. **[src/router.js](src/router.js)**
   - Route definitions
   - Authentication guards
   - Redirect logic

4. **[src/App.vue](src/App.vue)**
   - Root component
   - Session validation
   - Auth state listener
   - Notification setup

5. **[netlify/functions/grok-proxy.js](netlify/functions/grok-proxy.js)**
   - AI integration
   - Prompt engineering
   - API key protection

### Configuration Files

1. **[vite.config.js](vite.config.js)** - Build configuration
2. **[netlify.toml](netlify.toml)** - Deployment settings
3. **[package.json](package.json)** - Dependencies and scripts
4. **[.env](.env)** - Environment variables (gitignored)

### Service Layer

1. **[src/services/auth.js](src/services/auth.js)** - Authentication
2. **[src/services/grok.js](src/services/grok.js)** - AI integration
3. **[src/services/authErrorHandler.js](src/services/authErrorHandler.js)** - Error handling

---

## Quick Start Guide

### Prerequisites

- Node.js v20.19.0+ or v22.12.0+
- npm (comes with Node.js)
- Supabase account (for database and auth)
- Netlify account (for deployment)
- Grok API key from x.ai (for AI features)

### Local Development Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd alcoholcounter

# 2. Install dependencies
npm install

# 3. Create .env file
cat > .env << EOF
VITE_SUPABASE_URL=https://opdksxeczkuxjvwflmga.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
EOF

# 4. Start development server
npm run dev

# Server runs at http://localhost:5173
```

### Supabase Setup

1. Create a new Supabase project
2. Create the 4 database tables (see [Database Schema](#database-schema))
3. Enable Row Level Security on all tables
4. Configure authentication providers (email/password, Google OAuth)
5. Copy project URL and anon key to `.env`

### Netlify Deployment

```bash
# 1. Build locally to test
npm run build

# 2. Preview production build
npm run preview

# 3. Deploy to Netlify
# Option A: Push to GitHub and connect repo in Netlify dashboard
# Option B: Use Netlify CLI
netlify deploy --prod

# 4. Configure environment variables in Netlify dashboard:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - GROK_API_KEY
```

### Grok AI Setup

1. Sign up at https://x.ai
2. Generate API key
3. Add `GROK_API_KEY` to Netlify environment variables

### Verification Checklist

- [ ] App loads at localhost:5173
- [ ] Can create account and log in
- [ ] Can add drinks and see count update
- [ ] Dashboard shows chart with data
- [ ] AI advice generates successfully
- [ ] Mindfulness timer works
- [ ] Triggers can be added and viewed
- [ ] Reflections save and display

---

## End of Documentation

**Last Updated**: 2025-12-10
**Maintained By**: Codebase Analysis Agent
**Next Review**: As needed for major updates

For questions or updates, refer to the [Critical Files Reference](#critical-files-reference) section to identify which files to modify.
