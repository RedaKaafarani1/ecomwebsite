/*
  # Add reviews-profiles relationship

  1. Changes
    - Add foreign key constraint between reviews and profiles tables
    - Update RLS policies to include profile access
    - Add index for performance optimization

  2. Security
    - Maintain existing RLS policies
    - Add policy for profile access in reviews
*/

-- Add foreign key constraint
ALTER TABLE reviews
ADD CONSTRAINT reviews_user_id_profile_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id)
ON DELETE CASCADE;

-- Create index for the foreign key
CREATE INDEX IF NOT EXISTS reviews_user_profile_id_idx ON reviews(user_id);

-- Update RLS policies to include profile access
CREATE POLICY "Users can view review author profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT user_id FROM reviews
    )
  );