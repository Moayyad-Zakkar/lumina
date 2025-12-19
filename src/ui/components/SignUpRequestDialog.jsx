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
    language_preference: 'en',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.full_name || !formData.email || !formData.clinic) {
        throw new Error(t('login.signUpDialog.errors.requiredFields'));
      }
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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black bg-opacity-50 p-0 md:p-4">
      {/* Container: Full width on mobile, rounded top only on mobile */}
      <div className="relative w-full max-w-2xl bg-white rounded-t-xl md:rounded-lg shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            {t('login.signUpDialog.title')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <FeatherX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-5 md:p-6 space-y-4">
          {success ? (
            <div className="rounded-md bg-green-50 p-4 text-center">
              <h3 className="text-sm font-medium text-green-800">
                {t('login.signUpDialog.successTitle')}
              </h3>
              <p className="mt-2 text-sm text-green-700">
                {t('login.signUpDialog.successMessage')}
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('login.signUpDialog.fullName')}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600"
                    placeholder={t('login.signUpDialog.fullNamePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('login.signUpDialog.email')}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600"
                    placeholder={t('login.signUpDialog.emailPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('login.signUpDialog.clinicName')}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="clinic"
                    required
                    value={formData.clinic}
                    onChange={handleChange}
                    className="w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600"
                    placeholder={t('login.signUpDialog.clinicNamePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('login.signUpDialog.phoneNumber')}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 ${
                      isRTL ? 'text-right' : ''
                    }`}
                    placeholder={t('login.signUpDialog.phoneNumberPlaceholder')}
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('login.signUpDialog.clinicAddress')}
                  </label>
                  <textarea
                    name="address"
                    rows="2"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600"
                    placeholder={t(
                      'login.signUpDialog.clinicAddressPlaceholder'
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('login.signUpDialog.languagePreference')}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="language_preference"
                    required
                    value={formData.language_preference}
                    onChange={handleChange}
                    className="w-full px-3 py-3 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-600 bg-white"
                  >
                    <option value="en">{t('settings.english')}</option>
                    <option value="ar">{t('settings.arabic')}</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 pt-4 pb-6 md:pb-0">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="order-1 md:order-2 flex-1 px-4 py-3 bg-brand-600 text-white rounded-md hover:bg-brand-700 font-medium disabled:bg-brand-400"
                >
                  {loading
                    ? t('login.signUpDialog.submitting')
                    : t('login.signUpDialog.submitButton')}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="order-2 md:order-1 flex-1 px-4 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignUpRequestDialog;
