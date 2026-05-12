import { Node, Edge } from 'reactflow';
import { NodeData, EdgeData } from '../types';

export interface CloudMap {
  id: string;
  name: string;
  node_count: number;
  edge_count: number;
  canvas_width: number;
  canvas_height: number;
  grid_locked: boolean;
  created_at: string;
  updated_at: string;
}

async function authHeaders(getToken: () => Promise<string | null>) {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token ?? ''}`,
  };
}

export async function listCloudMaps(getToken: () => Promise<string | null>): Promise<CloudMap[]> {
  const res = await fetch('/api/user/maps', { headers: await authHeaders(getToken) });
  if (!res.ok) throw new Error('Failed to load cloud maps');
  return res.json();
}

export async function saveCloudMap(
  getToken: () => Promise<string | null>,
  payload: {
    id?: string;
    name: string;
    nodes: Node<NodeData>[];
    edges: Edge<EdgeData>[];
    canvasWidth: number;
    canvasHeight: number;
    gridLocked: boolean;
  }
): Promise<CloudMap> {
  const res = await fetch('/api/user/maps', {
    method: 'POST',
    headers: await authHeaders(getToken),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save map');
  return res.json();
}

export async function deleteCloudMap(
  getToken: () => Promise<string | null>,
  id: string
): Promise<void> {
  const res = await fetch(`/api/user/maps?id=${id}`, {
    method: 'DELETE',
    headers: await authHeaders(getToken),
  });
  if (!res.ok) throw new Error('Failed to delete map');
}

export async function loadCloudMapData(
  getToken: () => Promise<string | null>,
  id: string
): Promise<{ nodes: Node<NodeData>[]; edges: Edge<EdgeData>[]; name: string; canvasWidth: number; canvasHeight: number; gridLocked: boolean }> {
  const res = await fetch(`/api/user/maps/${id}`, { headers: await authHeaders(getToken) });
  if (!res.ok) throw new Error('Failed to load map');
  return res.json();
}
