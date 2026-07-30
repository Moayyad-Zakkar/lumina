/** Whether this aligner system is offered for the case (has a saved price). */
export function isMaterialAvailableForCase(materialPrices, materialName) {
  const price = materialPrices?.[materialName];
  if (price == null || price === '') return false;
  const parsed = parseFloat(price);
  return !Number.isNaN(parsed);
}

/** Build material_prices payload for save — only enabled systems with valid prices. */
export function buildMaterialPricesPayload(materialPrices, enabledMaterialNames) {
  const payload = {};
  for (const name of enabledMaterialNames) {
    const price = materialPrices?.[name];
    if (isMaterialAvailableForCase({ [name]: price }, name)) {
      payload[name] = price;
    }
  }
  return payload;
}
