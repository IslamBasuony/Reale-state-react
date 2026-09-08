import { formatPrice, PRICE_RANGES, getPriceRange } from "../utils/priceRange.js";

describe("priceRange.formatPrice", () => {
  it("formats price with default EGP currency", () => {
    expect(formatPrice(1500000)).toBe("1,500,000 EGP");
  });

  it("formats price with custom currency", () => {
    expect(formatPrice(100000, "USD")).toBe("100,000 USD");
  });

  it("returns fallback for non-numeric price", () => {
    expect(formatPrice("abc")).toBe("غير محدد");
  });

  it("appends monthly suffix", () => {
    expect(formatPrice(8000, "EGP", { monthly: true })).toBe("8,000 EGP / شهريًا");
  });

  it("appends yearly suffix", () => {
    expect(formatPrice(96000, "EGP", { yearly: true })).toBe("96,000 EGP / سنويًا");
  });

  it("supports a custom fallback for missing values", () => {
    expect(formatPrice(undefined, "EGP", { fallback: "" })).toBe("");
  });
});

describe("priceRange.PRICE_RANGES", () => {
  it("exposes the three documented ranges", () => {
    expect(PRICE_RANGES).toHaveLength(3);
    expect(PRICE_RANGES.map((r) => r.value)).toEqual([
      "حتى مليون جنيه",
      "1 – 2 مليون جنيه",
      "أكتر من 2 مليون جنيه",
    ]);
  });
});

describe("priceRange.getPriceRange", () => {
  it("maps each range label to its min/max bounds", () => {
    expect(getPriceRange("حتى مليون جنيه")).toEqual({ value: "حتى مليون جنيه", min: "", max: "1000000" });
    expect(getPriceRange("1 – 2 مليون جنيه")).toEqual({ value: "1 – 2 مليون جنيه", min: "1000000", max: "2000000" });
    expect(getPriceRange("أكتر من 2 مليون جنيه")).toEqual({ value: "أكتر من 2 مليون جنيه", min: "2000000", max: "" });
  });

  it("falls back to unbounded range for unknown labels", () => {
    expect(getPriceRange("unknown")).toEqual({ min: "", max: "" });
    expect(getPriceRange("")).toEqual({ min: "", max: "" });
  });
});
