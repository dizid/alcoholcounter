<template>
  <div class="achievements-container">
    <h3 class="achievements-title">Your Progress</h3>

    <!-- Streaks Section -->
    <div class="streaks-section">
      <div class="streak-card">
        <span class="streak-number">{{ trackingStreak }}</span>
        <span class="streak-label">Day Tracking Streak</span>
      </div>
      <div class="streak-card">
        <span class="streak-number">{{ mindfulnessStreak }}</span>
        <span class="streak-label">Mindfulness Sessions</span>
      </div>
    </div>

    <!-- Achievements/Badges -->
    <div class="badges-section">
      <h4>Achievements</h4>
      <div class="badges-grid">
        <div
          v-for="badge in allBadges"
          :key="badge.id"
          :class="['badge-item', { unlocked: isBadgeUnlocked(badge.id), locked: !isBadgeUnlocked(badge.id) }]"
        >
          <span class="badge-icon">{{ badge.icon }}</span>
          <span class="badge-name">{{ badge.name }}</span>
          <span class="badge-desc">{{ badge.description }}</span>
          <span v-if="isBadgeUnlocked(badge.id)" class="badge-date">
            {{ formatUnlockDate(badge.id) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Unlock notification -->
    <div v-if="newUnlock" class="unlock-notification">
      <span class="unlock-icon">{{ newUnlock.icon }}</span>
      <div class="unlock-text">
        <strong>Achievement Unlocked!</strong>
        <span>{{ newUnlock.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../supabase'

const props = defineProps({
  trackingStreak: { type: Number, default: 0 },
  mindfulnessStreak: { type: Number, default: 0 },
  totalDrinks: { type: Number, default: 0 },
  totalReflections: { type: Number, default: 0 },
  goalsMetCount: { type: Number, default: 0 }
})

const unlockedAchievements = ref([])
const newUnlock = ref(null)

// Badge definitions
const allBadges = [
  {
    id: 'first_week',
    name: 'First Week',
    description: 'Complete 7 days of tracking',
    icon: '*',
    condition: () => props.trackingStreak >= 7
  },
  {
    id: 'goal_keeper',
    name: 'Goal Keeper',
    description: 'Stay under weekly goal',
    icon: 'v',
    condition: () => props.goalsMetCount >= 1
  },
  {
    id: 'mindful_moment',
    name: 'Mindful Moment',
    description: 'Complete 5 mindfulness sessions',
    icon: '~',
    condition: () => props.mindfulnessStreak >= 5
  },
  {
    id: 'self_aware',
    name: 'Self Aware',
    description: 'Log 10 reflections',
    icon: '#',
    condition: () => props.totalReflections >= 10
  },
  {
    id: 'streak_master',
    name: 'Streak Master',
    description: '14-day tracking streak',
    icon: '!',
    condition: () => props.trackingStreak >= 14
  },
  {
    id: 'month_strong',
    name: 'Month Strong',
    description: '30-day tracking streak',
    icon: '@',
    condition: () => props.trackingStreak >= 30
  }
]

// Check if a badge is unlocked
function isBadgeUnlocked(badgeId) {
  return unlockedAchievements.value.some(a => a.achievement_type === badgeId)
}

// Format unlock date
function formatUnlockDate(badgeId) {
  const achievement = unlockedAchievements.value.find(a => a.achievement_type === badgeId)
  if (achievement) {
    return new Date(achievement.unlocked_at).toLocaleDateString()
  }
  return ''
}

// Load unlocked achievements
async function loadAchievements() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', user.id)

    if (!error && data) {
      unlockedAchievements.value = data
    }
  } catch (err) {
    console.error('Error loading achievements:', err)
  }
}

// Check and unlock new achievements
async function checkAndUnlockAchievements() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    for (const badge of allBadges) {
      // Skip if already unlocked
      if (isBadgeUnlocked(badge.id)) continue

      // Check if condition is met
      if (badge.condition()) {
        // Unlock the achievement
        const { error } = await supabase.from('achievements').insert({
          user_id: user.id,
          achievement_type: badge.id
        })

        if (!error) {
          // Show unlock notification
          newUnlock.value = badge
          setTimeout(() => { newUnlock.value = null }, 5000)

          // Refresh achievements list
          await loadAchievements()
        }
      }
    }
  } catch (err) {
    console.error('Error checking achievements:', err)
  }
}

onMounted(async () => {
  await loadAchievements()
  await checkAndUnlockAchievements()
})
</script>

<style scoped>
.achievements-container {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.achievements-title {
  margin: 0 0 1.25rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

/* Streaks */
.streaks-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.streak-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  color: white;
}

.streak-number {
  font-size: 2rem;
  font-weight: bold;
}

.streak-label {
  font-size: 0.75rem;
  opacity: 0.9;
  text-align: center;
}

/* Badges */
.badges-section h4 {
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  color: #6c757d;
}

.badges-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.badge-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 0.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
  transition: all 0.2s ease;
}

.badge-item.unlocked {
  background: linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%);
  border: 1px solid #f1c40f;
}

.badge-item.locked {
  opacity: 0.5;
  filter: grayscale(1);
}

.badge-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #e9ecef;
  border-radius: 50%;
  font-size: 1rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.badge-item.unlocked .badge-icon {
  background: #f1c40f;
  color: white;
}

.badge-name {
  font-size: 0.7rem;
  font-weight: 600;
  color: #2c3e50;
}

.badge-desc {
  font-size: 0.6rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

.badge-date {
  font-size: 0.55rem;
  color: #27ae60;
  margin-top: 0.25rem;
}

/* Unlock notification */
.unlock-notification {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #f1c40f 0%, #f39c12 100%);
  color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(241, 196, 15, 0.4);
  animation: slideUp 0.3s ease-out;
  z-index: 1000;
}

.unlock-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  font-size: 1.25rem;
}

.unlock-text {
  display: flex;
  flex-direction: column;
}

.unlock-text strong {
  font-size: 0.875rem;
}

.unlock-text span {
  font-size: 0.75rem;
  opacity: 0.9;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* Mobile responsive */
@media (max-width: 480px) {
  .badges-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .streak-number {
    font-size: 1.5rem;
  }
}
</style>
