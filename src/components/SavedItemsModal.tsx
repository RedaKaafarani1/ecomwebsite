import React from 'react';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useSavedProducts } from '../context/SavedProductsContext';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

interface SavedItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SavedItemsModal({ isOpen, onClose }: SavedItemsModalProps) {
  const { savedProducts, removeFromSaved } = useSavedProducts();
  const { addToCart } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mt-20 mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-vitanic-pale-olive">
          <div className="flex items-center gap-2">
            <Heart className="text-vitanic-olive" size={24} />
            <h2 className="text-xl font-semibold text-vitanic-dark-olive">
              Saved Items ({savedProducts.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-vitanic-dark-olive/60 hover:text-vitanic-dark-olive transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {savedProducts.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="mx-auto text-vitanic-olive/20 mb-4" size={48} />
              <p className="text-vitanic-dark-olive/60">
                No items saved yet. Browse our products and save your favorites!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {savedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex gap-4 p-4 bg-white rounded-lg border border-vitanic-pale-olive"
                >
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-24 h-24 object-cover rounded-md"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (product.images[1]) {
                        img.src = product.images[1];
                      }
                    }}
                  />
                  <div className="flex-1">
                    <Link
                      to={`/product/${product.id}`}
                      onClick={onClose}
                      className="font-semibold text-vitanic-dark-olive hover:text-vitanic-olive transition-colors"
                    >
                      {product.name}
                    </Link>
                    <p className="text-vitanic-dark-olive/60 text-sm mt-1">
                      {product.shortDescription}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-vitanic-olive">
                        ${product.price}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            addToCart(product);
                            removeFromSaved(product.id);
                          }}
                          className="flex items-center gap-1 px-3 py-1 bg-vitanic-olive text-white rounded-md hover:bg-vitanic-dark-olive transition-colors text-sm"
                        >
                          <ShoppingBag size={16} />
                          Add to Cart
                        </button>
                        <button
                          onClick={() => removeFromSaved(product.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          aria-label="Remove from saved items"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}