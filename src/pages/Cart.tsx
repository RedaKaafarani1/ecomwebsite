import React, { useState, useEffect } from "react";
import { CartItem as CartItemComponent } from "../components/CartItem";
import { CustomerInfo } from "../types";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { Check, Home, Tag } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { supabase } from '../lib/supabase';
import { validateCustomerInfo, sanitizeText } from '../utils/validation';

export function Cart() {
  const { items, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [orderDetails, setOrderDetails] = useState<string>('');
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<number | null>(null);
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);
  const [isRemovingPromo, setIsRemovingPromo] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    phone: "",
  });

  useEffect(() => {
    async function fetchUserProfile() {
      if (user) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('first_name, last_name, email, phone, address')
            .eq('id', user.id)
            .single();

          if (error) throw error;

          if (profile) {
            setCustomerInfo({
              firstName: profile.first_name || '',
              lastName: profile.last_name || '',
              email: profile.email || '',
              phone: profile.phone || '',
              address: profile.address || '',
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    }

    fetchUserProfile();
  }, [user]);

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const discount = appliedDiscount ? (subtotal * appliedDiscount) / 100 : 0;
  const total = subtotal - discount;

  const handleRemovePromo = async () => {
    setIsRemovingPromo(true);
    setPromoError(null);

    try {
      const { data: promo, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('name', promoCode)
        .single();
      
      if (error) throw error;

      const { error: updateError } = await supabase
        .from('promotions')
        .update({ count: promo.count + 1 })
        .eq('id', promo.id);

      if (updateError) throw updateError;

      setAppliedDiscount(null);
      setPromoError(null);
      setPromoCode('');
      
    } catch (error) {
      console.error('Error removing promo code:', error);
      setPromoError('Failed to remove promotion code');
    } finally {
      setIsRemovingPromo(false);
    }
  };
  
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promotion code');
      return;
    }

    setIsCheckingPromo(true);
    setPromoError(null);

    try {
      const { data: promos, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('name', promoCode);

      if (error) throw error;

      if (!promos || promos.length === 0) {
        setPromoError('Invalid promotion code');
        return;
      }

      const promo = promos[0];

      if (promo.count <= 0) {
        setPromoError('This promotion code has expired');
        return;
      }

      const { error: updateError } = await supabase
        .from('promotions')
        .update({ count: promo.count - 1 })
        .eq('id', promo.id);

      if (updateError) throw updateError;

      setAppliedDiscount(promo.value);
      setPromoError(null);
    } catch (error) {
      console.error('Error applying promo code:', error);
      setPromoError('Failed to apply promotion code');
    } finally {
      setIsCheckingPromo(false);
    }
  };

  const formatOrderDetails = (customerInfo: CustomerInfo) => {
    const itemsList = items.map(item => 
      `- ${item.name} (Quantity: ${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');

    return `
Order Details:
-------------
${itemsList}

Subtotal: $${subtotal.toFixed(2)}
${appliedDiscount ? `Discount (${appliedDiscount}%): -$${discount.toFixed(2)}` : ''}
Total: $${total.toFixed(2)}

Customer Information:
-------------------
Name: ${customerInfo.firstName} ${customerInfo.lastName}
Email: ${customerInfo.email}
Address: ${customerInfo.address}
Phone: ${customerInfo.phone}
    `;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setOrderStatus('idle');

    // Validate customer information
    const { isValid, errors } = validateCustomerInfo(customerInfo);
    
    if (!isValid) {
      setValidationErrors(errors);
      setIsSubmitting(false);
      return;
    }

    const sanitizedCustomerInfo = {
      firstName: sanitizeText(customerInfo.firstName),
      lastName: sanitizeText(customerInfo.lastName),
      email: customerInfo.email.trim(),
      address: sanitizeText(customerInfo.address),
      phone: sanitizeText(customerInfo.phone),
    };

    const formattedOrderDetails = formatOrderDetails(sanitizedCustomerInfo);
    setOrderDetails(formattedOrderDetails);

    try {
      const result = await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          to_email: sanitizedCustomerInfo.email,
          order_details: formattedOrderDetails,
          customer_name: sanitizedCustomerInfo.firstName,
          customer_email: sanitizedCustomerInfo.email,
          copy_email: import.meta.env.VITE_COPY_EMAIL
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

      if (result.status === 200) {
        setOrderStatus('success');
        items.forEach(item => removeFromCart(item.id));
        setCustomerInfo({ firstName: '', lastName: '', email: '', address: '', phone: '' });
      } else {
        setOrderStatus('error');
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      setOrderStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderStatus === 'success') {
    return (
      <main className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-vitanic-pale-olive mb-4">
              <Check className="h-6 w-6 text-vitanic-olive" />
            </div>
            <h2 className="text-2xl font-bold text-vitanic-dark-olive mb-4">Order Placed Successfully!</h2>
            <p className="text-vitanic-dark-olive/80 mb-2">Thank you for your order.</p>
            <p className="text-vitanic-dark-olive/80">A confirmation email has been sent to {customerInfo.email}</p>
          </div>

          <div className="border-t border-b border-vitanic-pale-olive py-6 mb-8">
            <pre className="whitespace-pre-wrap text-sm text-vitanic-dark-olive/80 font-mono bg-vitanic-pale-olive/30 p-4 rounded">
              {orderDetails}
            </pre>
          </div>

          <div className="text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-vitanic-olive text-white rounded-md hover:bg-vitanic-dark-olive transition-colors"
            >
              <Home size={20} />
              Back to Homepage
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl text-center font-bold text-vitanic-dark-olive mb-8">Your Cart</h1>

      {items.length === 0 ? (
        <div className="text-center">
          <p className="text-vitanic-dark-olive/80 mb-6">Your cart is empty</p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-vitanic-olive text-white rounded-md hover:bg-vitanic-dark-olive transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          <div className="col-span-3 bg-white rounded-lg shadow p-8 lg:p-12">
            <h2 className="text-xl font-semibold text-vitanic-dark-olive mb-6">Cart Items</h2>
            <div className="space-y-4">
              {items.map((item) => (
                <CartItemComponent
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeFromCart}
                />
              ))}
              
              <div className="pt-4 border-t border-vitanic-pale-olive space-y-4">
                <div className="flex flex-col space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <div className="relative">
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          placeholder="Enter promotion code"
                          className="w-full px-4 py-2 pl-10 border rounded-md focus:ring-vitanic-olive focus:border-vitanic-olive"
                          disabled={isCheckingPromo || isRemovingPromo || appliedDiscount !== null}
                        />
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-vitanic-olive/60" size={16} />
                      </div>
                    </div>
                    <button
                      onClick={
                        appliedDiscount !== null
                          ? handleRemovePromo
                          : handleApplyPromo}
                      disabled={isCheckingPromo || isRemovingPromo}
                      className={`px-4 py-2 rounded-md transition-colors ${
                        appliedDiscount !== null
                          ? 'bg-red-100 text-red-700'
                          : isCheckingPromo
                          ? 'bg-vitanic-pale-olive text-vitanic-dark-olive/50 cursor-not-allowed'
                          : 'bg-vitanic-pale-olive hover:bg-vitanic-pale-olive/80 text-vitanic-dark-olive'
                      }`}
                    >
                      {isRemovingPromo
                        ? 'Removing...'
                        : isCheckingPromo
                        ? 'Checking...'
                        : appliedDiscount !== null
                        ? 'Remove'
                        : 'Apply'}
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-sm text-red-500">{promoError}</p>
                  )}
                  {appliedDiscount && (
                    <p className="text-sm text-vitanic-olive">
                      {appliedDiscount}% discount applied!
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-vitanic-dark-olive/80">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex justify-between text-vitanic-olive">
                      <span>Discount ({appliedDiscount}%):</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-semibold pt-2 border-t border-vitanic-pale-olive">
                    <span className="text-vitanic-dark-olive">Total:</span>
                    <span className="text-vitanic-olive">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-2 bg-white rounded-lg shadow p-8 lg:p-12">
            <h2 className="text-xl font-semibold text-vitanic-dark-olive mb-6">Customer Information</h2>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-vitanic-dark-olive mb-1">
                    First Name <span className="text-vitanic-olive">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerInfo.firstName}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, firstName: e.target.value })
                    }
                    className={`w-full px-4 py-2 border rounded-md focus:ring-vitanic-olive focus:border-vitanic-olive ${
                      validationErrors.firstName ? 'border-red-500' : 'border-vitanic-pale-olive'
                    }`}
                    required
                  />
                  {validationErrors.firstName && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-vitanic-dark-olive mb-1">
                    Last Name <span className="text-vitanic-olive">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerInfo.lastName}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, lastName: e.target.value })
                    }
                    className={`w-full px-4 py-2 border rounded-md focus:ring-vitanic-olive focus:border-vitanic-olive ${
                      validationErrors.lastName ? 'border-red-500' : 'border-vitanic-pale-olive'
                    }`}
                    required
                  />
                  {validationErrors.lastName && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.lastName}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-vitanic-dark-olive mb-1">
                  Email <span className="text-vitanic-olive">*</span>
                </label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) =>
                    setCustomerInfo({ ...customerInfo, email: e.target.value })
                  }
                  className={`w-full px-4 py-2 border rounded-md focus:ring-vitanic-olive focus:border-vitanic-olive ${
                    validationErrors.email ? 'border-red-500' : 'border-vitanic-pale-olive'
                  }`}
                  required
                />
                {validationErrors.email && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-vitanic-dark-olive mb-1">
                  Address <span className="text-vitanic-olive">*</span>
                </label>
                <textarea
                  value={customerInfo.address}
                  onChange={(e) =>
                    setCustomerInfo({ ...customerInfo, address: e.target.value })
                  }
                  className={`w-full px-4 py-2 border rounded-md focus:ring-vitanic-olive focus:border-vitanic-olive ${
                    validationErrors.address ? 'border-red-500' : 'border-vitanic-pale-olive'
                  }`}
                  rows={3}
                  required
                />
                {validationErrors.address && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.address}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-vitanic-dark-olive mb-1">
                  Phone Number <span className="text-vitanic-olive">*</span>
                </label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) =>
                    setCustomerInfo({ ...customerInfo, phone: e.target.value })
                  }
                  className={`w-full px-4 py-2 border rounded-md focus:ring-vitanic-olive focus:border-vitanic-olive ${
                    validationErrors.phone ? 'border-red-500' : 'border-vitanic-pale-olive'
                  }`}
                  required
                />
                {validationErrors.phone && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.phone}</p>
                )}
              </div>
              {orderStatus === 'error' && (
                <p className="text-red-500 text-sm">
                  Failed to place order. Please try again.
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full px-6 py-3 bg-vitanic-olive text-white rounded-md transition-colors ${
                  isSubmitting 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-vitanic-dark-olive'
                }`}
              >
                {isSubmitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}