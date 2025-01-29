import { Link } from "react-router-dom";
import { Product } from "../types";
import { ImageCarousel } from "./ImageCarousel";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="bg-vitanic-pale-olive rounded-lg overflow-hidden shadow-md transition-transform hover:scale-[1.02]">
      <ImageCarousel
        images={product.images.map((img) => img.image_url)}
        alt={product.name}
        className="w-full h-64"
      />
      <div className="p-6">
        <h3 className="text-xl font-semibold text-vitanic-dark-olive mb-2">
          {product.name}
        </h3>
        <p className="text-vitanic-dark-olive/80 mb-4">
          {product.short_description}
        </p>
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-vitanic-olive">
            ${product.price}
          </span>
          <Link
            to={`/product/${product.id}`}
            className="px-4 py-2 bg-vitanic-olive text-white rounded-md hover:bg-vitanic-dark-olive transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
