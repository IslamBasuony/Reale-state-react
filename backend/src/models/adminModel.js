import { executeQuery } from "../utils/dbHelpers.js";
import { AppError } from "../utils/customErrors.js";
import { hashPassword } from "../utils/password.js";
import pool from "../db/pool.js";
import bcrypt from "bcrypt";

// ─── Statistics ────────────────────────────────────────────────────────

const getStats = async () => {
  const [countsResult, recentPropertiesResult, recentUsersResult] = await Promise.all([
    executeQuery(
      `SELECT
         (SELECT COUNT(*) FROM properties)                                   AS total_properties,
         (SELECT COUNT(*) FROM properties WHERE purpose = 'sale')           AS sale_properties,
         (SELECT COUNT(*) FROM properties WHERE purpose = 'rent')           AS rent_properties,
         (SELECT COUNT(*) FROM clients)                                      AS total_clients,
         (SELECT COUNT(*) FROM agents)                                       AS total_agents,
         (SELECT COUNT(*) FROM newsletter_subscribers WHERE is_active = TRUE) AS total_subscribers,
         (SELECT COUNT(*) FROM contact_messages)                             AS total_contacts,
         (SELECT COUNT(*) FROM project_inquiries)                            AS total_inquiries`,
      [],
      "admin stats: counts"
    ),
    executeQuery(
      `SELECT p.id, p.title, p.price, p.status, p.purpose, p.type,
              p.lang, p.created_at,
              a.first_name || ' ' || a.last_name AS agent_name
         FROM properties p
         LEFT JOIN agents a ON p.agent_id = a.id
        ORDER BY p.created_at DESC
        LIMIT 5`,
      [],
      "admin stats: recent properties"
    ),
    executeQuery(
      `SELECT id, first_name, last_name, email, is_admin, created_at
         FROM clients
        ORDER BY created_at DESC
        LIMIT 5`,
      [],
      "admin stats: recent users"
    ),
  ]);

  const c = countsResult.rows[0];

  return {
    totalProperties: Number(c.total_properties),
    saleProperties: Number(c.sale_properties),
    rentProperties: Number(c.rent_properties),
    totalClients: Number(c.total_clients),
    totalAgents: Number(c.total_agents),
    totalSubscribers: Number(c.total_subscribers),
    totalInquiries: Number(c.total_inquiries),
    totalContacts: Number(c.total_contacts),
    recentProperties: recentPropertiesResult.rows,
    recentUsers: recentUsersResult.rows,
  };
};

// ─── Properties ────────────────────────────────────────────────────────

// ─── Analytics ─────────────────────────────────────────────────────────

const getAnalytics = async () => {
  const [
    byStatus,
    byType,
    byLang,
    byMonth,
    clientsByMonth,
    agentPerf,
    activeAgents,
  ] = await Promise.all([
    executeQuery(
      `SELECT status, COUNT(*)::int AS count
         FROM properties
        GROUP BY status
        ORDER BY count DESC`,
      [],
      "analytics: properties by status"
    ),
    executeQuery(
      `SELECT type, COUNT(*)::int AS count
         FROM properties
        GROUP BY type
        ORDER BY count DESC`,
      [],
      "analytics: properties by type"
    ),
    executeQuery(
      `SELECT lang, COUNT(*)::int AS count
         FROM properties
        GROUP BY lang`,
      [],
      "analytics: properties by lang"
    ),
    executeQuery(
      `SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
              COUNT(*)::int AS count
         FROM properties
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
        LIMIT 12`,
      [],
      "analytics: properties by month"
    ),
    executeQuery(
      `SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
              COUNT(*)::int AS count
         FROM clients
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
        LIMIT 12`,
      [],
      "analytics: clients by month"
    ),
    executeQuery(
      `SELECT * FROM vw_agent_performance ORDER BY total_properties DESC`,
      [],
      "analytics: agent performance"
    ),
    executeQuery(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE is_active)::int AS active
         FROM agents`,
      [],
      "analytics: active agents"
    ),
  ]);

  return {
    propertiesByStatus: byStatus.rows,
    propertiesByType: byType.rows,
    propertiesByLang: byLang.rows,
    propertiesByMonth: byMonth.rows.reverse(),
    clientsByMonth: clientsByMonth.rows.reverse(),
    agentPerformance: agentPerf.rows,
    totalAgents: activeAgents.rows[0].total,
    activeAgents: activeAgents.rows[0].active,
  };
};

// ─── Properties ────────────────────────────────────────────────────────

const findAllProperties = async ({
  page = 1,
  limit = 20,
  lang,
  status,
  purpose,
  type,
} = {}) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (lang) {
    conditions.push(`p.lang = $${idx++}`);
    params.push(lang);
  }
  if (status) {
    conditions.push(`p.status = $${idx++}`);
    params.push(status);
  }
  if (purpose) {
    conditions.push(`p.purpose = $${idx++}`);
    params.push(purpose);
  }
  if (type) {
    conditions.push(`p.type = $${idx++}`);
    params.push(type);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (page - 1) * limit;

  const [countResult, dataResult] = await Promise.all([
    executeQuery(
      `SELECT COUNT(*) FROM properties p ${where}`,
      params,
      "admin properties count"
    ),
    executeQuery(
      `SELECT p.*,
              a.first_name || ' ' || a.last_name AS agent_name
         FROM properties p
         LEFT JOIN agents a ON p.agent_id = a.id
        ${where}
        ORDER BY p.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset],
      "admin properties list"
    ),
  ]);

  return {
    properties: dataResult.rows,
    total: Number(countResult.rows[0].count),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult.rows[0].count) / limit),
  };
};

