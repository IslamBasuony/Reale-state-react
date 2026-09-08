/*
 * طبقة API موحّدة للواجهة
 * -------------------------
 * تتواصل الواجهة مع الـ backend عبر مسار نسبي `/api` وليس عنوانًا
 * مطلقًا، بحيث يقوم CRA proxy بتمرير الطلبات إلى `http://localhost:5000`
 * أثناء التطوير دون أي نداءات مباشرة عبر النطاقات (Cross-Origin).
 * مسارات المصادقة `/auth/*` تمرّ عبر الـ proxy نفسه مباشرة.
 */
import { normalizeListings, normalizeProperty } from "./normalize.js";

export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "/api";

// لغة الواجهة الافتراضية — الواجهة عربية بالكامل (لا يوجد نظام لغات بعد)
export const DEFAULT_LANG = "ar";

const ACCEPTED_LANGS = new Set(["ar", "en"]);

export const getLang = () =>
  ACCEPTED_LANGS.has(DEFAULT_LANG) ? DEFAULT_LANG : "ar";

export const fetchFromApi = async (endpoint, options = {}) => {
  const res = await fetch(endpoint, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const message =
      (body && body.error && (body.error.message || body.error)) ||
      (body &&
        body.errors &&
        Array.isArray(body.errors) &&
        body.errors[0] &&
        body.errors[0].msg) ||
      (body && body.message) ||
      `API request failed: ${res.status} ${res.statusText}`;
    const error = new Error(message);
    error.status = res.status;
    // JSON body = a real backend response (e.g. a genuine 404 "not found");
    // null body (HTML / non-JSON) = host-level miss (Netlify 404 for a missing
    // /api route) which the pages must treat as "backend unavailable".
    error.isJsonBody = body !== null;
    throw error;
  }

  return body && typeof body === "object" && body.success ? body.data : body;
};

export const getListings = async (options = {}) => {
  const data = await fetchFromApi(`${API_BASE_URL}/${getLang()}/listings`, options);
  return normalizeListings(data);
};

export const getSimilarListings = async (id, purpose, type, limit = 3) => {
  const params = new URLSearchParams();
  if (purpose) params.set("purpose", purpose);
  if (type) params.set("type", type);
  if (limit) params.set("limit", String(limit));
  const qs = params.toString();
  const data = await fetchFromApi(
    `${API_BASE_URL}/${getLang()}/listings/${encodeURIComponent(id)}/similar${qs ? `?${qs}` : ""}`
  );
  return normalizeListings(data);
};

export const getListing = async (id) => {
  const data = await fetchFromApi(
    `${API_BASE_URL}/${getLang()}/listings/${encodeURIComponent(id)}`
  );
  return normalizeProperty(data);
};

export const getBrokers = async () => {
  const data = await fetchFromApi(`${API_BASE_URL}/brokers`);
  return Array.isArray(data) ? data : [];
};

// ---------------------------------------------------------------------------
// Auth — جلسة الـ backend (كوكيز `connect.sid`) هي مصدر الحقيقة.
// هذه الدوال ترمي Error مع رسالة عربية قابلة للعرض عند فشل الـ backend.
// ---------------------------------------------------------------------------

export const authRequest = async (endpoint, options = {}) => {
  const res = await fetch(endpoint, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const message =
      (body && body.error && (body.error.message || body.error)) ||
      (body &&
        body.errors &&
        Array.isArray(body.errors) &&
        body.errors[0] &&
        body.errors[0].msg) ||
      "تعذر إتمام العملية، حاول مرة أخرى";
    throw new Error(message);
  }

  return body;
};

export const login = async (credentials) => {
  const body = await authRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
  return { user: body.data.user };
};

export const register = async (data) => {
  const body = await authRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return { user: body.data.user };
};

export const logout = async () => {
  await authRequest("/auth/logout", { method: "POST" });
};

