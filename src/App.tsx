import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Mail, MessageCircle, User } from 'lucide-react';
import { Home } from './pages/Home';
import { ProductDetails } from './pages/ProductDetails';
import { Cart } from './pages/Cart';
import { Profile } from './pages/Profile';
import { ResetPassword } from './pages/ResetPassword';
import { CartProvider, useCart } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import ecomLogo from './ecomLogo.svg';

function Header() {
  const { totalItems } = useCart();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setIsUserMenuOpen(false);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setIsUserMenuOpen(false);
  };
  
  return (
    <header className="bg-vitanic-pale-olive shadow-sm relative">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
          <div className="w-full sm:w-auto flex justify-center">
            <Link 
              to="/" 
              className="relative transform -mb-8 sm:-mb-12 z-10 transition-transform duration-200"
            >
              <img 
                src={ecomLogo} 
                alt="Company Logo" 
                className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full bg-white p-2 shadow-lg hover:scale-105 transition-all duration-200"
              />
            </Link>
          </div>
          
          <div className="flex items-center gap-6 mt-8 sm:mt-0">
            <Link
              to="/cart"
              className="flex items-center gap-2 text-vitanic-dark-olive hover:text-vitanic-olive p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <div className="relative">
                <ShoppingBag size={24} />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-vitanic-olive text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </div>
            </Link>
            
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 text-vitanic-dark-olive hover:text-vitanic-olive p-2 hover:bg-white/50 rounded-full transition-colors"
                >
                  <User size={24} />
                  <span className="text-sm hidden sm:inline">{user.email}</span>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <button
                      onClick={handleProfileClick}
                      className="block w-full px-4 py-2 text-left text-sm text-vitanic-dark-olive hover:bg-vitanic-pale-olive"
                    >
                      My Profile
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="block w-full px-4 py-2 text-left text-sm text-vitanic-dark-olive hover:bg-vitanic-pale-olive border-t"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-2 text-vitanic-dark-olive hover:text-vitanic-olive p-2 hover:bg-white/50 rounded-full transition-colors"
              >
                <User size={24} />
                <span className="text-sm hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-vitanic-pale-olive border-t border-vitanic-olive/20 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center space-y-6">
          <h3 className="text-2xl font-semibold text-vitanic-dark-olive">Contact Us</h3>
          <p className="text-vitanic-dark-olive/80 text-center max-w-md">
            Have questions? We're here to help! Reach out to us through any of the following channels:
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <a
              href="https://wa.me/33645790579"
              className="flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-vitanic-dark-olive hover:text-vitanic-olive"
            >
              <MessageCircle size={24} />
              <span className="font-medium">+330645790579</span>
            </a>
            <a
              href="mailto:contact@wellnesshaven.com"
              className="flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-vitanic-dark-olive hover:text-vitanic-olive"
            >
              <Mail size={24} />
              <span className="font-medium">contact@wellnesshaven.com</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-leaves flex flex-col">
            <Header />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Routes>
            <Footer />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}