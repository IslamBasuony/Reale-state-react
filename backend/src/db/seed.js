import { promises as fs } from "fs";
import path from "path";

import bcrypt from "bcrypt";
import { fileURLToPath, pathToFileURL } from "url";
import pool from "./pool.js";
import { createSchema, validateSchema } from "./schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;
async function initDB() {
  try {
    // Just test that the pool can connect
    db = await pool.connect();

    db.release(); // Release it back
    // Don't return anything - just confirm pool works
  } catch (error) {
    console.error("Database connection failed:", error.message);
    throw error;
  }
}

/**
 * Clean up database connection
 */
async function closeDB() {
  if (db && !db.ending) {
    await db.end();
    console.log("Database connection closed");
  }
}

/**
 * Load and validate JSON data from a file
 * @param {string} filename - JSON file name
 * @returns {Promise<Object>} Parsed JSON data
 */
async function loadJSONData(filename, language) {
  try {
    let filePath;
    if (language == "arabic") {
      filePath = path.join(__dirname, "ArabicSeeds", filename);
    } else if (language == "english") {
      filePath = path.join(__dirname, "EnglishSeeds", filename);
    }

    const data = await fs.readFile(filePath, "utf8");
    const jsonData = JSON.parse(data);

    // Basic validation for empty data
    if (!jsonData || (Array.isArray(jsonData) && jsonData.length === 0)) {
      throw new Error(`${filename} contains no data`);
    }

    return jsonData;
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`File not found: ${filename}`);
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in ${filename}: ${error.message}`);
    }
    console.error(`Error loading ${filename}:`, error.message);
    throw error;
  }
}

/**
 * Maps a stable seed key (email, name or title) to its actual PostgreSQL id.
 * Fails loudly instead of silently inserting an incorrect relationship.
 */
function resolveId(map, key, label, context) {
  const id = map.get(key);
  if (id === undefined) {
    throw new Error(
      `Cannot resolve ${label} "${key}"${context ? ` (${context})` : ""}: no matching row was seeded for this language`
    );
  }
  return id;
}

/**
 * Builds the per-language lookup map for a seeded table from actual rows.
 * Throws if any required stable key did not make it into the database.
 */
async function buildLookupMap(table, keyColumn, keys, langCode) {
  const rows = await db.query(
    `SELECT id, ${keyColumn} AS key FROM ${table} WHERE ${keyColumn} = ANY($1) AND lang = $2`,
    [keys, langCode]
  );
  const map = new Map(rows.rows.map((row) => [row.key, row.id]));
  for (const key of keys) {
    if (!map.has(key)) {
      throw new Error(`No row found in ${table} for ${keyColumn} "${key}" (lang ${langCode})`);
    }
  }
  return map;
}

async function seedAgents(language, maps) {
  try {
    console.log("Seeding Agents... ");
    const agents = await loadJSONData("agents.json", language);

    if (agents.length === 0) {
      console.log("No Agents to Seed");
      return;
    }

    await db.query("BEGIN");

    try {
      const values = agents
        .map((_, i) => {
          const paramIndex = i * 8;
          return `($${paramIndex + 1}, $${paramIndex + 2}, $${
            paramIndex + 3
          }, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${
            paramIndex + 7
          }, $${paramIndex + 8})`;
        })
        .join(", ");

      const hashedPasswords = await Promise.all(
        agents.map((agent) => bcrypt.hash(agent.password, 10))
      );

      const params = agents.flatMap((agent, i) => [
        agent.first_name,
        agent.last_name,
        agent.phone,
        agent.email,
        hashedPasswords[i],
        agent.bio,
        agent.profile_image_url,
        agent.is_active !== undefined ? agent.is_active : true,
      ]);
      const query = `
        INSERT INTO agents (first_name, last_name, phone, email, password, bio, profile_image_url, is_active) 
        VALUES ${values}
        ON CONFLICT (email) DO NOTHING
      `;

      await db.query(query, params);

      const emails = agents.map((agent) => agent.email);
      const result = await db.query(
        `SELECT id, email FROM agents WHERE email = ANY($1)`,
        [emails]
      );
      maps.agentsByEmail = new Map(result.rows.map((row) => [row.email, row.id]));
      for (const email of emails) {
        if (!maps.agentsByEmail.has(email)) {
          throw new Error(`No agent row found for email "${email}"`);
        }
      }

      await db.query("COMMIT");
      console.log(`Successfully seeded ${agents.length} agents`);
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error seeding agents:", error.message);
    throw error;
  }
}

////////////////////////////////////////////////////
async function seedClients(language, maps) {
  try {
    console.log("Seeding Clients... ");
    const clients = await loadJSONData("clients.json", language);

    if (clients.length === 0) {
      console.log("No Clients to Seed");
      return;
    }

    await db.query("BEGIN");

    try {
      const values = clients
        .map((_, i) => {
          const paramIndex = i * 6;
          return `($${paramIndex + 1}, $${paramIndex + 2}, $${
            paramIndex + 3
          }, $${paramIndex + 4},
          $${paramIndex + 5}, $${paramIndex + 6})`;
        })
        .join(", ");

      const hashedPasswords = await Promise.all(
        clients.map((client) => bcrypt.hash(client.password, 10))
      );

      const params = clients.flatMap((client, i) => [
        client.first_name,
        client.last_name,
        client.phone,
        client.email,
        hashedPasswords[i],
        client.is_admin === true,
      ]);

      const query = `
        INSERT INTO clients (first_name, last_name, phone, email, password, is_admin)
        VALUES ${values}
        ON CONFLICT (email) DO NOTHING
      `;

      await db.query(query, params);

      const emails = clients.map((client) => client.email);
      const result = await db.query(
        `SELECT id, email FROM clients WHERE email = ANY($1)`,
        [emails]
      );
      maps.clientsByEmail = new Map(result.rows.map((row) => [row.email, row.id]));
      for (const email of emails) {
        if (!maps.clientsByEmail.has(email)) {
          throw new Error(`No client row found for email "${email}"`);
        }
      }

      await db.query("COMMIT");
      console.log(`Successfully seeded ${clients.length} clients`);
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error seeding clients:", error.message);
    throw error;
  }
}

//////////////////////////////

async function seedAreas(language, maps, langCode) {
  try {
    console.log("Seeding Areas... ");
    const areas = await loadJSONData("areas.json", language);

    if (areas.length === 0) {
      console.log("No Areas to Seed");
      return;
    }

    await db.query("BEGIN");

    try {
      const values = areas
        .map((_, i) => {
          const paramIndex = i * 6;
          return `($${paramIndex + 1}, $${paramIndex + 2}, $${
            paramIndex + 3
          }, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6})`;
        })
        .join(", ");

      const params = areas.flatMap((area) => [
        area.name,
        area.city,
        area.latitude,
        area.longitude,
        area.description,
        area.lang,
      ]);

      const query = `
        INSERT INTO areas (name, city, latitude, longitude, description, lang) 
        VALUES ${values}
        ON CONFLICT (name) DO NOTHING
      `;

      await db.query(query, params);

      const names = areas.map((area) => area.name);
      maps.areasByName = await buildLookupMap("areas", "name", names, langCode);

      await db.query("COMMIT");
      console.log(`Successfully seeded ${areas.length} areas`);
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error seeding areas:", error.message);
    throw error;
  }
}

//////////////////////////////////////////

async function seedAmenities(language, maps, langCode) {
  try {
    console.log("Seeding Amenities... ");
    const amenities = await loadJSONData("amenities.json", language);

    if (amenities.length === 0) {
      console.log("No Amenities to Seed");
      return;
    }

    await db.query("BEGIN");

    try {
      const values = amenities
        .map((_, i) => {
          const paramIndex = i * 4;
          return `($${paramIndex + 1}, $${paramIndex + 2}, $${
            paramIndex + 3
          }, $${paramIndex + 4})`;
        })
        .join(", ");

      const params = amenities.flatMap((amenity) => [
        amenity.name,
        amenity.icon,
        amenity.description,
        amenity.lang,
      ]);

      const query = `
        INSERT INTO amenities (name, icon, description, lang) 
        VALUES ${values}
        ON CONFLICT (name) DO NOTHING
      `;

      await db.query(query, params);

      const names = amenities.map((amenity) => amenity.name);
      maps.amenitiesByName = await buildLookupMap("amenities", "name", names, langCode);

      await db.query("COMMIT");
      console.log(`Successfully seeded ${amenities.length} amenities`);
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error seeding amenities:", error.message);
    throw error;
  }
}

////////////////////////////////////

async function seedProperties(language, maps, langCode) {
  try {
    console.log("Seeding Properties... ");
    const properties = await loadJSONData("properties.json", language);

    if (properties.length === 0) {
      console.log("No Properties to Seed");
      return;
    }

    await db.query("BEGIN");

    try {
      // Resolve relationship keys to actual ids BEFORE inserting
      const resolved = properties.map((prop) => {
        const agentId = resolveId(
          maps.agentsByEmail,
          prop.agent_email,
          "agent",
          `property "${prop.title}"`
        );
        const areaId = resolveId(
          maps.areasByName,
          prop.area_name,
          "area",
          `property "${prop.title}"`
        );
        return { ...prop, agent_id: agentId, area_id: areaId };
      });

      const values = resolved
        .map((_, i) => {
          const paramIndex = i * 21;
          return `($${paramIndex + 1}, $${paramIndex + 2}, $${
            paramIndex + 3
          }, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${
            paramIndex + 7
          }, $${paramIndex + 8}, $${paramIndex + 9}, $${paramIndex + 10}, $${
            paramIndex + 11
          }, $${paramIndex + 12}, $${paramIndex + 13}, $${paramIndex + 14}, $${
            paramIndex + 15
          }, $${paramIndex + 16}, $${paramIndex + 17}, $${paramIndex + 18}, $${
            paramIndex + 19
          }, $${paramIndex + 20}, $${paramIndex + 21})`;
        })
        .join(", ");

      const params = resolved.flatMap((prop) => [
        prop.title,
        prop.price,
        prop.description,
        prop.address,
        prop.latitude,
        prop.longitude,
        prop.status || "available",
        prop.purpose || "sale",
        prop.bedrooms_number,
        prop.bathrooms_number,
        prop.area_size,
        prop.type,
        prop.agent_id,
        prop.area_id,
        prop.parking_spaces || 0,
        prop.floor_number,
        prop.total_floors,
        prop.is_featured || false,
        prop.lang,
        prop.currency,
        prop.price_period,
      ]);

      const query = `
        INSERT INTO properties (title, price, description, address, latitude, longitude, status, purpose, bedrooms_number, bathrooms_number, area_size, type, agent_id, area_id, parking_spaces, floor_number, total_floors, is_featured, lang, currency, price_period) 
        VALUES ${values}
        ON CONFLICT DO NOTHING
      `;

      await db.query(query, params);

      const titles = resolved.map((prop) => prop.title);
      maps.propertiesByTitle = await buildLookupMap("properties", "title", titles, langCode);

      await db.query("COMMIT");
      console.log(`Successfully seeded ${properties.length} properties`);
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error seeding properties:", error.message);
    throw error;
  }
}

async function seedPropertyAmenities(language, maps) {
  try {
    console.log("Seeding Property Amenities...");
    const propertyAmenities = await loadJSONData(
      "property_amenities.json",
      language
    );

    if (propertyAmenities.length === 0) {
      console.log("No Property Amenities to Seed");
      return;
    }

    await db.query("BEGIN");

    try {
      // Resolve stable keys to actual ids
      const resolved = propertyAmenities.map((propertyAmenity) => {
        const propertyId = resolveId(
          maps.propertiesByTitle,
          propertyAmenity.property_title,
          "property",
          "property_amenities"
        );
        const amenityId = resolveId(
          maps.amenitiesByName,
          propertyAmenity.amenity_name,
          "amenity",
          `property "${propertyAmenity.property_title}"`
        );
        return { property_id: propertyId, amenity_id: amenityId };
      });

      const values = resolved
        .map((_, i) => {
          const paramIndex = i * 2;
          return `($${paramIndex + 1}, $${paramIndex + 2})`;
        })
        .join(", ");

      const params = resolved.flatMap((propertyAmenity) => [
        propertyAmenity.property_id,
        propertyAmenity.amenity_id,
      ]);

      const query = `
        INSERT INTO property_amenities (property_id, amenity_id) 
        VALUES ${values}
        ON CONFLICT (property_id, amenity_id) DO NOTHING
      `;

      await db.query(query, params);
      await db.query("COMMIT");
      console.log(
        `Successfully seeded ${propertyAmenities.length} property amenities`
      );
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error seeding property amenities:", error.message);
    throw error;
  }
}

async function seedReviews(language, maps) {
  try {
    console.log("Seeding Reviews... ");
    const reviews = await loadJSONData("reviews.json", language);

    if (reviews.length === 0) {
      console.log("No reviews to seed");
      return;
    }

    await db.query("BEGIN");

    try {
      // Resolve stable keys to actual ids (property may be null)
      const resolved = reviews.map((review) => {
        const clientId = resolveId(
          maps.clientsByEmail,
          review.client_email,
          "client",
          "reviews"
        );
        const agentId = resolveId(
          maps.agentsByEmail,
          review.agent_email,
          "agent",
          "reviews"
        );
        const propertyId =
          review.property_title != null
            ? resolveId(
                maps.propertiesByTitle,
                review.property_title,
                "property",
                "reviews"
              )
            : null;
        return {
          client_id: clientId,
          agent_id: agentId,
          property_id: propertyId,
          rating: review.rating,
          comment: review.comment,
          created_at: review.created_at,
          updated_at: review.updated_at,
        };
      });

      const values = resolved
        .map((_, i) => {
          const paramIndex = i * 7;
          return `($${paramIndex + 1}, $${paramIndex + 2}, $${
            paramIndex + 3
          }, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${
            paramIndex + 7
          })`;
        })
        .join(", ");

      const params = resolved.flatMap((review) => [
        review.client_id,
        review.agent_id,
        review.property_id,
        review.rating,
        review.comment,
        review.created_at,
        review.updated_at,
      ]);

      const query = `INSERT INTO reviews (client_id, agent_id, property_id, rating, comment, created_at, updated_at) VALUES ${values}`;

      await db.query(query, params);
      await db.query("COMMIT");
      console.log(`Successfully seeded ${reviews.length} reviews`);
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error seeding reviews: ", error.message);
    throw error;
  }
}

async function seedPropertyViewings(language, maps) {
  try {
    console.log("Seeding property viewings... ");
    const propertyViewings = await loadJSONData(
      "property_viewings.json",
      language
    );

    if (propertyViewings.length === 0) {
      console.log("No property viewings to seed.");
      return;
    }

    await db.query("BEGIN");

    try {
      // Resolve stable keys to actual ids
      const resolved = propertyViewings.map((propertyViewing) => {
        const propertyId = resolveId(
          maps.propertiesByTitle,
          propertyViewing.property_title,
          "property",
          "property_viewings"
        );
        const clientId = resolveId(
          maps.clientsByEmail,
          propertyViewing.client_email,
          "client",
          "property_viewings"
        );
        const agentId = resolveId(
          maps.agentsByEmail,
          propertyViewing.agent_email,
          "agent",
          "property_viewings"
        );
        return {
          property_id: propertyId,
          client_id: clientId,
          agent_id: agentId,
          viewing_date: propertyViewing.viewing_date,
          status: propertyViewing.status,
          notes: propertyViewing.notes,
          feedback: propertyViewing.feedback,
          created_at: propertyViewing.created_at,
          updated_at: propertyViewing.updated_at,
        };
      });

      const values = resolved
        .map((_, i) => {
          const paramIndex = i * 9;
          return `($${paramIndex + 1},
        $${paramIndex + 2},
        $${paramIndex + 3},
        $${paramIndex + 4},
        $${paramIndex + 5},
        $${paramIndex + 6},
        $${paramIndex + 7},
        $${paramIndex + 8},
        $${paramIndex + 9})`;
        })
        .join(", ");

      const params = resolved.flatMap((propertyViewing) => [
        propertyViewing.property_id,
        propertyViewing.client_id,
        propertyViewing.agent_id,
        propertyViewing.viewing_date,
        propertyViewing.status,
        propertyViewing.notes,
        propertyViewing.feedback,
        propertyViewing.created_at,
        propertyViewing.updated_at,
      ]);

      const query = `INSERT INTO property_viewings (property_id, client_id, agent_id, viewing_date, status, notes, feedback, created_at, updated_at) VALUES ${values}`;

      await db.query(query, params);
      await db.query("COMMIT");
      console.log(
        `Successfully seeded ${propertyViewings.length} property viewing.`
      );
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error seeding property viewings: ", error.message);
    throw error;
  }
}

async function seedPropertyImages(language, maps) {
  try {
    console.log("Seeding Property Images...");
    const propertyImages = await loadJSONData("property_images.json", language);

    if (propertyImages.length === 0) {
      console.log("No Property Images to Seed");
      return;
    }

    await db.query("BEGIN");

    try {
      // Resolve stable keys to actual ids
      const resolved = propertyImages.map((img) => ({
        ...img,
        property_id: resolveId(
          maps.propertiesByTitle,
          img.property_title,
          "property",
          `image "${img.image_url}"`
        ),
      }));

      const values = resolved
        .map((_, i) => {
          const paramIndex = i * 7;
          return `($${paramIndex + 1}, $${paramIndex + 2}, $${
            paramIndex + 3
          }, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${
            paramIndex + 7
          })`;
        })
        .join(", ");

      const params = resolved.flatMap((img) => [
        img.property_id,
        img.image_url,
        img.is_primary,
        img.display_order,
        img.caption,
        img.created_at,
        img.lang,
      ]);

      const query = `
        INSERT INTO property_images (property_id, image_url, is_primary, display_order, caption, created_at, lang)
        VALUES ${values}
      `;

      await db.query(query, params);
      await db.query("COMMIT");
      console.log(
        `Successfully seeded ${propertyImages.length} property images`
      );
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error seeding property images:", error.message);
    throw error;
  }
}

async function seedData(language) {
  const langCode = language === "arabic" ? "ar" : "en";
  const maps = {
    agentsByEmail: new Map(),
    clientsByEmail: new Map(),
    areasByName: new Map(),
    amenitiesByName: new Map(),
    propertiesByTitle: new Map(),
  };
  console.log(`Seeding ${language} Data`);
  await seedAgents(language, maps);
  await seedClients(language, maps);
  await seedAreas(language, maps, langCode);
  await seedAmenities(language, maps, langCode);
  await seedProperties(language, maps, langCode);
  await seedPropertyAmenities(language, maps);
  await seedPropertyImages(language, maps);
  await seedPropertyViewings(language, maps);
  await seedReviews(language, maps);
  console.log(`Successfully Seeded ${language} Data`);
}

async function main() {
  try {
    await initDB();
    await createSchema(db);
    await validateSchema(db);

    await seedData("arabic");
    await seedData("english");

    console.log("Seeding database...");

    console.log("Database seeding completed successfully");
  } catch (error) {
    console.error("Database seeding failed: ", error.message);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  console.log("\n Received SIGINT, cleaning up...");
  await closeDB();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nReceived SIGTERM, cleaning up...");
  await closeDB();
  process.exit(0);
});

const seed = async () => {
  main().catch((err) => {
    console.error("Error during seeding: ", err);
    process.exit(1);
  });
};

// Run only when executed directly (node ./src/db/seed.js), never on import.
// This keeps `npm run seed` explicit and prevents seeding on `npm start`.
const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  seed();
}

export default { seed };
