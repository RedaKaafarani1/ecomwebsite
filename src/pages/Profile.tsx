import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { isValidPhone, isValidName, validateCustomerInfo } from '../utils/validation';
import { User, Save, AlertCircle } from 'lucide-react';
import { PasswordResetForm } from '../components/PasswordResetForm';

export function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setProfile({
            firstName: data.first_name || '',
            lastName: data.last_name || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const validation = validateCustomerInfo(profile);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setSaving(true);
    setSuccessMessage('');
    setErrors({});

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.firstName,
          last_name: profile.lastName,
          phone: profile.phone,
          address: profile.address,
        })
        .eq('id', user.id);

      if (error) throw error;

      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ submit: 'Failed to update profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p className="text-vitanic-dark-olive/60">Loading profile...</p>
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-vitanic-pale-olive rounded-full">
              <User className="w-8 h-8 text-vitanic-dark-olive" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-vitanic-dark-olive">My Profile</h1>
              <p className="text-vitanic-dark-olive/60">Manage your personal information</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-vitanic-dark-olive mb-1">
                  First Name <span className="text-vitanic-olive">*</span>
                </label>
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-vitanic-olive focus:border-vitanic-olive transition-colors ${
                    errors.firstName ? 'border-red-500' : 'border-vitanic-pale-olive'
                  }`}
                  required
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-vitanic-dark-olive mb-1">
                  Last Name <span className="text-vitanic-olive">*</span>
                </label>
                <input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-vitanic-olive focus:border-vitanic-olive transition-colors ${
                    errors.lastName ? 'border-red-500' : 'border-vitanic-pale-olive'
                  }`}
                  required
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-vitanic-dark-olive mb-1">
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-2 border rounded-md bg-gray-50 text-gray-500 border-vitanic-pale-olive"
              />
              <p className="mt-1 text-sm text-vitanic-dark-olive/60">
                Email cannot be changed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-vitanic-dark-olive mb-1">
                Phone Number <span className="text-vitanic-olive">*</span>
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className={`w-full px-4 py-2 border rounded-md focus:ring-vitanic-olive focus:border-vitanic-olive transition-colors ${
                  errors.phone ? 'border-red-500' : 'border-vitanic-pale-olive'
                }`}
                required
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.phone}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-vitanic-dark-olive mb-1">
                Address <span className="text-vitanic-olive">*</span>
              </label>
              <textarea
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className={`w-full px-4 py-2 border rounded-md focus:ring-vitanic-olive focus:border-vitanic-olive transition-colors ${
                  errors.address ? 'border-red-500' : 'border-vitanic-pale-olive'
                }`}
                rows={3}
                required
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.address}
                </p>
              )}
            </div>

            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-600">{successMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 bg-vitanic-olive text-white rounded-md transition-all duration-200 ${
                saving 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-vitanic-dark-olive hover:shadow-md active:transform active:scale-[0.98]'
              }`}
            >
              <Save size={20} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        <PasswordResetForm />
      </div>
    </main>
  );
}