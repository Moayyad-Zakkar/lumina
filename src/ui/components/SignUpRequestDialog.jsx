import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FeatherX } from '@subframe/core';

const SignUpRequestDialog = ({ isOpen, onClose, onSubmit }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [formData, setFormData] = useState({
    full_name: '',
    clinic: '',
    phone: '',
    email: '',
    address: '',
    language_preference: 'en', // Default to English
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.full_name || !formData.email || !formData.clinic) {
        throw new Error(t('login.signUpDialog.errors.requiredFields'));
      }

      // Call the onSubmit prop (this will handle Supabase insertion)
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
          language_preference: 'en',
        });
        onClose();
      }, 2000);
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
            {t('login.signUpDialog.title')}
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
                    {t('login.signUpDialog.successTitle')}
                  </h3>
                  <p className="mt-2 text-sm text-green-700">
                    {t('login.signUpDialog.successMessage')}
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
                {t('login.signUpDialog.fullName')}{' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                placeholder={t('login.signUpDialog.fullNamePlaceholder')}
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t('login.signUpDialog.email')}{' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                placeholder={t('login.signUpDialog.emailPlaceholder')}
              />
            </div>

            <div>
              <label
                htmlFor="clinic"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t('login.signUpDialog.clinicName')}{' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="clinic"
                name="clinic"
                required
                value={formData.clinic}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                placeholder={t('login.signUpDialog.clinicNamePlaceholder')}
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t('login.signUpDialog.phoneNumber')}
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:border-transparent ${
                  isRTL ? 'text-right' : ''
                } `}
                placeholder={t('login.signUpDialog.phoneNumberPlaceholder')}
                dir="ltr"
              />
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t('login.signUpDialog.clinicAddress')}
              </label>
              <textarea
                id="address"
                name="address"
                rows="2"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                placeholder={t('login.signUpDialog.clinicAddressPlaceholder')}
              />
            </div>

            <div>
              <label
                htmlFor="language_preference"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t('login.signUpDialog.languagePreference')}{' '}
                <span className="text-red-500">*</span>
              </label>
              <select
                id="language_preference"
                name="language_preference"
                required
                value={formData.language_preference}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white"
              >
                <option value="en">{t('settings.english')}</option>
                <option value="ar">{t('settings.arabic')}</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                {t('login.signUpDialog.languageHelp')}
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 font-medium disabled:bg-brand-400"
              >
                {loading
                  ? t('login.signUpDialog.submitting')
                  : t('login.signUpDialog.submitButton')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignUpRequestDialog;
