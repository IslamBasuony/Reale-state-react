import fallbackProperties from "./fallbackProperties";
import { normalizeListings } from "../api/normalize";

/**
 * Shared fallback listings used across pages when the API is unavailable.
 * Derived from the single fallback data source so every page stays consistent.
 */
export const FALLBACK_LISTINGS = normalizeListings(fallbackProperties);
