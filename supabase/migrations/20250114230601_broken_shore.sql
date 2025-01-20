/*
  # Add INSERT policy for profiles table
  
  1. Changes
    - Add policy to allow users to insert their own profile
    - This fixes the 403 error when creating new user profiles
  
  2. Security
    - Policy ensures users can only create profiles with their own user ID
    - Maintains data integrity by linking profiles to auth.users
*/

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);