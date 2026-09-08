/**
 * Shared price-formatting + price-range helpers.
 * Sale, Rent, Home, SearchResults, PropertyDetails and AreaDetails all
 * import from here so currency/EGP formatting and range behavior stay in sync.
 */

export function formatPrice(value, currency = "EGP", options = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return options.fallback ?? "غير محدد";
  }
  const formatted = new Intl.NumberFormat("en-US").format(number);
  const suffix = options.monthly ? " / شهريًا" : options.yearly ? " / سنويًا" : "";
  return `${formatted} ${currency}${suffix}`;
}

export const PRICE_RANGES = [
  { value: "حتى مليون جنيه", min: "", max: "1000000" },
  { value: "1 – 2 مليون جنيه", min: "1000000", max: "2000000" },
  { value: "أكتر من 2 مليون جنيه", min: "2000000", max: "" },
];

export function getPriceRange(value) {
  const match = PRICE_RANGES.find((range) => range.value === value);
  return match ?? { min: "", max: "" };
}
