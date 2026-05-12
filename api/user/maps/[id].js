import { neon } from '@neondatabase/serverless';
import { verifyToken } from '@clerk/backend';

const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const userId = await getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorised' });

  const { id } = req.query;
  const sql = neon(process.env.DATABASE_URL);

  const [row] = await sql`
    SELECT id, name, map_data, canvas_width, canvas_height, grid_locked
    FROM user_maps WHERE id = ${id} AND user_id = ${userId}
  `;

  if (!row) return res.status(404).json({ error: 'Map not found' });

  return res.status(200).json({
    id: row.id,
    name: row.name,
    nodes: row.map_data.nodes,
    edges: row.map_data.edges,
    canvasWidth: row.canvas_width,
    canvasHeight: row.canvas_height,
    gridLocked: row.grid_locked,
  });
}