const findPropertyById = async (id) => {
  const result = await executeQuery(
    `SELECT p.*,
            a.first_name || ' ' || a.last_name AS agent_name
       FROM properties p
       LEFT JOIN agents a ON p.agent_id = a.id
      WHERE p.id = $1`,
    [id],
    "admin property by id"
  );

  const property = result.rows[0];
  if (!property) return null;

  const [imagesResult, amenitiesResult] = await Promise.all([
    executeQuery(
      `SELECT id, image_url, is_primary, display_order, caption, lang
         FROM property_images
        WHERE property_id = $1
        ORDER BY is_primary DESC, display_order ASC, id ASC`,
      [id],
      "admin property images"
    ),
    executeQuery(
      `SELECT a.id, a.name, a.icon, a.description
         FROM property_amenities pa
         JOIN amenities a ON a.id = pa.amenity_id
        WHERE pa.property_id = $1
        ORDER BY a.name ASC`,
      [id],
      "admin property amenities"
    ),
  ]);

  return {
    ...property,
    images: imagesResult.rows,
    amenities: amenitiesResult.rows,
  };
};

const createProperty = async (data, auditData = null) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const propResult = await client.query(
      `INSERT INTO properties
         (title, price, currency, price_period, description, address,
          status, purpose, bedrooms_number, bathrooms_number, area_size,
          lang, type, agent_id, area_id, parking_spaces, floor_number,
          total_floors, is_featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       RETURNING *`,
      [
        data.title,
        data.price,
        data.currency || "EGP",
        data.price_period || "monthly",
        data.description || null,
        data.address,
        data.status || "available",
        data.purpose,
        data.bedrooms_number ?? null,
        data.bathrooms_number ?? null,
        data.area_size ?? null,
        data.lang,
        data.type,
        data.agent_id,
        data.area_id ?? null,
        data.parking_spaces || 0,
        data.floor_number ?? null,
        data.total_floors ?? null,
        data.is_featured || false,
      ]
    );

    const propertyId = propResult.rows[0].id;

    if (Array.isArray(data.images) && data.images.length > 0) {
      const imgValues = data.images
        .map((_, i) => {
          const p = i * 6;
          return `($${p + 1},$${p + 2},$${p + 3},$${p + 4},$${p + 5},$${p + 6})`;
        })
        .join(",");
      const imgParams = data.images.flatMap((img) => [
        propertyId,
        img.image_url,
        img.is_primary || false,
        img.display_order || 0,
        img.caption || null,
        img.lang || data.lang,
      ]);
      await client.query(
        `INSERT INTO property_images (property_id, image_url, is_primary, display_order, caption, lang)
         VALUES ${imgValues}`,
        imgParams
      );
    }

    if (Array.isArray(data.amenities) && data.amenities.length > 0) {
      const amenityValues = data.amenities
        .map((_, i) => `($${i * 2 + 1},$${i * 2 + 2})`)
        .join(",");
      const amenityParams = data.amenities.flatMap((amenityId) => [
        propertyId,
        amenityId,
      ]);
      await client.query(
        `INSERT INTO property_amenities (property_id, amenity_id)
         VALUES ${amenityValues}
         ON CONFLICT (property_id, amenity_id) DO NOTHING`,
        amenityParams
      );
    }

    if (auditData) {
      await client.query(
        `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, metadata, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          auditData.adminId, auditData.action, auditData.entityType, propertyId,
          auditData.description, JSON.stringify(auditData.metadata || {}),
          auditData.ip || null, auditData.userAgent || null,
        ]
      );
    }

    await client.query("COMMIT");
    return propResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const updateProperty = async (id, data, auditData = null) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const fields = [];
    const values = [];
    let idx = 1;

    const allowed = [
      "title", "price", "currency", "price_period", "description",
      "address", "status", "purpose", "bedrooms_number", "bathrooms_number",
      "area_size", "lang", "type", "agent_id", "area_id", "parking_spaces",
      "floor_number", "total_floors", "is_featured",
    ];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0 && !Array.isArray(data.images) && !Array.isArray(data.amenities)) {
      await client.query("ROLLBACK");
      throw new AppError("No fields to update", 400);
    }

    let updatedProperty = null;
    if (fields.length > 0) {
      values.push(id);
      const result = await client.query(
        `UPDATE properties SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
        values
      );
      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return null;
      }
      updatedProperty = result.rows[0];
    } else {
      const check = await client.query(`SELECT * FROM properties WHERE id = $1`, [id]);
      if (check.rows.length === 0) {
        await client.query("ROLLBACK");
        return null;
      }
      updatedProperty = check.rows[0];
    }

    if (Array.isArray(data.images)) {
      await client.query(
        `DELETE FROM property_images WHERE property_id = $1`,
        [id]
      );
      if (data.images.length > 0) {
        const imgValues = data.images
          .map((_, i) => {
            const p = i * 6;
            return `($${p + 1},$${p + 2},$${p + 3},$${p + 4},$${p + 5},$${p + 6})`;
          })
          .join(",");
        const imgParams = data.images.flatMap((img) => [
          id,
          img.image_url,
          img.is_primary || false,
          img.display_order || 0,
          img.caption || null,
          img.lang || updatedProperty.lang,
        ]);
        await client.query(
          `INSERT INTO property_images (property_id, image_url, is_primary, display_order, caption, lang)
           VALUES ${imgValues}`,
          imgParams
        );
      }
    }

    if (Array.isArray(data.amenities)) {
      await client.query(
        `DELETE FROM property_amenities WHERE property_id = $1`,
        [id]
      );
      if (data.amenities.length > 0) {
        const amenityValues = data.amenities
          .map((_, i) => `($${i * 2 + 1},$${i * 2 + 2})`)
          .join(",");
        const amenityParams = data.amenities.flatMap((amenityId) => [
          id,
          amenityId,
        ]);
        await client.query(
          `INSERT INTO property_amenities (property_id, amenity_id)
           VALUES ${amenityValues}
           ON CONFLICT (property_id, amenity_id) DO NOTHING`,
          amenityParams
        );
      }
    }

    if (auditData) {
      await client.query(
        `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, metadata, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          auditData.adminId, auditData.action, auditData.entityType, Number(id),
          auditData.description, JSON.stringify(auditData.metadata || {}),
          auditData.ip || null, auditData.userAgent || null,
        ]
      );
    }

    await client.query("COMMIT");
    return updatedProperty;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const deleteProperty = async (id) => {
  const result = await executeQuery(
    `DELETE FROM properties WHERE id = $1 RETURNING id`,
    [id],
    "admin delete property"
  );
  return result.rows[0] || null;
};

// ─── Property Images ──────────────────────────────────────────────────

const addPropertyImages = async (propertyId, files, auditData = null) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const maxOrder = await client.query(
      `SELECT COALESCE(MAX(display_order), 0) AS max_order
         FROM property_images WHERE property_id = $1`,
      [propertyId]
    );
    let order = Number(maxOrder.rows[0].max_order);

    const inserted = [];
    for (const file of files) {
      order++;
      const result = await client.query(
        `INSERT INTO property_images (property_id, image_url, is_primary, display_order, lang)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, image_url, is_primary, display_order, caption, lang, created_at`,
        [
          propertyId,
          `/uploads/properties/${file.filename}`,
          false,
          order,
          "ar",
        ]
      );
      inserted.push(result.rows[0]);
    }

    if (auditData) {
      await client.query(
        `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, metadata, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          auditData.adminId, auditData.action, auditData.entityType, Number(propertyId),
          auditData.description, JSON.stringify(auditData.metadata || {}),
          auditData.ip || null, auditData.userAgent || null,
        ]
      );
    }

    await client.query("COMMIT");
    return inserted;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const deletePropertyImage = async (propertyId, imageId) => {
  const result = await executeQuery(
    `DELETE FROM property_images WHERE id = $1 AND property_id = $2 RETURNING id, image_url`,
    [imageId, propertyId],
    "admin delete property image"
  );
  return result.rows[0] || null;
};

