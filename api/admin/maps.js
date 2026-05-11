import { neon } from '@neondatabase/serverless';

const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

function authenticate(req) {
  const secret = process.env.MORGAN_MAP_ADMIN_SECRET;
  if (!secret) return false; // env var not set — deny all
  const auth = req.headers['authorization'] ?? '';
  return auth === `Bearer ${secret}`;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!authenticate(req)) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  const sql = neon(process.env.DATABASE_URL);

  // ── GET /api/admin/maps — full list ──────────────────────────────────────
  if (req.method === 'GET') {
    const rows = await sql`
      SELECT id, name, node_count, edge_count, published_at
      FROM published_maps
      ORDER BY published_at DESC
    `;
    return res.status(200).json(rows);
  }

  // ── DELETE /api/admin/maps?id=xxx ────────────────────────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id is required' });
    await sql`DELETE FROM published_maps WHERE id = ${id}`;
    return res.status(200).json({ deleted: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
