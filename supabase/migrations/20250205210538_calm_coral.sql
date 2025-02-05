/*
  # Add review reactions

  1. New Tables
    - `review_reactions`
      - `id` (uuid, primary key)
      - `review_id` (integer, references reviews)
      - `user_id` (uuid, references auth.users)
      - `reaction_type` (text, either 'up' or 'down')
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `review_reactions` table
    - Add policies for authenticated users to:
      - View all reactions
      - Create/update their own reactions
      - Delete their own reactions

  3. Constraints
    - Unique constraint on review_id and user_id to prevent multiple reactions
    - Check constraint on reaction_type
*/

-- Create review reactions table
CREATE TABLE IF NOT EXISTS review_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Enable RLS
ALTER TABLE review_reactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read review reactions"
  ON review_reactions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own reactions"
  ON review_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions"
  ON review_reactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON review_reactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS review_reactions_review_id_idx ON review_reactions(review_id);
CREATE INDEX IF NOT EXISTS review_reactions_user_id_idx ON review_reactions(user_id);
CREATE INDEX IF NOT EXISTS review_reactions_type_idx ON review_reactions(reaction_type);