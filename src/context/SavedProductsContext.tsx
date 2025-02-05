import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { products } from '../data/products';

interface SavedProductsContextType {
  savedProducts: Product[];
  addToSaved: (product: Product) => Promise<void>;
  removeFromSaved: (productId: number) => Promise<void>;
  isProductSaved: (productId: number) => boolean;
  loading: boolean;
}

const SavedProductsContext = createContext<SavedProductsContextType | undefined>(undefined);

export function SavedProductsProvider({ children }: { children: React.ReactNode }) {
  const [savedProducts, setSavedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load saved products when user signs in
  useEffect(() => {
    async function loadSavedProducts() {
      if (!user) {
        setSavedProducts([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('saved_items')
          .select('product_id')
          .eq('user_id', user.id);

        if (error) throw error;

        // Get the full product details for each saved item
        const savedProductIds = data.map(item => item.product_id);
        const savedItems = savedProductIds.map(id => {
          const product = products.find(p => p.id === id);
          return product;
        }).filter((product): product is Product => product !== undefined);

        setSavedProducts(savedItems);
      } catch (error) {
        console.error('Error loading saved products:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSavedProducts();
  }, [user]);

  const addToSaved = async (product: Product) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('saved_items')
        .insert({
          user_id: user.id,
          product_id: product.id
        });

      if (error) throw error;

      setSavedProducts(current => {
        if (!current.some(p => p.id === product.id)) {
          return [...current, product];
        }
        return current;
      });
    } catch (error) {
      console.error('Error adding product to saved items:', error);
    }
  };

  const removeFromSaved = async (productId: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('saved_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;

      setSavedProducts(current => current.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Error removing product from saved items:', error);
    }
  };

  const isProductSaved = (productId: number) => {
    return savedProducts.some(p => p.id === productId);
  };

  return (
    <SavedProductsContext.Provider value={{
      savedProducts,
      addToSaved,
      removeFromSaved,
      isProductSaved,
      loading
    }}>
      {children}
    </SavedProductsContext.Provider>
  );
}

export function useSavedProducts() {
  const context = useContext(SavedProductsContext);
  if (context === undefined) {
    throw new Error('useSavedProducts must be used within a SavedProductsProvider');
  }
  return context;
}