import { neon } from '@neondatabase/serverless';
import { verifyToken } from '@clerk/backend';

const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

async function getUserId(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  try {
    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    return payload.sub;
  } catch {
    return null;
  }
}

async function ensureTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS user_maps (
      id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id     text        NOT NULL,
      name        text        NOT NULL,
      map_data    jsonb       NOT NULL,
      canvas_width  integer   NOT NULL DEFAULT 1200,
      canvas_height integer   NOT NULL DEFAULT 900,
      grid_locked   boolean   NOT NULL DEFAULT true,
      created_at  timestamptz NOT NULL DEFAULT now(),
      updated_at  timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS user_maps_user_id_idx ON user_maps(user_id)`;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const userId = await getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorised' });

  const sql = neon(process.env.DATABASE_URL);
  await ensureTable(sql);

  // ── GET — list user's maps ───────────────────────────────────────────────
  if (req.method === 'GET') {
    const maps = await sql`
      SELECT
        id, name, canvas_width, canvas_height, grid_locked,
        created_at, updated_at,
        jsonb_array_length(map_data->'nodes') AS node_count,
        jsonb_array_length(map_data->'edges') AS edge_count
      FROM user_maps
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
    `;
    return res.status(200).json(maps);
  }

  // ── POST — create or update ──────────────────────────────────────────────
  if (req.method === 'POST') {
    const { id, name, nodes, edges, canvasWidth, canvasHeight, gridLocked } = req.body ?? {};
    if (!name || !Array.isArray(nodes) || !Array.isArray(edges)) {
      return res.status(400).json({ error: 'name, nodes and edges are required' });
    }

    if (id) {
      // Update — verify ownership first
      const [existing] = await sql`SELECT user_id FROM user_maps WHERE id = ${id}`;
      if (!existing) return res.status(404).json({ error: 'Map not found' });
      if (existing.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });

      const [row] = await sql`
        UPDATE user_maps SET
          name          = ${name},
          map_data      = ${JSON.stringify({ nodes, edges })},
          canvas_width  = ${canvasWidth ?? 1200},
          canvas_height = ${canvasHeight ?? 900},
          grid_locked   = ${gridLocked ?? true},
          updated_at    = now()
        WHERE id = ${id}
        RETURNING id, name, canvas_width, canvas_height, grid_locked, updated_at
      `;
      return res.status(200).json(row);
    }

    // Create
    const [row] = await sql`
      INSERT INTO user_maps (user_id, name, map_data, canvas_width, canvas_height, grid_locked)
      VALUES (${userId}, ${name}, ${JSON.stringify({ nodes, edges })}, ${canvasWidth ?? 1200}, ${canvasHeight ?? 900}, ${gridLocked ?? true})
      RETURNING id, name, canvas_width, canvas_height, grid_locked, created_at, updated_at
    `;
    return res.status(201).json(row);
  }

  // ── DELETE ───────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const [existing] = await sql`SELECT user_id FROM user_maps WHERE id = ${id}`;
    if (!existing) return res.status(404).json({ error: 'Map not found' });
    if (existing.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });

    await sql`DELETE FROM user_maps WHERE id = ${id}`;
    return res.status(200).json({ deleted: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
