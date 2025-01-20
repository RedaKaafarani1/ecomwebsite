import React, { useEffect, useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../types';
import { supabase } from '../lib/supabase';
import { Search } from 'lucide-react';
import { sanitizeSearchQuery } from '../utils/validation';

export function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Handle search input with sanitization
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawQuery = e.target.value;
    const sanitizedQuery = sanitizeSearchQuery(rawQuery);
    setSearchQuery(sanitizedQuery);
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setIsSearching(true);
        
        let query = supabase
          .from('products')
          .select(`
            *,
            images (
              image_url
            )
          `);

        if (debouncedQuery) {
          // Use sanitized query for search
          query = query.or(`name.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%,short_description.ilike.%${debouncedQuery}%`);
        }

        const { data: productsData, error: productsError } = await query;

        if (productsError) {
          throw productsError;
        }

        setProducts(productsData || []);
      } catch (err) {
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    }

    fetchProducts();
  }, [debouncedQuery]);

  if (error) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-vitanic-olive">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-vitanic-olive to-vitanic-dark-olive bg-clip-text text-transparent">
          Discover Your Path to Wellness
        </h2>
        <p className="text-vitanic-dark-olive/80 max-w-2xl mx-auto mb-8 text-lg">
          Explore our carefully curated collection of wellness products designed to
          nurture your mind, body, and spirit.
        </p>
        
        <div className="relative max-w-md mx-auto">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInput}
              placeholder="Search products..."
              maxLength={100}
              className="w-full px-4 py-3 pl-12 rounded-full border border-vitanic-olive/20 focus:ring-2 focus:ring-vitanic-olive focus:border-vitanic-olive transition-colors bg-white/80 backdrop-blur-sm"
              aria-label="Search products"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-vitanic-olive/60" size={20} />
          </div>
        </div>
      </div>

      {loading || isSearching ? (
        <div className="text-center">
          <p className="text-vitanic-dark-olive/60">Loading products...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.length === 0 ? (
            <p className="col-span-3 text-center text-vitanic-dark-olive/80">
              {searchQuery ? 'No products found matching your search.' : 'No products available.'}
            </p>
          ) : (
            products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={{
                  ...product,
                  images: product.images?.map(img => img.image_url) || []
                }} 
              />
            ))
          )}
        </div>
      )}
    </main>
  );
}