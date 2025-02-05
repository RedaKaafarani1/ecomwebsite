/*
  # Add product relationships

  1. Changes
    - Add relationships between products and tags
    - Add relationships between products and benefits
    - Add relationships between products and ingredients
    
  2. Details
    - Each product gets relevant tags (Natural, Vegan, etc.)
    - Each product gets 2-3 benefits
    - Each product gets both active and additional ingredients
*/

-- Add product-tag relationships
INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM products p
CROSS JOIN tags t
WHERE t.name IN ('Natural', 'Vegan', 'Cruelty-Free')
AND p.id IN (1, 2, 3, 4, 5, 6, 7, 8, 9)
ON CONFLICT DO NOTHING;

INSERT INTO product_tags (product_id, tag_id)
SELECT p.id, t.id
FROM products p
CROSS JOIN tags t
WHERE t.name IN ('Organic', 'Eco-Friendly')
AND p.id IN (2, 4, 7, 8)
ON CONFLICT DO NOTHING;

-- Add product-benefit relationships
INSERT INTO product_benefits (product_id, benefit_id)
SELECT p.id, b.id
FROM products p
CROSS JOIN benefits b
WHERE b.title IN ('Natural Wellness', 'Premium Quality')
AND p.id IN (1, 2, 3, 4, 5, 6, 7, 8, 9)
ON CONFLICT DO NOTHING;

INSERT INTO product_benefits (product_id, benefit_id)
SELECT p.id, b.id
FROM products p
CROSS JOIN benefits b
WHERE b.title IN ('Eco-Friendly', 'Pure Ingredients')
AND p.id IN (1, 3, 4, 7)
ON CONFLICT DO NOTHING;

INSERT INTO product_benefits (product_id, benefit_id)
SELECT p.id, b.id
FROM products p
CROSS JOIN benefits b
WHERE b.title = 'Scientifically Proven'
AND p.id IN (2, 5, 6, 8)
ON CONFLICT DO NOTHING;

-- Add product-ingredient relationships
INSERT INTO product_ingredients (product_id, ingredient_id)
SELECT p.id, i.id
FROM products p
CROSS JOIN ingredients i
WHERE i.type = 'active'
AND p.id IN (1, 2, 3, 4, 5, 6, 7, 8, 9)
ON CONFLICT DO NOTHING;

INSERT INTO product_ingredients (product_id, ingredient_id)
SELECT p.id, i.id
FROM products p
CROSS JOIN ingredients i
WHERE i.type = 'additional'
AND p.id IN (1, 2, 3, 4, 5, 6, 7, 8, 9)
ON CONFLICT DO NOTHING;