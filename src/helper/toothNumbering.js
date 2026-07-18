// Mapping from Universal to FDI numbering (for display only)
export const UNIVERSAL_TO_FDI = {
  // Upper jaw
  1: 18,
  2: 17,
  3: 16,
  4: 15,
  5: 14,
  6: 13,
  7: 12,
  8: 11,
  9: 21,
  10: 22,
  11: 23,
  12: 24,
  13: 25,
  14: 26,
  15: 27,
  16: 28,
  // Lower jaw
  17: 38,
  18: 37,
  19: 36,
  20: 35,
  21: 34,
  22: 33,
  23: 32,
  24: 31,
  25: 41,
  26: 42,
  27: 43,
  28: 44,
  29: 45,
  30: 46,
  31: 47,
  32: 48,
};

/** Convert Universal tooth number (1–32) to FDI for display. */
export function universalToFdi(universalNum) {
  return UNIVERSAL_TO_FDI[universalNum];
}
