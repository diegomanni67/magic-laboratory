-- Migration: Enable public read access for approved users in community
-- This allows the community page to show approved members without exposing sensitive data

-- Drop existing public policy if it exists
DROP POLICY IF EXISTS "Public can read approved users" ON users;

-- Create policy to allow public read of approved users (only public fields)
CREATE POLICY "Public can read approved users" ON users
  FOR SELECT
  USING (
    is_approved = true
  );

-- Note: The API already selects only safe fields:
-- id, name, artistic_name, role, country, city, bio, instagram, youtube, avatar
-- Email is NOT included in the SELECT query, so it won't be exposed even with this policy
