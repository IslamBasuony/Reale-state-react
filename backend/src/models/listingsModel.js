import { executeQuery } from "../utils/dbHelpers.js";

/*
 * Batched related-data fetch for the given property rows.
 * Avoids N+1 queries by pulling images, areas, agents and amenities
 * for all properties at once, then merging them in memory.
 */
async function getRelatedData(rows) {
  if (!rows.length) {
    return {
      imagesByProperty: {},
      areasById: new Map(),
      agentsById: new Map(),
      amenitiesByProperty: {},
    };
  }

  const ids = rows.map((row) => row.id);
  const areaIds = [...new Set(rows.map((row) => row.area_id).filter((id) => id != null))];
  const agentIds = [...new Set(rows.map((row) => row.agent_id).filter((id) => id != null))];

  const [imagesResult, areasResult, agentsResult, amenitiesResult] = await Promise.all([
    executeQuery(
      `SELECT property_id, image_url, is_primary, display_order
         FROM property_images
        WHERE property_id = ANY($1)
        ORDER BY is_primary DESC, display_order ASC, id ASC`,
      [ids],
      "Getting property images"
    ),
    areaIds.length
      ? executeQuery(
          `SELECT id, name, city, latitude, longitude, description FROM areas WHERE id = ANY($1)`,
          [areaIds],
          "Getting areas"
        )
      : Promise.resolve({ rows: [] }),
    agentIds.length
      ? executeQuery(
          `SELECT id, first_name, last_name, phone, email, bio, profile_image_url FROM agents WHERE id = ANY($1)`,
          [agentIds],
          "Getting agents"
        )
      : Promise.resolve({ rows: [] }),
    executeQuery(
      `SELECT pa.property_id, a.name, a.icon, a.description
         FROM property_amenities pa
         JOIN amenities a ON a.id = pa.amenity_id
        WHERE pa.property_id = ANY($1)
        ORDER BY a.name ASC`,
      [ids],
      "Getting property amenities"
    ),
  ]);

  const imagesByProperty = {};
  for (const image of imagesResult.rows) {
    (imagesByProperty[image.property_id] ||= []).push(image.image_url);
  }

  const amenitiesByProperty = {};
  for (const amenity of amenitiesResult.rows) {
    (amenitiesByProperty[amenity.property_id] ||= []).push({
      name: amenity.name,
      icon: amenity.icon,
      description: amenity.description,
    });
  }

  return {
    imagesByProperty,
    areasById: new Map(areasResult.rows.map((area) => [area.id, area])),
    agentsById: new Map(agentsResult.rows.map((agent) => [agent.id, agent])),
    amenitiesByProperty,
  };
}

/*
 * Attaches the related data to a single listing while keeping all raw
 * property columns, so consumers always get a consistent shape.
 */
function enrichListing(listing, related) {
  const area = listing.area_id != null ? related.areasById.get(listing.area_id) : undefined;
  const agent = listing.agent_id != null ? related.agentsById.get(listing.agent_id) : undefined;
  const images = related.imagesByProperty[listing.id] || [];
  const amenities = related.amenitiesByProperty[listing.id] || [];

  return {
    ...listing,
    images,
    image_url: images[0] || null,
    location: area
      ? {
          id: area.id,
          name: area.name,
          city: area.city,
          latitude: area.latitude,
          longitude: area.longitude,
          description: area.description,
        }
      : null,
    agent: agent
      ? {
          id: agent.id,
          name: `${agent.first_name} ${agent.last_name}`.trim(),
          first_name: agent.first_name,
          last_name: agent.last_name,
          phone: agent.phone,
          email: agent.email,
          bio: agent.bio,
          profile_image_url: agent.profile_image_url,
        }
      : null,
    features: amenities.map((amenity) => amenity.name),
    amenities,
  };
}

async function findAllListings(lang) {
  try {
    const result = await executeQuery(
      `SELECT p.id, p.title, p.price, p.description, p.address,
              p.latitude, p.longitude, p.status, p.purpose, p.type,
              p.bedrooms_number, p.bathrooms_number, p.area_size,
              p.parking_spaces, p.floor_number, p.total_floors,
              p.is_featured, p.view_count, p.lang,
              p.currency, p.price_period,
              p.agent_id, p.area_id, p.created_at, p.updated_at
         FROM properties p
         LEFT JOIN agents a ON a.id = p.agent_id
        WHERE p.lang = $1
        ORDER BY p.id ASC`,
      [lang],
      "Getting all listings"
    );
    if (!result) {
      return [];
    }
    const related = await getRelatedData(result.rows);
    const enriched = result.rows.map((row) => enrichListing(row, related));
    return enriched;
  } catch (error) {
    console.error("Couldn't get all listings: ", error);
    throw error;
  }
}

async function findListingById(lang, id) {
  try {
    const result = await executeQuery(
      `SELECT p.id, p.title, p.price, p.description, p.address,
              p.latitude, p.longitude, p.status, p.purpose, p.type,
              p.bedrooms_number, p.bathrooms_number, p.area_size,
              p.parking_spaces, p.floor_number, p.total_floors,
              p.is_featured, p.view_count, p.lang,
              p.currency, p.price_period,
              p.agent_id, p.area_id, p.created_at, p.updated_at
         FROM properties p
         LEFT JOIN agents a ON a.id = p.agent_id
        WHERE p.id=$1 AND p.lang=$2`,
      [id, lang],
      "Getting listing by id"
    );
    const listing = result.rows[0];
    if (!listing) {
      return undefined;
    }
    const related = await getRelatedData([listing]);
    return enrichListing(listing, related);
  } catch (error) {
    console.error("Error if findListingById: ", error);
    throw error;
  }
}

async function findSimilarListings(lang, purpose, type, excludeId, limit = 3) {
  try {
    const result = await executeQuery(
      `SELECT p.id, p.title, p.price, p.description, p.address,
              p.latitude, p.longitude, p.status, p.purpose, p.type,
              p.bedrooms_number, p.bathrooms_number, p.area_size,
              p.parking_spaces, p.floor_number, p.total_floors,
              p.is_featured, p.view_count, p.lang,
              p.currency, p.price_period,
              p.agent_id, p.area_id, p.created_at, p.updated_at
         FROM properties p
         LEFT JOIN agents a ON a.id = p.agent_id
        WHERE p.lang = $1
          AND p.id != $2
          AND ($3::property_purpose IS NULL OR p.purpose = $3::property_purpose)
          AND ($4::property_type IS NULL OR p.type = $4::property_type)
        ORDER BY p.id DESC
        LIMIT $5`,
      [lang, excludeId, purpose || null, type || null, limit],
      "Getting similar listings"
    );
    if (!result || !result.rows.length) {
      return [];
    }
    const related = await getRelatedData(result.rows);
    return result.rows.map((row) => enrichListing(row, related));
  } catch (error) {
    console.error("Couldn't get similar listings: ", error);
    throw error;
  }
}

export default { findAllListings, findListingById, findSimilarListings };
