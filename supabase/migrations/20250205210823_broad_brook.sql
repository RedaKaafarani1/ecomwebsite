/*
  # Update review policies

  1. Changes
    - Update review policies to allow public read access
    - Update review reaction policies to allow public read access
    - Update profile policies to allow public read access for review authors

  2. Security
    - Public can read reviews and reactions
    - Only authenticated users can create/update/delete reviews and reactions
*/

-- Drop existing review policies
DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;
DROP POLICY IF EXISTS "Users can view review author profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can read review reactions" ON review_reactions;

-- Create new public read policies
CREATE POLICY "Anyone can read reviews"
  ON reviews
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can read review reactions"
  ON review_reactions
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can view review author profiles"
  ON profiles
  FOR SELECT
  TO anon
  USING (
    id IN (
      SELECT user_id FROM reviews
    )
  );