import React, { useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { isValidPassword, getPasswordStrength } from '../utils/validation';
import { useAuth } from '../context/AuthContext';

export function PasswordResetForm() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; feedback: string }>({
    score: 0,
    feedback: ''
  });

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setNewPassword(password);
    setPasswordStrength(getPasswordStrength(password));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!user?.email) {
      setError('User email not found');
      return;
    }

    if (!isValidPassword(newPassword)) {
      setError('New password must be at least 8 characters with uppercase, lowercase, and numbers');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      // First verify the current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStrength({ score: 0, feedback: '' });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-vitanic-pale-olive rounded-full">
          <Lock className="w-8 h-8 text-vitanic-dark-olive" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-vitanic-dark-olive">Change Password</h2>
          <p className="text-vitanic-dark-olive/60">Update your account password</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-vitanic-dark-olive mb-1">
            Current Password <span className="text-vitanic-olive">*</span>
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-2 border border-vitanic-pale-olive rounded-md focus:ring-vitanic-olive focus:border-vitanic-olive"
            required
            disabled={isSubmitting}
          />
        </div>

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
            Confirm New Password <span className="text-vitanic-olive">*</span>
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

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle size={14} />
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">Password updated successfully!</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 bg-vitanic-olive text-white rounded-md transition-all duration-200 ${
            isSubmitting 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-vitanic-dark-olive hover:shadow-md active:transform active:scale-[0.98]'
          }`}
        >
          <Lock size={20} />
          {isSubmitting ? 'Updating Password...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}