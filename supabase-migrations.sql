-- =====================================================
-- Daily Drink Tracker - Subscription & Payment Schema
-- Run this in Supabase SQL Editor
-- =====================================================

-- Table 1: Subscriptions
-- Manages user tiers (free/premium), PayPal integration, and billing periods
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tier Management
  tier VARCHAR(20) DEFAULT 'free' CHECK (tier IN ('free', 'premium')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),

  -- PayPal Integration (nullable for free users)
  paypal_subscription_id VARCHAR(255),
  paypal_payer_id VARCHAR(255),

  -- Billing Dates
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,

  -- Audit
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  -- Extensibility for future payment providers (Stripe)
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paypal_id ON subscriptions(paypal_subscription_id);

-- RLS Policies for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscription (for free tier creation)
CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscription (for cancellation)
CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can manage all subscriptions (for webhooks)
CREATE POLICY "Service role manages all subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');


-- Table 2: AI Usage Tracking
-- Tracks every AI call for quota enforcement (resets monthly)
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Request Details
  request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('dashboard', 'mindfulness')),

  -- Token Metrics (for cost tracking)
  tokens_input INTEGER,
  tokens_output INTEGER,

  -- Cost Estimation (in USD)
  cost_estimate DECIMAL(10,6),

  -- Timestamp for monthly quota calculation
  created_at TIMESTAMP DEFAULT now()
);

-- Indexes for ai_usage (optimized for monthly quota queries)
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_created ON ai_usage(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_type ON ai_usage(user_id, request_type);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage(created_at);

-- RLS Policies for ai_usage
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own ai_usage"
  ON ai_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert usage (called from Netlify functions)
CREATE POLICY "Service role inserts ai_usage"
  ON ai_usage FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Service role can view all (for analytics)
CREATE POLICY "Service role views all ai_usage"
  ON ai_usage FOR SELECT
  USING (auth.role() = 'service_role');


-- Table 3: Payments (Audit Trail)
-- Stores transaction history for accounting and debugging
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Transaction Details
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),

  -- Provider Information
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('paypal', 'stripe')),
  provider_transaction_id VARCHAR(255),

  -- Type Classification
  payment_type VARCHAR(50) DEFAULT 'subscription' CHECK (payment_type IN ('subscription', 'one_time')),

  -- Audit
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  -- Extensibility
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_user_created ON payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_provider_status ON payments(provider, status);
CREATE INDEX IF NOT EXISTS idx_payments_provider_tx_id ON payments(provider_transaction_id);

-- RLS Policies for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all payments (for webhooks)
CREATE POLICY "Service role manages all payments"
  ON payments FOR ALL
  USING (auth.role() = 'service_role');


-- =====================================================
-- Helper Functions
-- =====================================================

-- Function: Get user's current month AI usage count
CREATE OR REPLACE FUNCTION get_current_month_ai_usage(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  usage_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO usage_count
  FROM ai_usage
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('month', CURRENT_DATE)
    AND created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';

  RETURN COALESCE(usage_count, 0);
END;
$$;

-- Function: Get user's tier and quota info
CREATE OR REPLACE FUNCTION get_user_quota_info(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_tier VARCHAR(20);
  quota_limit INTEGER;
  usage_count INTEGER;
  remaining INTEGER;
  result JSON;
BEGIN
  -- Get user's current tier (default to 'free' if no subscription)
  SELECT COALESCE(tier, 'free')
  INTO user_tier
  FROM subscriptions
  WHERE user_id = p_user_id;

  -- If no subscription record exists, assume free tier
  IF user_tier IS NULL THEN
    user_tier := 'free';
  END IF;

  -- Set quota limit based on tier
  quota_limit := CASE
    WHEN user_tier = 'premium' THEN 100
    ELSE 10
  END;

  -- Get usage count for current month
  usage_count := get_current_month_ai_usage(p_user_id);

  -- Calculate remaining
  remaining := GREATEST(quota_limit - usage_count, 0);

  -- Build result JSON
  result := json_build_object(
    'tier', user_tier,
    'quota_limit', quota_limit,
    'usage_count', usage_count,
    'remaining', remaining,
    'reset_date', date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
  );

  RETURN result;
END;
$$;

-- =====================================================
-- Auto-create free tier subscription for new users
-- =====================================================
CREATE OR REPLACE FUNCTION create_free_subscription_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO subscriptions (user_id, tier, status, current_period_start, current_period_end)
  VALUES (
    NEW.id,
    'free',
    'active',
    now(),
    now() + INTERVAL '1 year' -- Free tier doesn't expire
  );
  RETURN NEW;
END;
$$;

-- Trigger: Auto-create subscription on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_free_subscription_for_new_user();


-- =====================================================
-- Data Migration for Existing Users
-- =====================================================

-- Create free subscriptions for existing users who don't have one
INSERT INTO subscriptions (user_id, tier, status, current_period_start, current_period_end)
SELECT
  u.id,
  'free',
  'active',
  now(),
  now() + INTERVAL '1 year'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions s WHERE s.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;


-- =====================================================
-- Verification Queries (run after migration)
-- =====================================================

-- Check all tables were created
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('subscriptions', 'ai_usage', 'payments');

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('subscriptions', 'ai_usage', 'payments');

-- Check all users have subscriptions
-- SELECT COUNT(*) FROM auth.users;
-- SELECT COUNT(*) FROM subscriptions;

-- Test quota function
-- SELECT get_user_quota_info(auth.uid());
