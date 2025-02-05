import React, { useEffect, useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../types';
import { supabase } from '../lib/supabase';
import { Search, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { sanitizeSearchQuery } from '../utils/validation';
import { useLocation } from 'react-router-dom';

const PRODUCTS_PER_PAGE = 9;

export function Home() {
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [showSignOutMessage, setShowSignOutMessage] = useState(false);

  useEffect(() => {
    if (location.state?.message) {
      setShowSignOutMessage(true);
      setTimeout(() => {
        setShowSignOutMessage(false);
        window.history.replaceState({}, document.title);
      }, 3000);
    }
  }, [location]);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawQuery = e.target.value;
    const sanitizedQuery = sanitizeSearchQuery(rawQuery);
    setSearchQuery(sanitizedQuery);
    setCurrentPage(0);
  };

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
            ),
            product_tags (
              tags (
                id,
                name
              )
            ),
            product_benefits (
              benefits (
                id,
                title,
                description,
                icon
              )
            ),
            product_ingredients (
              ingredients (
                id,
                name,
                type,
                description
              )
            )
          `);

        if (debouncedQuery) {
          query = query.or(
            `name.ilike.%${debouncedQuery}%,` +
            `description.ilike.%${debouncedQuery}%,` +
            `short_description.ilike.%${debouncedQuery}%`
          );
        }

        const { data: productsData, error: productsError } = await query;

        if (productsError) {
          throw productsError;
        }

        if (productsData) {
          const transformedProducts = productsData.map(product => ({
            ...product,
            tags: product.product_tags?.map(pt => pt.tags) || [],
            benefits: product.product_benefits?.map(pb => pb.benefits) || [],
            ingredients: product.product_ingredients?.map(pi => pi.ingredients) || [],
            images: product.images?.map(img => img.image_url) || []
          }));
          setProducts(transformedProducts);
        }
      } catch (err) {
        setError('Failed to load products. Please try again later.');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    }

    fetchProducts();
  }, [debouncedQuery]);

  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
  const currentProducts = products.slice(
    currentPage * PRODUCTS_PER_PAGE,
    (currentPage + 1) * PRODUCTS_PER_PAGE
  );

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 0));
  };

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
      {showSignOutMessage && (
        <div className="fixed top-4 right-4 bg-vitanic-olive text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <Check size={20} />
          <span>You have been signed out successfully</span>
        </div>
      )}

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
              placeholder="Search products (letters and numbers only)"
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentProducts.length === 0 ? (
              <p className="col-span-3 text-center text-vitanic-dark-olive/80">
                {searchQuery ? 'No products found matching your search.' : 'No products available.'}
              </p>
            ) : (
              currentProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product}
                />
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-12 gap-4">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  currentPage === 0
                    ? 'text-vitanic-dark-olive/40 cursor-not-allowed'
                    : 'text-vitanic-dark-olive hover:bg-vitanic-pale-olive'
                }`}
                aria-label="Previous page"
              >
                <ChevronLeft size={20} />
                Previous
              </button>
              
              <div className="flex items-center gap-2">
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      currentPage === index
                        ? 'bg-vitanic-olive text-white'
                        : 'text-vitanic-dark-olive hover:bg-vitanic-pale-olive'
                    }`}
                    aria-label={`Go to page ${index + 1}`}
                    aria-current={currentPage === index ? 'page' : undefined}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages - 1}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  currentPage === totalPages - 1
                    ? 'text-vitanic-dark-olive/40 cursor-not-allowed'
                    : 'text-vitanic-dark-olive hover:bg-vitanic-pale-olive'
                }`}
                aria-label="Next page"
              >
                Next
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}