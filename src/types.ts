export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  short_description: string;
  images: { image_url: string }[];
  tags?: Tag[];
  benefits?: Benefit[];
  ingredients?: Ingredient[];
  reviews?: Review[];
}

export interface CartItem extends Omit<Product, 'images'> {
  quantity: number;
  images: string[];
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  phone: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Benefit {
  id: number;
  title: string;
  description: string;
  icon: string;
}

export interface Ingredient {
  id: number;
  name: string;
  type: 'active' | 'additional';
  description: string;
}

export interface Review {
  id: number;
  product_id: number;
  user_id: string;
  rating: number;
  title: string;
  content: string;
  created_at: string;
  user?: {
    first_name: string;
    last_name: string;
  };
  reactions?: {
    up: number;
    down: number;
    user_reaction?: 'up' | 'down';
  };
}