const setPropertyImagePrimary = async (propertyId, imageId, auditData = null) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE property_images SET is_primary = FALSE WHERE property_id = $1`,
      [propertyId]
    );
    const result = await client.query(
      `UPDATE property_images SET is_primary = TRUE WHERE id = $1 AND property_id = $2
       RETURNING id, image_url, is_primary, display_order, caption, lang, created_at`,
      [imageId, propertyId]
    );

    if (auditData) {
      await client.query(
        `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description, metadata, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          auditData.adminId, auditData.action, auditData.entityType, Number(propertyId),
          auditData.description, JSON.stringify(auditData.metadata || {}),
          auditData.ip || null, auditData.userAgent || null,
        ]
      );
    }

    await client.query("COMMIT");
    return result.rows[0] || null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// ─── Clients ───────────────────────────────────────────────────────────

const findAllClients = async ({ page = 1, limit = 20, search } = {}) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (search) {
    conditions.push(
      `(first_name ILIKE $${idx} OR last_name ILIKE $${idx} OR email ILIKE $${idx})`
    );
    params.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (page - 1) * limit;

  const [countResult, dataResult] = await Promise.all([
    executeQuery(
      `SELECT COUNT(*) FROM clients ${where}`,
      params,
      "admin clients count"
    ),
    executeQuery(
      `SELECT id, first_name, last_name, email, phone, is_admin, created_at, updated_at
         FROM clients
        ${where}
        ORDER BY created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset],
      "admin clients list"
    ),
  ]);

  return {
    clients: dataResult.rows,
    total: Number(countResult.rows[0].count),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult.rows[0].count) / limit),
  };
};

const findClientById = async (id) => {
  const result = await executeQuery(
    `SELECT id, first_name, last_name, email, phone, is_admin, created_at, updated_at
       FROM clients
      WHERE id = $1`,
    [id],
    "admin client by id"
  );
  return result.rows[0] || null;
};

const updateClient = async (id, data) => {
  const fields = [];
  const values = [];
  let idx = 1;

  const allowed = ["first_name", "last_name", "email", "phone", "is_admin"];

  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push(data[key]);
    }
  }

  if (fields.length === 0) {
    throw new AppError("No fields to update", 400);
  }

  values.push(id);
  const result = await executeQuery(
    `UPDATE clients SET ${fields.join(", ")} WHERE id = $${idx}
     RETURNING id, first_name, last_name, email, phone, is_admin, created_at, updated_at`,
    values,
    "admin update client"
  );
  return result.rows[0] || null;
};

const deleteClient = async (id) => {
  const result = await executeQuery(
    `DELETE FROM clients WHERE id = $1 RETURNING id`,
    [id],
    "admin delete client"
  );
  return result.rows[0] || null;
};

const countAdmins = async () => {
  const result = await executeQuery(
    `SELECT COUNT(*) AS total FROM clients WHERE is_admin = TRUE`,
    [],
    "admin count admins"
  );
  return Number(result.rows[0].total);
};

// ─── Agents ────────────────────────────────────────────────────────────

const findAllAgents = async ({ page = 1, limit = 20, search } = {}) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (search) {
    conditions.push(
      `(first_name ILIKE $${idx} OR last_name ILIKE $${idx} OR email ILIKE $${idx})`
    );
    params.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (page - 1) * limit;

  const [countResult, dataResult] = await Promise.all([
    executeQuery(
      `SELECT COUNT(*) FROM agents ${where}`,
      params,
      "admin agents count"
    ),
    executeQuery(
      `SELECT id, first_name, last_name, email, phone, bio, profile_image_url, is_active, created_at, updated_at
         FROM agents
        ${where}
        ORDER BY created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset],
      "admin agents list"
    ),
  ]);

  return {
    agents: dataResult.rows,
    total: Number(countResult.rows[0].count),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult.rows[0].count) / limit),
  };
};

