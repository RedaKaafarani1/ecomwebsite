import React from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { CartItem as CartItemType } from '../types';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="flex items-center gap-4 py-4 border-b">
      <img 
        src={item.images[0]} 
        alt={item.name} 
        className="w-24 h-24 object-cover rounded"
        onError={(e) => {
          e.currentTarget.src = item.images[1] || item.images[2];
        }}
      />
      <div className="flex-1">
        <h3 className="font-semibold text-gray-800">{item.name}</h3>
        <p className="text-gray-600">${item.price}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <Minus size={18} />
        </button>
        <span className="w-8 text-center">{item.quantity}</span>
        <button
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <Plus size={18} />
        </button>
      </div>
      <button
        onClick={() => onRemove(item.id)}
        className="p-1 hover:bg-gray-100 rounded text-gray-500"
      >
        <X size={18} />
      </button>
    </div>
  );
}