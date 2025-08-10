export function capitalizeFirst(input) {
  if (typeof input !== 'string') return input;
  if (input.length === 0) return input;
  return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
}

export function capitalizeFirstSafe(input) {
  const value = input ?? '';
  return capitalizeFirst(value);
}
