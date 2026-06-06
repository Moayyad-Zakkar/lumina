/**
 * Pick localized product description.
 */
export function getStoreProductDescription(product, language) {
  if (!product) return '';
  const isAr = language === 'ar';
  if (isAr) {
    return product.description_ar || product.description_en || '';
  }
  return product.description_en || product.description_ar || '';
}

export const STORE_IMAGES_BUCKET = 'store-images';