const findAgentById = async (id) => {
  const result = await executeQuery(
    `SELECT id, first_name, last_name, email, phone, bio, profile_image_url, is_active, created_at, updated_at
       FROM agents
      WHERE id = $1`,
    [id],
    "admin agent by id"
  );
  return result.rows[0] || null;
};

const createAgent = async (data) => {
  const hashedPassword = await hashPassword(data.password);
  const result = await executeQuery(
    `INSERT INTO agents (first_name, last_name, phone, email, password, bio, profile_image_url, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, first_name, last_name, email, phone, bio, profile_image_url, is_active, created_at, updated_at`,
    [
      data.first_name,
      data.last_name,
      data.phone,
      data.email,
      hashedPassword,
      data.bio || null,
      data.profile_image_url || null,
      data.is_active !== undefined ? data.is_active : true,
    ],
    "admin create agent"
  );
  return result.rows[0];
};

const updateAgent = async (id, data) => {
  const fields = [];
  const values = [];
  let idx = 1;

  const allowed = [
    "first_name", "last_name", "email", "phone", "bio",
    "profile_image_url", "is_active",
  ];

  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push(data[key]);
    }
  }

  if (data.password) {
    const hashed = await hashPassword(data.password);
    fields.push(`password = $${idx++}`);
    values.push(hashed);
  }

  if (fields.length === 0) {
    throw new AppError("No fields to update", 400);
  }

  values.push(id);
  const result = await executeQuery(
    `UPDATE agents SET ${fields.join(", ")} WHERE id = $${idx}
     RETURNING id, first_name, last_name, email, phone, bio, profile_image_url, is_active, created_at, updated_at`,
    values,
    "admin update agent"
  );
  return result.rows[0] || null;
};

