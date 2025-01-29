import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { products } from "../data/products";
import { useCart } from "../context/CartContext";
import { ImageCarousel } from "../components/ImageCarousel";

export function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const product = products.find((p) => p.id === Number(id));

  if (!product) {
    return (
      <div className="text-center py-12 text-vitanic-dark-olive/80">
        Product not found
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart({
      ...product,
      images: product.images.map((url) => ({ image_url: url })),
    });
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

      <div className="bg-vitanic-pale-olive rounded-lg shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <ImageCarousel
            images={product.images}
            alt={product.name}
            className="w-full h-96"
          />
          <div className="p-8">
            <h1 className="text-3xl font-bold text-vitanic-dark-olive mb-4">
              {product.name}
            </h1>
            <p className="text-vitanic-dark-olive/80 mb-6 leading-relaxed">
              {product.description}
            </p>
            <div className="flex items-center justify-between mb-8">
              <span className="text-3xl font-bold text-vitanic-olive">
                ${product.price}
              </span>
              <button
                onClick={handleAddToCart}
                className="flex items-center gap-2 px-6 py-3 bg-vitanic-olive text-white rounded-md hover:bg-vitanic-dark-olive transition-colors"
              >
                <ShoppingBag size={20} />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
