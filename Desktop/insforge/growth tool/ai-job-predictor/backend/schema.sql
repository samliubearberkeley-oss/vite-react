-- Schema for AI Job Replacement Predictor Analytics (Optional)
-- This table tracks job predictions for analytics purposes

-- 🚨 IRON RULE: NEVER store images in database!
-- 🚨 铁律：严禁把图片传到数据库！
-- ✅ Images MUST go to Storage buckets only
-- ✅ Database can ONLY store text, URLs, and metadata
-- ❌ NEVER store base64, binary data, or image content in DB

CREATE TABLE IF NOT EXISTS job_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_title TEXT NOT NULL,
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  category TEXT NOT NULL,
  reasoning TEXT,
  timeframe TEXT,
  timeframe_months_min INTEGER,
  timeframe_months_max INTEGER,
  ai_model TEXT DEFAULT 'openai/gpt-4o',
  meme_url TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_job_predictions_created_at ON job_predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_predictions_category ON job_predictions(category);
CREATE INDEX IF NOT EXISTS idx_job_predictions_job_title ON job_predictions(LOWER(job_title));

-- Enable Row Level Security (optional - currently open for anonymous inserts)
ALTER TABLE job_predictions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert predictions
CREATE POLICY "Anyone can insert predictions"
  ON job_predictions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Anyone can read aggregate stats
CREATE POLICY "Anyone can read predictions"
  ON job_predictions
  FOR SELECT
  TO anon
  USING (true);