export const getCurrentUser = async () => {
  try {
    const body = await authRequest("/auth/me");
    return body.data.user;
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// Newsletter
// ---------------------------------------------------------------------------

export const subscribeNewsletter = async (email) => {
  const body = await fetchFromApi("/api/newsletter", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  return body;
};

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

export const submitContact = async ({ name, email, phone, message }) => {
  const body = await fetchFromApi("/api/contact", {
    method: "POST",
    body: JSON.stringify({ name, email, phone, message }),
  });
  return body;
};

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export const getAdminStats = async () => {
  const data = await fetchFromApi(`${API_BASE_URL}/admin/stats`);
  return data;
};

export const getAdminAnalytics = async () => {
  const data = await fetchFromApi(`${API_BASE_URL}/admin/analytics`);
  return data;
};

// ─── Admin: Properties ──────────────────────────────────────────────

export const getAdminProperties = async (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  ).toString();
  return fetchFromApi(`${API_BASE_URL}/admin/properties${qs ? `?${qs}` : ""}`);
};

export const getAdminProperty = async (id) =>
  fetchFromApi(`${API_BASE_URL}/admin/properties/${encodeURIComponent(id)}`);

export const createAdminProperty = async (data) =>
  fetchFromApi(`${API_BASE_URL}/admin/properties`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateAdminProperty = async (id, data) =>
  fetchFromApi(`${API_BASE_URL}/admin/properties/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteAdminProperty = async (id) =>
  fetchFromApi(`${API_BASE_URL}/admin/properties/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

// ─── Admin: Clients ─────────────────────────────────────────────────

export const getAdminClients = async (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  ).toString();
  return fetchFromApi(`${API_BASE_URL}/admin/users${qs ? `?${qs}` : ""}`);
};

export const getAdminClient = async (id) =>
  fetchFromApi(`${API_BASE_URL}/admin/users/${encodeURIComponent(id)}`);

export const updateAdminClient = async (id, data) =>
  fetchFromApi(`${API_BASE_URL}/admin/users/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteAdminClient = async (id) =>
  fetchFromApi(`${API_BASE_URL}/admin/users/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

// ─── Admin: Agents ──────────────────────────────────────────────────

export const getAdminAgents = async (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  ).toString();
  return fetchFromApi(`${API_BASE_URL}/admin/agents${qs ? `?${qs}` : ""}`);
};

export const getAdminAgent = async (id) =>
  fetchFromApi(`${API_BASE_URL}/admin/agents/${encodeURIComponent(id)}`);

export const createAdminAgent = async (data) =>
  fetchFromApi(`${API_BASE_URL}/admin/agents`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateAdminAgent = async (id, data) =>
  fetchFromApi(`${API_BASE_URL}/admin/agents/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteAdminAgent = async (id) =>
  fetchFromApi(`${API_BASE_URL}/admin/agents/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

// ─── Admin: Inquiries ─────────────────────────────────────────────

export const getAdminInquiries = async (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  ).toString();
  return fetchFromApi(`${API_BASE_URL}/admin/inquiries${qs ? `?${qs}` : ""}`);
};

// ─── Admin: Contacts ──────────────────────────────────────────────

export const getAdminContacts = async (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  ).toString();
  return fetchFromApi(`${API_BASE_URL}/admin/contacts${qs ? `?${qs}` : ""}`);
};

// ─── Admin: Subscribers ──────────────────────────────────────────

export const getAdminSubscribers = async (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
  ).toString();
  return fetchFromApi(`${API_BASE_URL}/admin/subscribers${qs ? `?${qs}` : ""}`);
};

// ─── Admin: Property Images ──────────────────────────────────────

export const uploadPropertyImagesApi = async (propertyId, files) => {
  const formData = new FormData();
  for (const file of files) {
    formData.append("images", file);
  }
  const res = await fetch(`${API_BASE_URL}/admin/properties/${encodeURIComponent(propertyId)}/images`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  let body = null;
  try { body = await res.json(); } catch { body = null; }
  if (!res.ok) {
    const msg = (body && body.error && (body.error.message || body.error)) ||
      (body && body.errors && Array.isArray(body.errors) && body.errors[0] && body.errors[0].msg) ||
      "تعذر رفع الصور";
    throw new Error(msg);
  }
  return body.data;
};

export const deletePropertyImageApi = async (propertyId, imageId) =>
  fetchFromApi(`${API_BASE_URL}/admin/properties/${encodeURIComponent(propertyId)}/images/${encodeURIComponent(imageId)}`, {
    method: "DELETE",
  });

export const setPropertyImagePrimaryApi = async (propertyId, imageId) =>
  fetchFromApi(`${API_BASE_URL}/admin/properties/${encodeURIComponent(propertyId)}/images/${encodeURIComponent(imageId)}/primary`, {
    method: "PUT",
  });

// ─── Admin: Settings ─────────────────────────────────────────────

export const getAdminProfile = async () =>
  fetchFromApi(`${API_BASE_URL}/admin/settings/profile`);

export const updateAdminProfile = async (data) =>
  fetchFromApi(`${API_BASE_URL}/admin/settings/profile`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const changeAdminPassword = async (data) =>
  fetchFromApi(`${API_BASE_URL}/admin/settings/password`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

// ─── Admin: Audit Logs ───────────────────────────────────────────

export const getAdminAuditLogs = async (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ).toString();
  return fetchFromApi(`${API_BASE_URL}/admin/audit-logs${qs ? `?${qs}` : ""}`);
};

export const getAdminAuditLogById = async (id) =>
  fetchFromApi(`${API_BASE_URL}/admin/audit-logs/${encodeURIComponent(id)}`);

// ---------------------------------------------------------------------------
// Project Inquiry
// ---------------------------------------------------------------------------

export const submitProjectInquiry = async (projectId, { name, email, phone }) => {
  const body = await fetchFromApi(
    `/api/projects/${encodeURIComponent(projectId)}/inquiries`,
    {
      method: "POST",
      body: JSON.stringify({ name, email, phone }),
    }
  );
  return body;
};
