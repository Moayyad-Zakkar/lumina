import { useState } from 'react';
import { FeatherX } from '@subframe/core';

const AdminCreateUserDialog = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    clinic: '',
    phone: '',
    email: '',
    address: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const generatePassword = () => {
    const length = 12;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData({ ...formData, password });
    setShowPassword(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.full_name || !formData.email || !formData.clinic) {
        throw new Error('Please fill in all required fields');
      }

      if (!formData.password || formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Call the onSubmit prop (this will handle user creation)
      await onSubmit(formData);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFormData({
          full_name: '',
          clinic: '',
          phone: '',
          email: '',
          address: '',
          password: '',
        });
        setShowPassword(false);
        onClose();
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Create New User Account
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FeatherX className="w-6 h-6" />
          </button>
        </div>

        {success ? (
          <div className="p-6">
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    User account created successfully!
                  </h3>
                  <p className="mt-2 text-sm text-green-700">
                    The user can now sign in with the email and password you
                    provided.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {error}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="full_name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-600 focus:border-transparent"
                placeholder="Dr. John Doe"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-600 focus:border-transparent"
                placeholder="john.doe@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-600 focus:border-transparent"
                    placeholder="Enter password (min 6 characters)"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200 text-sm whitespace-nowrap"
                >
                  Generate
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Make sure to save this password and share it securely with the
                user.
              </p>
            </div>

            <div>
              <label
                htmlFor="clinic"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Clinic Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="clinic"
                name="clinic"
                required
                value={formData.clinic}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-600 focus:border-transparent"
                placeholder="City Medical Center"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-600 focus:border-transparent"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Clinic Address
              </label>
              <textarea
                id="address"
                name="address"
                rows="2"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sky-600 focus:border-transparent"
                placeholder="123 Main Street, Suite 100, City, State 12345"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 font-medium disabled:bg-sky-400"
              >
                {loading ? 'Creating Account...' : 'Create User Account'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCreateUserDialog;
