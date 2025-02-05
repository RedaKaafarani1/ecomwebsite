/*
  # Product Attributes Schema

  1. New Tables
    - `tags`
      - `id` (serial, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)
    
    - `benefits`
      - `id` (serial, primary key) 
      - `title` (text)
      - `description` (text)
      - `icon` (text) - Lucide icon name
      - `created_at` (timestamp)

    - `ingredients`
      - `id` (serial, primary key)
      - `name` (text, unique)
      - `type` (text) - 'active' or 'additional'
      - `description` (text)
      - `created_at` (timestamp)

    - Junction Tables
      - `product_tags`
      - `product_benefits`
      - `product_ingredients`

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create benefits table
CREATE TABLE IF NOT EXISTS benefits (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('active', 'additional')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create junction tables
CREATE TABLE IF NOT EXISTS product_tags (
  product_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (product_id, tag_id),
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_benefits (
  product_id INTEGER NOT NULL,
  benefit_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (product_id, benefit_id),
  FOREIGN KEY (benefit_id) REFERENCES benefits(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_ingredients (
  product_id INTEGER NOT NULL,
  ingredient_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (product_id, ingredient_id),
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_ingredients ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access to tags"
  ON tags
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to benefits"
  ON benefits
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to ingredients"
  ON ingredients
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to product_tags"
  ON product_tags
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to product_benefits"
  ON product_benefits
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow read access to product_ingredients"
  ON product_ingredients
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS product_tags_product_id_idx ON product_tags(product_id);
CREATE INDEX IF NOT EXISTS product_tags_tag_id_idx ON product_tags(tag_id);
CREATE INDEX IF NOT EXISTS product_benefits_product_id_idx ON product_benefits(product_id);
CREATE INDEX IF NOT EXISTS product_benefits_benefit_id_idx ON product_benefits(benefit_id);
CREATE INDEX IF NOT EXISTS product_ingredients_product_id_idx ON product_ingredients(product_id);
CREATE INDEX IF NOT EXISTS product_ingredients_ingredient_id_idx ON product_ingredients(ingredient_id);

-- Insert initial data
INSERT INTO tags (name) VALUES
  ('Natural'),
  ('Vegan'),
  ('Cruelty-Free'),
  ('Organic'),
  ('Eco-Friendly'),
  ('Sustainable')
ON CONFLICT (name) DO NOTHING;

INSERT INTO benefits (title, description, icon) VALUES
  ('Natural Wellness', 'Experience the power of nature with our carefully selected ingredients that promote overall wellness and vitality.', 'Leaf'),
  ('Premium Quality', 'Each product is crafted to the highest standards, ensuring maximum effectiveness and satisfaction.', 'Star'),
  ('Eco-Friendly', 'Our products are made with sustainable practices and environmentally conscious materials.', 'TreePine'),
  ('Pure Ingredients', 'We use only the purest, highest quality ingredients in all our products.', 'Droplets'),
  ('Scientifically Proven', 'Our formulas are backed by scientific research and testing.', 'Flask')
ON CONFLICT DO NOTHING;

INSERT INTO ingredients (name, type, description) VALUES
  ('Organic Aloe Vera', 'active', 'Natural moisturizer and skin soother'),
  ('Natural Vitamin E', 'active', 'Powerful antioxidant for skin health'),
  ('Essential Oils Blend', 'active', 'Therapeutic aromatherapy benefits'),
  ('Purified Water', 'additional', 'Base ingredient for optimal absorption'),
  ('Natural Preservatives', 'additional', 'For product stability and safety'),
  ('Plant-based Emulsifiers', 'additional', 'For smooth texture and consistency')
ON CONFLICT (name) DO NOTHING;

-- Add sample product relationships
INSERT INTO product_tags (product_id, tag_id)
SELECT 1, id FROM tags WHERE name IN ('Natural', 'Vegan', 'Cruelty-Free')
ON CONFLICT DO NOTHING;

INSERT INTO product_benefits (product_id, benefit_id)
SELECT 1, id FROM benefits WHERE title IN ('Natural Wellness', 'Premium Quality')
ON CONFLICT DO NOTHING;

INSERT INTO product_ingredients (product_id, ingredient_id)
SELECT 1, id FROM ingredients WHERE name IN ('Organic Aloe Vera', 'Natural Vitamin E', 'Essential Oils Blend')
ON CONFLICT DO NOTHING;