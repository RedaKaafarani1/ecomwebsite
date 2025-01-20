import React, { useState, useEffect } from 'react';
import { X, Check, ShoppingBag, AlertCircle, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isValidEmail, isValidPassword, isValidName, getPasswordStrength } from '../utils/validation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [signInSuccess, setSignInSuccess] = useState(false);
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; feedback: string }>({
    score: 0,
    feedback: ''
  });

  const { signIn, signUp, error, setError, resetPassword } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setTimeout(() => setIsVisible(false), 200);
      setRegistrationSuccess(false);
      setSignInSuccess(false);
      setResetPasswordSuccess(false);
      setIsForgotPassword(false);
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (isSignUp) {
      if (!isValidName(firstName)) {
        errors.firstName = 'Please enter a valid first name';
      }
      if (!isValidName(lastName)) {
        errors.lastName = 'Please enter a valid last name';
      }
    }

    if (!isValidEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!isForgotPassword && isSignUp && !isValidPassword(password)) {
      errors.password = 'Password must be at least 8 characters with uppercase, lowercase, and numbers';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (isSignUp) {
      setPasswordStrength(getPasswordStrength(newPassword));
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await resetPassword(email.trim());
      setResetPasswordSuccess(true);
    } catch (error) {
      console.error('Failed to reset password:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSignUp) {
        const { success } = await signUp(email.trim(), password, firstName.trim(), lastName.trim());
        if (success) {
          setRegistrationSuccess(true);
        }
      } else {
        await signIn(email.trim(), password);
        setSignInSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
      setRegistrationSuccess(false);
      setSignInSuccess(false);
      setResetPasswordSuccess(false);
      setIsForgotPassword(false);
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setValidationErrors({});
      setPasswordStrength({ score: 0, feedback: '' });
    }, 200);
  };

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp);
    setIsForgotPassword(false);
    setValidationErrors({});
    setPasswordStrength({ score: 0, feedback: '' });
    if (error) {
      setError(null);
    }
  };

  if (!isVisible && !isOpen) return null;

  if (resetPasswordSuccess) {
    return (
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div 
          className={`absolute inset-0 bg-black transition-opacity duration-200 ${
            isOpen ? 'bg-opacity-50' : 'bg-opacity-0'
          }`}
          onClick={handleClose}
        />
        
        <div 
          className={`bg-white rounded-lg p-8 max-w-md w-full relative shadow-xl transform transition-all duration-200 ${
            isOpen 
              ? 'translate-y-0 opacity-100' 
              : 'translate-y-4 opacity-0'
          }`}
        >
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-vitanic-pale-olive mb-4">
              <Mail className="h-6 w-6 text-vitanic-olive" />
            </div>
            <h2 className="text-2xl font-bold text-vitanic-dark-olive mb-4">Check Your Email</h2>
            <p className="text-vitanic-dark-olive/80 mb-6">
              We've sent password reset instructions to {email}. Please check your email to continue.
            </p>
            <button
              onClick={handleClose}
              className="w-full px-6 py-3 bg-vitanic-olive text-white rounded-md hover:bg-vitanic-dark-olive transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (registrationSuccess) {
    return (
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div 
          className={`absolute inset-0 bg-black transition-opacity duration-200 ${
            isOpen ? 'bg-opacity-50' : 'bg-opacity-0'
          }`}
          onClick={handleClose}
        />
        
        <div 
          className={`bg-white rounded-lg p-8 max-w-md w-full relative shadow-xl transform transition-all duration-200 ${
            isOpen 
              ? 'translate-y-0 opacity-100' 
              : 'translate-y-4 opacity-0'
          }`}
        >
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-vitanic-pale-olive mb-4">
              <Check className="h-6 w-6 text-vitanic-olive" />
            </div>
            <h2 className="text-2xl font-bold text-vitanic-dark-olive mb-4">Welcome to Wellness Haven!</h2>
            <p className="text-vitanic-dark-olive/80 mb-6">
              Your account has been created successfully. We've sent you a welcome email with more information.
            </p>
            <button
              onClick={handleClose}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-vitanic-olive text-white rounded-md hover:bg-vitanic-dark-olive transition-colors"
            >
              <ShoppingBag size={20} />
              Start Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (signInSuccess) {
    return (
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div 
          className={`absolute inset-0 bg-black transition-opacity duration-200 ${
            isOpen ? 'bg-opacity-50' : 'bg-opacity-0'
          }`}
          onClick={handleClose}
        />
        
        <div 
          className={`bg-white rounded-lg p-8 max-w-md w-full relative shadow-xl transform transition-all duration-200 ${
            isOpen 
              ? 'translate-y-0 opacity-100' 
              : 'translate-y-4 opacity-0'
          }`}
        >
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-vitanic-pale-olive mb-4">
              <Check className="h-6 w-6 text-vitanic-olive" />
            </div>
            <h2 className="text-2xl font-bold text-vitanic-dark-olive mb-4">Welcome Back!</h2>
            <p className="text-vitanic-dark-olive/80">
              You have successfully signed in.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-200 ${
          isOpen ? 'bg-opacity-50' : 'bg-opacity-0'
        }`}
        onClick={handleClose}
      />
      
      <div 
        className={`bg-white rounded-lg p-8 max-w-md w-full relative shadow-xl transform transition-all duration-200 ${
          isOpen 
            ? 'translate-y-0 opacity-100' 
            : 'translate-y-4 opacity-0'
        }`}
      >
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-vitanic-dark-olive/60 hover:text-vitanic-dark-olive transition-colors"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-2xl font-bold text-vitanic-dark-olive mb-6">
          {isForgotPassword 
            ? 'Reset Password'
            : isSignUp 
              ? 'Create Account' 
              : 'Sign In'
          }
        </h2>
        
        <form onSubmit={isForgotPassword ? handleResetPassword : handleSubmit} className="space-y-4">
          {isSignUp && !isForgotPassword && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-vitanic-dark-olive mb-1">
                  First Name <span className="text-vitanic-olive">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-vitanic-olive focus:border-vitanic-olive transition-colors ${
                    validationErrors.firstName ? 'border-red-500' : 'border-vitanic-pale-olive'
                  }`}
                  required
                  maxLength={50}
                  disabled={isSubmitting}
                />
                {validationErrors.firstName && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {validationErrors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-vitanic-dark-olive mb-1">
                  Last Name <span className="text-vitanic-olive">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-vitanic-olive focus:border-vitanic-olive transition-colors ${
                    validationErrors.lastName ? 'border-red-500' : 'border-vitanic-pale-olive'
                  }`}
                  required
                  maxLength={50}
                  disabled={isSubmitting}
                />
                {validationErrors.lastName && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {validationErrors.lastName}
                  </p>
                )}
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-vitanic-dark-olive mb-1">
              Email <span className="text-vitanic-olive">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-2 border rounded-md focus:ring-vitanic-olive focus:border-vitanic-olive transition-colors ${
                validationErrors.email ? 'border-red-500' : 'border-vitanic-pale-olive'
              }`}
              required
              disabled={isSubmitting}
            />
            {validationErrors.email && (
              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle size={14} />
                {validationErrors.email}
              </p>
            )}
          </div>
          
          {!isForgotPassword && (
            <div>
              <label className="block text-sm font-medium text-vitanic-dark-olive mb-1">
                Password <span className="text-vitanic-olive">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                className={`w-full px-4 py-2 border rounded-md focus:ring-vitanic-olive focus:border-vitanic-olive transition-colors ${
                  validationErrors.password ? 'border-red-500' : 'border-vitanic-pale-olive'
                }`}
                required
                disabled={isSubmitting}
                minLength={isSignUp ? 8 : undefined}
              />
              {isSignUp && passwordStrength.score > 0 && (
                <div className="mt-2">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        passwordStrength.score <= 2
                          ? 'bg-red-500'
                          : passwordStrength.score <= 3
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                    />
                  </div>
                  <p className={`mt-1 text-sm ${
                    passwordStrength.score <= 2
                      ? 'text-red-500'
                      : passwordStrength.score <= 3
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`}>
                    {passwordStrength.feedback}
                  </p>
                </div>
              )}
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {validationErrors.password}
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full px-4 py-2 bg-vitanic-olive text-white rounded-md transition-all duration-200 ${
              isSubmitting 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-vitanic-dark-olive hover:shadow-md active:transform active:scale-[0.98]'
            }`}
          >
            {isSubmitting 
              ? (isForgotPassword 
                  ? 'Sending Reset Link...'
                  : isSignUp 
                    ? 'Creating Account...' 
                    : 'Signing In...'
                ) 
              : (isForgotPassword
                  ? 'Send Reset Link'
                  : isSignUp 
                    ? 'Sign Up' 
                    : 'Sign In'
                )
            }
          </button>
        </form>

        <div className="mt-4 text-center space-y-2">
          {!isForgotPassword && (
            <button
              onClick={handleToggleMode}
              className="text-vitanic-olive hover:text-vitanic-dark-olive text-sm transition-colors"
              disabled={isSubmitting}
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          )}
          
          {!isSignUp && !isForgotPassword && (
            <div>
              <button
                onClick={() => {
                  setIsForgotPassword(true);
                  setError(null);
                }}
                className="text-vitanic-olive hover:text-vitanic-dark-olive text-sm transition-colors"
                disabled={isSubmitting}
              >
                Forgot your password?
              </button>
            </div>
          )}

          {isForgotPassword && (
            <button
              onClick={() => {
                setIsForgotPassword(false);
                setError(null);
              }}
              className="text-vitanic-olive hover:text-vitanic-dark-olive text-sm transition-colors"
              disabled={isSubmitting}
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}