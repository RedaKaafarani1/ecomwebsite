import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Heart, Share2, Check, Info, Star, Truck, ShieldCheck, Leaf, TreePine, Droplets, FlaskRound as Flask } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useSavedProducts } from '../context/SavedProductsContext';
import { ImageCarousel } from '../components/ImageCarousel';
import { SharePopup } from '../components/SharePopup';
import { ReviewSection } from '../components/ReviewSection';

type Tab = 'description' | 'benefits' | 'ingredients' | 'reviews' | 'shipping';

const iconMap: Record<string, React.ElementType> = {
  Leaf,
  Star,
  TreePine,
  Droplets,
  Flask
};

export function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToSaved, removeFromSaved, isProductSaved } = useSavedProducts();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>('description');
  const [showSaveMessage, setShowSaveMessage] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const averageRating = product?.reviews?.length 
    ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length 
    : 0;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const fetchProduct = async () => {
    if (!id) return;

    try {
      const { data: productData, error: productError } = await supabase
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
        `)
        .eq('id', id)
        .single();

      if (productError) throw productError;

      // Fetch reviews separately to handle the profiles relationship correctly
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          id,
          product_id,
          user_id,
          rating,
          title,
          content,
          created_at,
          profiles!reviews_user_id_profile_fkey (
            first_name,
            last_name
          )
        `)
        .eq('product_id', id)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      if (productData) {
        // Transform the nested data structure
        const transformedProduct = {
          ...productData,
          tags: productData.product_tags?.map(pt => pt.tags) || [],
          benefits: productData.product_benefits?.map(pb => pb.benefits) || [],
          ingredients: productData.product_ingredients?.map(pi => pi.ingredients) || [],
          images: productData.images?.map(img => img.image_url) || [],
          reviews: reviewsData?.map(review => ({
            ...review,
            user: review.profiles
          })) || []
        };
        setProduct(transformedProduct);

        // Fetch related products
        const { data: relatedData, error: relatedError } = await supabase
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
            )
          `)
          .neq('id', id)
          .limit(4);

        if (relatedError) throw relatedError;

        if (relatedData) {
          const transformedRelated = relatedData.map(product => ({
            ...product,
            tags: product.product_tags?.map(pt => pt.tags) || [],
            images: product.images?.map(img => img.image_url) || []
          }));
          setRelatedProducts(transformedRelated);
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p className="text-vitanic-dark-olive/60">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12 text-vitanic-dark-olive/80">
        Product not found
      </div>
    );
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
  };

  const handleToggleSave = () => {
    const isSaved = isProductSaved(product.id);
    if (isSaved) {
      removeFromSaved(product.id);
    } else {
      addToSaved(product);
    }
    
    setShowSaveMessage(true);
    setTimeout(() => setShowSaveMessage(false), 2000);
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'description':
        return (
          <div className="prose prose-olive max-w-none">
            <p className="text-vitanic-dark-olive/80 leading-relaxed">
              {product.description}
            </p>
            <ul className="mt-6 space-y-2">
              {product.tags?.map(tag => (
                <li key={tag.id} className="flex items-center gap-2">
                  <Check size={20} className="text-vitanic-olive" />
                  <span>{tag.name}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      case 'benefits':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {product.benefits?.map(benefit => {
              const IconComponent = iconMap[benefit.icon] || Leaf;
              return (
                <div key={benefit.id} className="bg-vitanic-pale-olive/50 p-6 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <IconComponent className="text-vitanic-olive" size={20} />
                    {benefit.title}
                  </h4>
                  <p className="text-vitanic-dark-olive/80">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        );
      case 'ingredients':
        return (
          <div className="space-y-6">
            <p className="text-vitanic-dark-olive/80">
              Our products are made with the finest natural ingredients, carefully
              selected for their purity and effectiveness:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-vitanic-pale-olive rounded-lg p-4">
                <h4 className="font-semibold mb-2">Active Ingredients</h4>
                <ul className="space-y-2 text-vitanic-dark-olive/80">
                  {product.ingredients
                    ?.filter(ing => ing.type === 'active')
                    .map(ingredient => (
                      <li key={ingredient.id} className="group relative">
                        • {ingredient.name}
                        {ingredient.description && (
                          <div className="absolute left-0 top-full mt-2 p-2 bg-white rounded-md shadow-lg border border-vitanic-pale-olive hidden group-hover:block z-10 w-48">
                            {ingredient.description}
                          </div>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
              <div className="border border-vitanic-pale-olive rounded-lg p-4">
                <h4 className="font-semibold mb-2">Additional Ingredients</h4>
                <ul className="space-y-2 text-vitanic-dark-olive/80">
                  {product.ingredients
                    ?.filter(ing => ing.type === 'additional')
                    .map(ingredient => (
                      <li key={ingredient.id} className="group relative">
                        • {ingredient.name}
                        {ingredient.description && (
                          <div className="absolute left-0 top-full mt-2 p-2 bg-white rounded-md shadow-lg border border-vitanic-pale-olive hidden group-hover:block z-10 w-48">
                            {ingredient.description}
                          </div>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        );
      case 'reviews':
        return (
          <ReviewSection
            productId={product.id}
            reviews={product.reviews || []}
            onReviewAdded={() => {
              // Refetch product data to update reviews
              fetchProduct();
            }}
          />
        );
      case 'shipping':
        return (
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 bg-vitanic-pale-olive/50 rounded-lg">
              <Truck className="text-vitanic-olive" size={24} />
              <div>
                <h4 className="font-semibold mb-1">Free Shipping</h4>
                <p className="text-vitanic-dark-olive/80">
                  Free shipping on orders over $50. Standard delivery within 3-5 business days.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-vitanic-pale-olive/50 rounded-lg">
              <ShieldCheck className="text-vitanic-olive" size={24} />
              <div>
                <h4 className="font-semibold mb-1">Satisfaction Guaranteed</h4>
                <p className="text-vitanic-dark-olive/80">
                  We stand behind our products with a 30-day satisfaction guarantee.
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-vitanic-dark-olive hover:text-vitanic-olive transition-colors mb-8"
      >
        <ArrowLeft size={20} />
        Back
      </button>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
          <div className="space-y-6">
            <ImageCarousel
              images={product.images}
              alt={product.name}
              className="w-full aspect-square rounded-lg overflow-hidden"
            />
            <div className="flex justify-center gap-4">
              {product.tags?.map(tag => (
                <div
                  key={tag.id}
                  className="px-4 py-2 bg-vitanic-pale-olive rounded-full text-sm text-vitanic-dark-olive"
                >
                  {tag.name}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-vitanic-dark-olive mb-2">
                {product.name}
              </h1>
              <p className="text-vitanic-dark-olive/80 text-lg mb-4">
                {product.short_description}
              </p>
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-vitanic-olive">
                  ${product.price}
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-yellow-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        size={20} 
                        fill={star <= Math.round(averageRating) ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  <span className="text-vitanic-dark-olive/60 text-sm ml-2">
                    ({product.reviews?.length || 0} reviews)
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-b border-vitanic-pale-olive py-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center border border-vitanic-pale-olive rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 text-vitanic-dark-olive hover:bg-vitanic-pale-olive transition-colors"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 border-l border-r border-vitanic-pale-olive">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2 text-vitanic-dark-olive hover:bg-vitanic-pale-olive transition-colors"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-vitanic-olive text-white rounded-lg hover:bg-vitanic-dark-olive transition-colors"
                >
                  <ShoppingBag size={20} />
                  Add to Cart
                </button>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleToggleSave}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                    isProductSaved(product.id)
                      ? 'bg-vitanic-olive text-white border-vitanic-olive hover:bg-vitanic-dark-olive hover:border-vitanic-dark-olive'
                      : 'border-vitanic-pale-olive text-vitanic-dark-olive hover:bg-vitanic-pale-olive'
                  }`}
                >
                  <Heart
                    size={20}
                    fill={isProductSaved(product.id) ? 'currentColor' : 'none'}
                  />
                  {isProductSaved(product.id) ? 'Saved' : 'Save'}
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 border border-vitanic-pale-olive rounded-lg text-vitanic-dark-olive hover:bg-vitanic-pale-olive transition-colors"
                >
                  <Share2 size={20} />
                  Share
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <Info size={20} className="text-vitanic-olive" />
              <p className="text-vitanic-dark-olive/80">
                Free shipping on orders over $50
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-vitanic-pale-olive">
          <div className="p-8">
            <div className="flex flex-wrap gap-4 mb-8">
              {(['description', 'benefits', 'ingredients', 'reviews', 'shipping'] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-full transition-colors ${
                    activeTab === tab
                      ? 'bg-vitanic-olive text-white'
                      : 'text-vitanic-dark-olive hover:bg-vitanic-pale-olive'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Related Products */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-vitanic-dark-olive mb-8">
          You May Also Like
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {relatedProducts.map((relatedProduct) => (
            <div
              key={relatedProduct.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <Link
                to={`/product/${relatedProduct.id}`}
                className="block"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <img
                  src={relatedProduct.images[0]}
                  alt={relatedProduct.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (relatedProduct.images[1]) {
                      img.src = relatedProduct.images[1];
                    }
                  }}
                />
                <div className="p-4">
                  <h3 className="font-semibold text-vitanic-dark-olive mb-2">
                    {relatedProduct.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-vitanic-olive font-bold">
                      ${relatedProduct.price}
                    </span>
                    <span className="text-vitanic-dark-olive hover:text-vitanic-olive transition-colors">
                      View Details
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      <SharePopup
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        url={window.location.href}
      />

      {showSaveMessage && (
        <div className="fixed bottom-4 right-4 bg-vitanic-olive text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <Check size={20} />
          <span>
            {isProductSaved(product.id)
              ? 'Product saved successfully!'
              : 'Product removed from saved items'}
          </span>
        </div>
      )}
    </main>
  );
}