const deleteAgent = async (id) => {
  const result = await executeQuery(
    `DELETE FROM agents WHERE id = $1 RETURNING id`,
    [id],
    "admin delete agent"
  );
  return result.rows[0] || null;
};

// ─── Inquiries ─────────────────────────────────────────────────────────

const findAllInquiries = async ({ page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;

  const [countResult, dataResult] = await Promise.all([
    executeQuery(
      `SELECT COUNT(*) FROM project_inquiries`,
      [],
      "admin inquiries count"
    ),
    executeQuery(
      `SELECT * FROM project_inquiries
        ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
      "admin inquiries list"
    ),
  ]);

  return {
    inquiries: dataResult.rows,
    total: Number(countResult.rows[0].count),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult.rows[0].count) / limit),
  };
};

// ─── Contact Messages ──────────────────────────────────────────────────

const findAllContacts = async ({ page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;

  const [countResult, dataResult] = await Promise.all([
    executeQuery(
      `SELECT COUNT(*) FROM contact_messages`,
      [],
      "admin contacts count"
    ),
    executeQuery(
      `SELECT * FROM contact_messages
        ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
      "admin contacts list"
    ),
  ]);

  return {
    contacts: dataResult.rows,
    total: Number(countResult.rows[0].count),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult.rows[0].count) / limit),
  };
};

// ─── Newsletter Subscribers ────────────────────────────────────────────

const findAllSubscribers = async ({ page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;

  const [countResult, dataResult] = await Promise.all([
    executeQuery(
      `SELECT COUNT(*) FROM newsletter_subscribers`,
      [],
      "admin subscribers count"
    ),
    executeQuery(
      `SELECT * FROM newsletter_subscribers
        ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
      "admin subscribers list"
    ),
  ]);

  return {
    subscribers: dataResult.rows,
    total: Number(countResult.rows[0].count),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult.rows[0].count) / limit),
  };
};

// ─── Admin Settings ────────────────────────────────────────────────────

const getAdminProfile = async (userId) => {
  const result = await executeQuery(
    `SELECT id, first_name, last_name, email, phone, created_at, updated_at
       FROM clients WHERE id = $1`,
    [userId],
    "admin get profile"
  );
  return result.rows[0] || null;
};

const updateAdminProfile = async (userId, data) => {
  const fields = [];
  const values = [];
  let idx = 1;

  const allowed = ["first_name", "last_name", "email", "phone"];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push(data[key]);
    }
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  values.push(userId);
  const result = await executeQuery(
    `UPDATE clients SET ${fields.join(", ")} WHERE id = $${idx}
     RETURNING id, first_name, last_name, email, phone, created_at, updated_at`,
    values,
    "admin update profile"
  );
  return result.rows[0] || null;
};

const changeAdminPassword = async (userId, currentPassword, newPassword) => {
  const userResult = await executeQuery(
    `SELECT id, password FROM clients WHERE id = $1`,
    [userId],
    "admin get password"
  );
  const user = userResult.rows[0];
  if (!user) return { error: "المستخدم غير موجود" };

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return { error: "كلمة المرور الحالية غير صحيحة" };

  const hashed = await hashPassword(newPassword);
  await executeQuery(
    `UPDATE clients SET password = $1 WHERE id = $2`,
    [hashed, userId],
    "admin change password"
  );
  return { success: true };
};

export default {
  getStats,
  getAnalytics,
  findAllProperties,
  findPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  addPropertyImages,
  deletePropertyImage,
  setPropertyImagePrimary,
  findAllClients,
  findClientById,
  updateClient,
  deleteClient,
  countAdmins,
  findAllAgents,
  findAgentById,
  createAgent,
  updateAgent,
  deleteAgent,
  findAllInquiries,
  findAllContacts,
  findAllSubscribers,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
};
