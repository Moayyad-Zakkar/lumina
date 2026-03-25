import React from 'react';
import { useTranslation } from 'react-i18next';
import { FeatherCheck } from '@subframe/core';

const MaterialSelectionCards = ({
  materials,
  materialPrices,
  caseStudyFee,
  deliveryCharges,
  selectedMaterial,
  onSelect,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  if (!materials || materials.length === 0) return null;

  // Pick the middle card as "recommended" if there are 3 options
  const recommendedIndex = materials.length === 3 ? 1 : -1;

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-body-bold font-body-bold text-default-font">
          {t('casePage.materialSelection.title')}
        </span>
        <span className="text-body font-body text-subtext-color">
          {t('casePage.materialSelection.subtitle')}
        </span>
      </div>

      <div
        className={`grid gap-4 ${
          materials.length === 1
            ? 'grid-cols-1 max-w-sm'
            : materials.length === 2
              ? 'grid-cols-1 sm:grid-cols-2'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {materials.map((mat, index) => {
          const materialPrice = parseFloat(materialPrices?.[mat.name] || 0);
          const totalCost =
            parseFloat(caseStudyFee || 0) +
            materialPrice +
            parseFloat(deliveryCharges || 0);
          const isSelected = selectedMaterial === mat.name;
          const isRecommended = index === recommendedIndex;
          const description = isRTL ? mat.description_ar : mat.description_en;

          return (
            <button
              key={mat.id}
              type="button"
              onClick={() => onSelect(mat.name)}
              className={`
                relative flex flex-col gap-4 rounded-xl border-2 p-5 text-left
                transition-all duration-200 cursor-pointer outline-none
                ${
                  isSelected
                    ? 'border-brand-600 bg-brand-50 shadow-md ring-2 ring-brand-200'
                    : isRecommended
                      ? 'border-brand-300 bg-white shadow-sm hover:border-brand-400 hover:shadow-md'
                      : 'border-neutral-border bg-white shadow-sm hover:border-neutral-400 hover:shadow-md'
                }
              `}
            >
              {/* Recommended badge */}
              {isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-brand-600 text-white shadow-sm whitespace-nowrap">
                    {t('casePage.materialSelection.recommended')}
                  </span>
                </div>
              )}

              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center shadow-sm">
                  <FeatherCheck className="w-3.5 h-3.5 text-white" />
                </div>
              )}

              {/* Material name */}
              <div className="flex flex-col gap-1 pr-6">
                <span
                  className={`text-heading-3 font-heading-3 ${
                    isSelected ? 'text-brand-700' : 'text-default-font'
                  }`}
                >
                  {mat.name}
                </span>
                {description && (
                  <ul
                    className={`flex flex-col gap-2 ${isRTL ? 'text-right' : 'text-left'}`}
                  >
                    {description
                      .split('•')
                      .filter((item) => item.trim() !== '') // Remove empty strings from the split
                      .map((point, index) => (
                        <li
                          key={index}
                          className="text-caption font-caption text-subtext-color leading-relaxed flex items-start gap-2"
                        >
                          {/* Custom Bullet Point */}
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-subtext-color opacity-60" />

                          <span>{point.trim()}</span>
                        </li>
                      ))}
                  </ul>
                )}
              </div>

              {/* Divider */}
              <div className="h-px w-full bg-neutral-border" />

              {/* Pricing breakdown */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-caption font-caption text-subtext-color">
                    {t('casePage.treatmentPlan.alignersPrice')}
                  </span>
                  <span className="text-body-bold font-body-bold text-default-font">
                    ${materialPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-caption font-caption text-subtext-color">
                    {t('casePage.treatmentPlan.caseStudyFee')}
                  </span>
                  <span className="text-body font-body text-subtext-color">
                    ${parseFloat(caseStudyFee || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-caption font-caption text-subtext-color">
                    {t('casePage.treatmentPlan.deliveryCharges')}
                  </span>
                  <span className="text-body font-body text-subtext-color">
                    ${parseFloat(deliveryCharges || 0).toFixed(2)}
                  </span>
                </div>

                {/* Divider */}
                <div className="h-px w-full bg-neutral-border" />

                {/* Total */}
                <div className="flex items-center justify-between">
                  <span className="text-body-bold font-body-bold text-default-font">
                    {t('casePage.treatmentPlan.totalCost')}
                  </span>
                  <span
                    className={`text-heading-3 font-heading-3 ${
                      isSelected ? 'text-brand-600' : 'text-default-font'
                    }`}
                  >
                    ${totalCost.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Select indicator */}
              <div
                className={`
                  mt-auto flex items-center justify-center rounded-lg py-2 text-body-bold font-body-bold
                  transition-colors duration-150
                  ${
                    isSelected
                      ? 'bg-brand-600 text-white'
                      : 'bg-neutral-100 text-subtext-color group-hover:bg-neutral-200'
                  }
                `}
              >
                {isSelected
                  ? t('casePage.materialSelection.selected')
                  : t('casePage.materialSelection.select')}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MaterialSelectionCards;
