-- Add foreign key constraints for product_id in junction tables
ALTER TABLE product_tags
ADD CONSTRAINT product_tags_product_id_fkey
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE product_benefits
ADD CONSTRAINT product_benefits_product_id_fkey
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE product_ingredients
ADD CONSTRAINT product_ingredients_product_id_fkey
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;