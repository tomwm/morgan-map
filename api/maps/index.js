import { neon } from '@neondatabase/serverless';
import { randomBytes, createHash } from 'crypto';

const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = neon(process.env.DATABASE_URL);

  // ── GET /api/maps — list published maps ──────────────────────────────────
  if (req.method === 'GET') {
    const rows = await sql`
      SELECT
        id, name, node_count, edge_count, published_at,
        (
          SELECT json_agg(json_build_object(
            'id',   node->>'id',
            'x',    (node->'position'->>'x')::float,
            'y',    (node->'position'->>'y')::float,
            'type', node->'data'->>'nodeType'
          ))
          FROM jsonb_array_elements(map_data->'nodes') AS node
        ) AS node_positions,
        (
          SELECT json_agg(json_build_object(
            'source', edge->>'source',
            'target', edge->>'target'
          ))
          FROM jsonb_array_elements(map_data->'edges') AS edge
        ) AS edge_positions
      FROM published_maps
      ORDER BY published_at DESC
      LIMIT 100
    `;
    return res.status(200).json(rows);
  }

  // ── POST /api/maps — publish a map ───────────────────────────────────────
  if (req.method === 'POST') {
    const { name, nodes, edges } = req.body ?? {};
    if (!name || !Array.isArray(nodes) || !Array.isArray(edges)) {
      return res.status(400).json({ error: 'name, nodes and edges are required' });
    }

    // Ensure delete_token_hash column exists (idempotent migration)
    await sql`
      ALTER TABLE published_maps
      ADD COLUMN IF NOT EXISTS delete_token_hash text
    `;

    const deleteToken = randomBytes(32).toString('hex');
    const deleteTokenHash = createHash('sha256').update(deleteToken).digest('hex');

    const [row] = await sql`
      INSERT INTO published_maps (name, node_count, edge_count, map_data, delete_token_hash)
      VALUES (${name}, ${nodes.length}, ${edges.length}, ${JSON.stringify({ nodes, edges })}, ${deleteTokenHash})
      RETURNING id, name, node_count, edge_count, published_at
    `;

    return res.status(201).json({ ...row, deleteToken });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
