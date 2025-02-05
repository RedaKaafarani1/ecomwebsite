import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { products } from '../data/products';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => Promise<void>;
  updateQuantity: (id: number, quantity: number) => Promise<void>;
  removeFromCart: (id: number) => Promise<void>;
  totalItems: number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load cart items when user signs in
  useEffect(() => {
    async function loadCartItems() {
      if (!user) {
        setItems([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('cart_items')
          .select('product_id, quantity')
          .eq('user_id', user.id);

        if (error) throw error;

        // Get the full product details for each cart item
        const cartItems = data.map(item => {
          const product = products.find(p => p.id === item.product_id);
          if (!product) return null;
          return { ...product, quantity: item.quantity };
        }).filter((item): item is CartItem => item !== null);

        setItems(cartItems);
      } catch (error) {
        console.error('Error loading cart items:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCartItems();
  }, [user]);

  const addToCart = async (product: Product) => {
    if (!user) {
      setItems(currentItems => {
        const existingItem = currentItems.find(item => item.id === product.id);
        if (existingItem) {
          return currentItems.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [...currentItems, { ...product, quantity: 1 }];
      });
      return;
    }

    try {
      const existingItem = items.find(item => item.id === product.id);

      if (existingItem) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('user_id', user.id)
          .eq('product_id', product.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: product.id,
            quantity: 1
          });

        if (error) throw error;
      }

      setItems(currentItems => {
        const existingItem = currentItems.find(item => item.id === product.id);
        if (existingItem) {
          return currentItems.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [...currentItems, { ...product, quantity: 1 }];
      });
    } catch (error) {
      console.error('Error adding product to cart:', error);
    }
  };

  const updateQuantity = async (id: number, quantity: number) => {
    if (!user) {
      setItems(currentItems =>
        currentItems.map(item =>
          item.id === id ? { ...item, quantity } : item
        ).filter(item => item.quantity > 0)
      );
      return;
    }

    try {
      if (quantity > 0) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('user_id', user.id)
          .eq('product_id', id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);

        if (error) throw error;
      }

      setItems(currentItems =>
        currentItems.map(item =>
          item.id === id ? { ...item, quantity } : item
        ).filter(item => item.quantity > 0)
      );
    } catch (error) {
      console.error('Error updating cart item quantity:', error);
    }
  };

  const removeFromCart = async (id: number) => {
    if (!user) {
      setItems(currentItems => currentItems.filter(item => item.id !== id));
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', id);

      if (error) throw error;

      setItems(currentItems => currentItems.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error removing item from cart:', error);
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      updateQuantity,
      removeFromCart,
      totalItems,
      loading
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}