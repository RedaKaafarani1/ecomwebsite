import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { isValidPassword, getPasswordStrength } from '../utils/validation';

export function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; feedback: string }>({
    score: 0,
    feedback: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setError('Invalid reset password link. Please request a new one.');
          setTimeout(() => navigate('/'), 3000);
          return;
        }
      } catch (error) {
        setError('Failed to process password reset. Please try again.');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handlePasswordReset();
  }, [navigate]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setNewPassword(password);
    setPasswordStrength(getPasswordStrength(password));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidPassword(newPassword)) {
      setError('Password must be at least 8 characters with uppercase, lowercase, and numbers');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      setSuccess(true);
      
      // Wait a bit before redirecting
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-leaves flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-vitanic-pale-olive mb-4">
              <Lock className="h-6 w-6 text-vitanic-olive" />
            </div>
            <h2 className="text-2xl font-bold text-vitanic-dark-olive mb-4">Password Updated!</h2>
            <p className="text-vitanic-dark-olive/80 mb-4">
              Your password has been successfully updated. You will be redirected to sign in with your new password.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-leaves flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-vitanic-dark-olive mb-4">Error</h2>
            <p className="text-vitanic-dark-olive/80 mb-4">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-leaves flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-vitanic-pale-olive mb-4">
            <Lock className="h-6 w-6 text-vitanic-olive" />
          </div>
          <h2 className="text-2xl font-bold text-vitanic-dark-olive">Reset Your Password</h2>
          <p className="text-vitanic-dark-olive/80 mt-2">
            Please enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-vitanic-dark-olive mb-1">
              New Password <span className="text-vitanic-olive">*</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={handlePasswordChange}
              className="w-full px-4 py-2 border border-vitanic-pale-olive rounded-md focus:ring-vitanic-olive focus:border-vitanic-olive"
              required
              minLength={8}
              disabled={isSubmitting}
            />
            {passwordStrength.score > 0 && (
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
          </div>

          <div>
            <label className="block text-sm font-medium text-vitanic-dark-olive mb-1">
              Confirm Password <span className="text-vitanic-olive">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-vitanic-pale-olive rounded-md focus:ring-vitanic-olive focus:border-vitanic-olive"
              required
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full px-6 py-3 bg-vitanic-olive text-white rounded-md transition-all duration-200 ${
              isSubmitting 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-vitanic-dark-olive hover:shadow-md active:transform active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </main>
  );
}