/*
 * موحِّد بيانات العقارات (Normalizer)
 * --------------------------------
 * يحوّل العقار القادم من أي مصدر (الـ backend أو fallback) إلى شكل موحّد
 * آمن على الواجهة، مع تعويض أي قيم مفقودة/null/empty بقيم افتراضية
 * حتى لا ينهار أي مكوّن عند استقبال بيانات ناقصة.
 */

export const TYPE_LABELS = {
  apartment: "شقة",
  villa: "فيلا",
  duplex: "دوبلكس",
  penthouse: "بنتهاوس",
  studio: "استوديو",
  townhouse: "تاون هاوس",
  office: "مكتب",
  shop: "محل",
  warehouse: "مخزن",
  land: "أرض",
};

export const STATUS_LABELS = {
  available: "متاح",
  sold: "مباع",
  rented: "مُستأجر",
  pending: "قيد الانتظار",
};

export const PURPOSE_VALUES = new Set(["sale", "rent"]);

export const PRICE_PERIOD_VALUES = new Set(["sale", "monthly", "yearly"]);

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const toStringOrNull = (value) =>
  value == null || value === "" ? null : String(value);

const toArray = (value) => (Array.isArray(value) ? value : []);

const getImages = (property) => {
  const images = toArray(property.images)
    .map((image) =>
      typeof image === "string" ? image : toStringOrNull(image?.image_url)
    )
    .filter(Boolean);

  const fallbackImage = toStringOrNull(property.image_url);
  if (images.length === 0 && fallbackImage) {
    images.push(fallbackImage);
  }
  return images;
};

const formatAddedDate = (property) => {
  const raw = property.created_at || property.added_date;
  if (raw == null || raw === "") {
    return null;
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return toStringOrNull(property.added_date);
  }

  return date.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const buildAgent = (agent) => {
  if (!agent || typeof agent !== "object") {
    return null;
  }
  return {
    id: toNumber(agent.id),
    name:
      toStringOrNull(agent.name) ||
      [toStringOrNull(agent.first_name), toStringOrNull(agent.last_name)]
        .filter(Boolean)
        .join(" "),
    first_name: toStringOrNull(agent.first_name),
    last_name: toStringOrNull(agent.last_name),
    phone: toStringOrNull(agent.phone),
    email: toStringOrNull(agent.email),
    bio: toStringOrNull(agent.bio),
    profile_image_url: toStringOrNull(agent.profile_image_url),
  };
};

export const normalizeProperty = (property = {}) => {
  const source =
    property && typeof property === "object" ? property : {};

  const typeRaw = (toStringOrNull(source.type) || "").toLowerCase();
  const statusRaw = (toStringOrNull(source.status) || "").toLowerCase();
  const purposeRaw = (toStringOrNull(source.purpose) || "").toLowerCase();
  const pricePeriodRaw = (toStringOrNull(source.price_period) || "").toLowerCase();

  const area =
    source.location && typeof source.location === "object"
      ? source.location
      : {};

  const contact =
    source.contact && typeof source.contact === "object"
      ? source.contact
      : {};

  const agent = buildAgent(source.agent);
  const images = getImages(source);

  const parkingSpaces = toNumber(source.parking_spaces);
  const areaSize = toNumber(source.area_size);
  const price = toNumber(source.price);

  return {
    id: source.id ?? null,
    title: toStringOrNull(source.title) || "بدون عنوان",
    description: toStringOrNull(source.description),
    type: TYPE_LABELS[typeRaw] || toStringOrNull(source.type) || null,
    type_en: typeRaw || null,
    status: STATUS_LABELS[statusRaw] || toStringOrNull(source.status) || null,
    purpose: PURPOSE_VALUES.has(purposeRaw) ? purposeRaw : null,
    price,
    currency: toStringOrNull(source.currency) || "EGP",
    price_period: PRICE_PERIOD_VALUES.has(pricePeriodRaw)
      ? pricePeriodRaw
      : null,
    area_size: areaSize ?? toStringOrNull(source.area_size),
    bedrooms_number: toNumber(source.bedrooms_number),
    bathrooms_number: toNumber(source.bathrooms_number),
    parking_spaces: parkingSpaces ?? 0,
    garage:
      source.garage ?? (parkingSpaces !== null ? parkingSpaces > 0 : false),
    floor: source.floor ?? toNumber(source.floor_number),
    floor_number: toNumber(source.floor_number),
    total_floors: toNumber(source.total_floors),
    finishing: toStringOrNull(source.finishing),
    added_date: formatAddedDate(source),
    created_at: toStringOrNull(source.created_at),
    address: toStringOrNull(source.address),
    location: {
      name: toStringOrNull(area.name),
      city: toStringOrNull(area.city),
      latitude: toNumber(area.latitude),
      longitude: toNumber(area.longitude),
      description: toStringOrNull(area.description),
    },
    location_text:
      [toStringOrNull(area.name), toStringOrNull(area.city)]
        .filter(Boolean)
        .join("، ") || toStringOrNull(source.address) || "",
    contact: {
      phone: toStringOrNull(contact.phone) ?? toStringOrNull(agent?.phone),
      email: toStringOrNull(contact.email) ?? toStringOrNull(agent?.email),
      Whatsapp: toStringOrNull(contact.Whatsapp),
    },
    agent,
    images,
    image_url: images[0] || null,
    features: toArray(source.features).length
      ? toArray(source.features)
      : toArray(source.amenities)
          .map((amenity) => toStringOrNull(amenity?.name))
          .filter(Boolean),
    amenities: toArray(source.amenities),
    is_featured: Boolean(source.is_featured),
    lang: toStringOrNull(source.lang),
  };
};

export const normalizeListings = (listings) =>
  toArray(listings).map((listing) => normalizeProperty(listing));
