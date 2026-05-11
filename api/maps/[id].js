import { neon } from '@neondatabase/serverless';
import { createHash } from 'crypto';

const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id, token } = req.query;
  const sql = neon(process.env.DATABASE_URL);

  // ── GET /api/maps/[id] ───────────────────────────────────────────────────
  if (req.method === 'GET') {
    const [row] = await sql`
      SELECT id, name, node_count, edge_count, published_at, map_data
      FROM published_maps
      WHERE id = ${id}
    `;

    if (!row) return res.status(404).json({ error: 'Map not found' });

    return res.status(200).json({
      id: row.id,
      name: row.name,
      node_count: row.node_count,
      edge_count: row.edge_count,
      published_at: row.published_at,
      nodes: row.map_data.nodes,
      edges: row.map_data.edges,
    });
  }

  // ── DELETE /api/maps/[id]?token=xxx ──────────────────────────────────────
  if (req.method === 'DELETE') {
    if (!token) return res.status(400).json({ error: 'token is required' });

    const tokenHash = createHash('sha256').update(token).digest('hex');

    const [row] = await sql`
      SELECT delete_token_hash FROM published_maps WHERE id = ${id}
    `;

    if (!row) return res.status(404).json({ error: 'Map not found' });
    if (row.delete_token_hash !== tokenHash) return res.status(403).json({ error: 'Invalid token' });

    await sql`DELETE FROM published_maps WHERE id = ${id}`;
    return res.status(200).json({ deleted: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
