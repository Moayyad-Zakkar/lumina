import React from 'react';
import { useTranslation } from 'react-i18next';
import { FeatherGlobe } from '@subframe/core';
import toast from 'react-hot-toast';
import supabase from '../../helper/supabaseClient';

function LanguageSwitcher({ variant = 'dropdown' }) {
  const { i18n, t } = useTranslation();

  const changeLanguage = async (lng) => {
    try {
      // Change language in i18n
      i18n.changeLanguage(lng);
      localStorage.setItem('language', lng);
      document.dir = lng === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lng;

      // Save to database
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ language_preference: lng })
          .eq('id', user.id);

        if (error) {
          console.error('Error saving language preference:', error);
          toast.error('Failed to save language preference');
        } else {
          toast.success(
            lng === 'ar'
              ? 'تم حفظ تفضيل اللغة بنجاح'
              : 'Language preference saved successfully'
          );
        }
      }

      // Reload to apply RTL styles properly
      window.location.reload();
    } catch (error) {
      console.error('Error changing language:', error);
      toast.error('Failed to change language');
    }
  };

  if (variant === 'cards') {
    return (
      <div className="flex w-full flex-col gap-4">
        <div className="flex items-center gap-2">
          <FeatherGlobe className="w-5 h-5 text-subtext-color" />
          <span className="text-heading-3 font-heading-3 text-default-font">
            {t('settings.language')}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => changeLanguage('en')}
            className={`flex flex-col items-start gap-2 rounded-md border p-4 transition-all ${
              i18n.language === 'en'
                ? 'border-brand-600 bg-brand-50'
                : 'border-neutral-border bg-default-background hover:border-neutral-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">🇺🇸</span>
              <span className="text-body-bold font-body-bold text-default-font">
                English
              </span>
            </div>
            {i18n.language === 'en' && (
              <span className="text-caption text-brand-600">
                ✓ Current Language
              </span>
            )}
          </button>

          <button
            onClick={() => changeLanguage('ar')}
            className={`flex flex-col items-start gap-2 rounded-md border p-4 transition-all ${
              i18n.language === 'ar'
                ? 'border-brand-600 bg-brand-50'
                : 'border-neutral-border bg-default-background hover:border-neutral-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">ᴀʀ</span>
              <span className="text-body-bold font-body-bold text-default-font">
                العربية
              </span>
            </div>
            {i18n.language === 'ar' && (
              <span className="text-caption text-brand-600">
                ✓ اللغة الحالية
              </span>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Dropdown variant (for navbar)
  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-neutral-100 transition-colors">
        <FeatherGlobe className="w-5 h-5" />
        <span className="text-body font-body">
          {i18n.language === 'ar' ? 'العربية' : 'English'}
        </span>
      </button>

      <div className="absolute top-full right-0 mt-1 hidden group-hover:block bg-white border border-neutral-border rounded-md shadow-lg z-50 min-w-[150px]">
        <button
          onClick={() => changeLanguage('en')}
          className={`w-full text-left px-4 py-2 hover:bg-neutral-50 flex items-center gap-2 ${
            i18n.language === 'en' ? 'bg-brand-50 text-brand-600' : ''
          }`}
        >
          <span>🇺🇸</span>
          <span>English</span>
        </button>
        <button
          onClick={() => changeLanguage('ar')}
          className={`w-full text-left px-4 py-2 hover:bg-neutral-50 flex items-center gap-2 ${
            i18n.language === 'ar' ? 'bg-brand-50 text-brand-600' : ''
          }`}
        >
          <span>ᴀʀ</span>
          <span>العربية</span>
        </button>
      </div>
    </div>
  );
}

export default LanguageSwitcher;
