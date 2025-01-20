/*
  # Add profile fields

  1. Changes
    - Add phone and address fields to profiles table
    - Add NOT NULL constraints with default values for backward compatibility
  
  2. Security
    - Maintain existing RLS policies
*/

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '';