-- Migration: Add users table and likes/dislikes columns to dogs table
-- Run this if you already have a dogs table without these features

-- Step 1: Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Populate users table with existing user_ids from dogs
INSERT INTO users (id, created_at)
SELECT DISTINCT user_id, MIN(created_at)
FROM dogs
GROUP BY user_id
ON CONFLICT (id) DO NOTHING;

-- Step 3: Add likes and dislikes columns to dogs
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS dislikes INTEGER DEFAULT 0;

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_dogs_likes ON dogs(likes DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen DESC);

-- Step 5: Update existing rows to have 0 likes/dislikes if they are NULL
UPDATE dogs SET likes = 0 WHERE likes IS NULL;
UPDATE dogs SET dislikes = 0 WHERE dislikes IS NULL;

-- Step 6 (Optional): Add foreign key constraint
-- Uncomment the following line if you want to enforce referential integrity:
-- ALTER TABLE dogs ADD CONSTRAINT fk_dogs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

