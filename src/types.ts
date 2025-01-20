export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  short_description: string;
  images: { image_url: string }[];
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