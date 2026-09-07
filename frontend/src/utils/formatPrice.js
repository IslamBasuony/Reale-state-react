export function formatPrice(value, currency = "EGP", options = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return options.fallback ?? "غير محدد";
  }
  const formatted = new Intl.NumberFormat("en-US").format(number);
  const suffix = options.monthly ? " / شهريًا" : options.yearly ? " / سنويًا" : "";
  return `${formatted} ${currency}${suffix}`;
}

export function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

export function purposeLabel(purpose) {
  if (purpose === "rent") {
    return "للإيجار";
  }
  return "للبيع";
}
