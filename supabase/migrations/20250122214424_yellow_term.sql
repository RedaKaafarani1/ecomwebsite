/*
  # Update orders table to use SERIAL IDs

  1. Changes
    - Change orders.id from UUID to SERIAL
    - Change order_items.order_id to reference new SERIAL id
    - Preserve existing data by creating new tables and migrating data
    - Drop old tables after successful migration

  2. Security
    - Maintain existing RLS policies
    - Re-enable RLS on new tables
*/

-- Create new tables with SERIAL ids
CREATE TABLE IF NOT EXISTS orders_new (
  id SERIAL PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  total numeric NOT NULL CHECK (total >= 0),
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items_new (
  id SERIAL PRIMARY KEY,
  order_id integer REFERENCES orders_new ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric NOT NULL CHECK (price >= 0),
  created_at timestamptz DEFAULT now()
);

-- Copy existing data if any exists
INSERT INTO orders_new (user_id, total, status, created_at, updated_at)
SELECT user_id, total, status, created_at, updated_at
FROM orders;

-- Create a temporary table to store the UUID to SERIAL id mapping
CREATE TEMPORARY TABLE order_id_mapping AS
SELECT o.id as old_id, n.id as new_id
FROM orders o
JOIN orders_new n ON 
  n.user_id = o.user_id AND 
  n.total = o.total AND 
  n.status = o.status AND 
  n.created_at = o.created_at;

-- Copy order items using the mapping
INSERT INTO order_items_new (order_id, name, quantity, price, created_at)
SELECT 
  (SELECT new_id FROM order_id_mapping WHERE old_id = oi.order_id),
  name,
  quantity,
  price,
  created_at
FROM order_items oi;

-- Drop old tables
DROP TABLE order_items;
DROP TABLE orders;

-- Rename new tables
ALTER TABLE orders_new RENAME TO orders;
ALTER TABLE order_items_new RENAME TO order_items;

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Recreate policies for orders
CREATE POLICY "Users can view their own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Recreate policies for order items
CREATE POLICY "Users can view their order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their order items"
  ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Create updated_at trigger for orders
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();

-- Create indexes
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);