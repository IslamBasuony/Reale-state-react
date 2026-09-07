import { normalizeProperty, normalizeListings } from "../api/normalize.js";
import { formatPrice } from "../utils/formatPrice.js";

describe("normalizeProperty currency & price_period defaults", () => {
  it("defaults currency to EGP when missing from API response", () => {
    const raw = { id: 1, title: "شقة", price: 500000, purpose: "sale", type: "apartment" };
    const normalized = normalizeProperty(raw);
    expect(normalized.currency).toBe("EGP");
  });

  it("preserves explicit currency when present", () => {
    const raw = { id: 2, title: "شقة", price: 500000, currency: "USD", purpose: "sale", type: "apartment" };
    const normalized = normalizeProperty(raw);
    expect(normalized.currency).toBe("USD");
  });

  it("returns null price_period when missing from API response", () => {
    const raw = { id: 3, title: "شقة", price: 500000, purpose: "sale", type: "apartment" };
    const normalized = normalizeProperty(raw);
    expect(normalized.price_period).toBeNull();
  });

  it("accepts valid price_period values: sale, monthly, yearly", () => {
    for (const pp of ["sale", "monthly", "yearly"]) {
      const raw = { id: 10, title: "test", price: 100, purpose: "sale", type: "apartment", price_period: pp };
      expect(normalizeProperty(raw).price_period).toBe(pp);
    }
  });

  it("returns null for invalid price_period values", () => {
    const raw = { id: 11, title: "test", price: 100, purpose: "sale", type: "apartment", price_period: "weekly" };
    expect(normalizeProperty(raw).price_period).toBeNull();
  });

  it("normalizes null/undefined source gracefully", () => {
    const normalized = normalizeProperty(null);
    expect(normalized.currency).toBe("EGP");
    expect(normalized.price_period).toBeNull();
    expect(normalized.id).toBeNull();
  });
});

describe("normalizeListings bulk normalization", () => {
  it("preserves all properties through normalization", () => {
    const raw = [
      { id: 1, title: "sale1", price: 100, purpose: "sale", type: "apartment" },
      { id: 2, title: "rent1", price: 200, purpose: "rent", type: "studio" },
      { id: 3, title: "sale2", price: 300, purpose: "sale", type: "villa" },
    ];
    const normalized = normalizeListings(raw);
    expect(normalized).toHaveLength(3);
    expect(normalized.map((p) => p.id)).toEqual([1, 2, 3]);
  });

  it("handles empty input", () => {
    expect(normalizeListings([])).toEqual([]);
    expect(normalizeListings(null)).toEqual([]);
  });
});

describe("formatPrice currency handling", () => {
  it("formats price with default EGP currency", () => {
    expect(formatPrice(1500000)).toBe("1,500,000 EGP");
  });

  it("formats price with custom currency", () => {
    expect(formatPrice(100000, "USD")).toBe("100,000 USD");
  });

  it("returns fallback text for non-numeric string input", () => {
    expect(formatPrice("abc")).toBe("غير محدد");
  });

  it("formats falsy numeric inputs (Number(null) === 0)", () => {
    expect(formatPrice(null)).toBe("0 EGP");
    expect(formatPrice(undefined)).toBe("غير محدد");
  });

  it("formats monthly rental with suffix", () => {
    expect(formatPrice(8000, "EGP", { monthly: true })).toBe("8,000 EGP / شهريًا");
  });

  it("formats yearly rental with suffix", () => {
    expect(formatPrice(96000, "EGP", { yearly: true })).toBe("96,000 EGP / سنويًا");
  });
});

describe("purpose filtering in normalized data", () => {
  const listings = normalizeListings([
    { id: 1, title: "للبيع", purpose: "sale", type: "apartment", status: "available", price: 1000 },
    { id: 2, title: "للإيجار", purpose: "rent", type: "studio", status: "rented", price: 8000 },
    { id: 3, title: "للبيع 2", purpose: "sale", type: "villa", status: "sold", price: 500000 },
    { id: 4, title: "للإيجار 2", purpose: "rent", type: "duplex", status: "pending", price: 12000 },
    { id: 5, title: "للبيع 3", purpose: "sale", type: "penthouse", status: "available", price: 2000000 },
  ]);

  it("sale filter keeps only sale properties", () => {
    const saleOnly = listings.filter((p) => p.purpose === "sale");
    expect(saleOnly).toHaveLength(3);
    expect(saleOnly.every((p) => p.purpose === "sale")).toBe(true);
  });

  it("rent filter keeps only rent properties", () => {
    const rentOnly = listings.filter((p) => p.purpose === "rent");
    expect(rentOnly).toHaveLength(2);
    expect(rentOnly.every((p) => p.purpose === "rent")).toBe(true);
  });

  it("all statuses are preserved through normalization", () => {
    const statuses = new Set(listings.map((p) => p.status));
    expect(statuses).toEqual(new Set(["متاح", "مُستأجر", "مباع", "قيد الانتظار"]));
  });
});
