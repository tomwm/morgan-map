import { Node, Edge } from 'reactflow';
import { NodeData, EdgeData } from '../types';

const STORAGE_KEY = 'morgan-map:saves';
const AUTOSAVE_KEY = 'morgan-map:autosave';

export interface AutosaveData {
  name: string;
  canvasWidth: number;
  canvasHeight: number;
  gridLocked: boolean;
  nodes: Node<NodeData>[];
  edges: Edge<EdgeData>[];
}

// ── Publish tokens ────────────────────────────────────────────────────────
// Stored as { [mapId]: deleteToken } so users can delete maps they published.

const PUBLISH_TOKENS_KEY = 'morgan-map:publish-tokens';

function readPublishTokens(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PUBLISH_TOKENS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function savePublishToken(mapId: string, token: string): void {
  const tokens = readPublishTokens();
  tokens[mapId] = token;
  localStorage.setItem(PUBLISH_TOKENS_KEY, JSON.stringify(tokens));
}

export function getPublishToken(mapId: string): string | null {
  return readPublishTokens()[mapId] ?? null;
}

export function removePublishToken(mapId: string): void {
  const tokens = readPublishTokens();
  delete tokens[mapId];
  localStorage.setItem(PUBLISH_TOKENS_KEY, JSON.stringify(tokens));
}

// ── Autosave ──────────────────────────────────────────────────────────────

export function writeAutosave(data: AutosaveData): void {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
  } catch {
    // storage full — ignore
  }
}

export function readAutosave(): AutosaveData | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AutosaveData;
  } catch {
    return null;
  }
}

export interface SavedMap {
  id: string;
  name: string;
  savedAt: string; // ISO string
  canvasWidth: number;
  canvasHeight: number;
  gridLocked: boolean;
  nodeCount: number;
  edgeCount: number;
  nodes: Node<NodeData>[];
  edges: Edge<EdgeData>[];
}

export function listSavedMaps(): SavedMap[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedMap[];
  } catch {
    return [];
  }
}

export function saveMap(map: Omit<SavedMap, 'id' | 'savedAt' | 'nodeCount' | 'edgeCount'>): SavedMap {
  const saves = listSavedMaps();
  // Replace existing save with same name, or append
  const existing = saves.findIndex((s) => s.name === map.name);
  const entry: SavedMap = {
    ...map,
    id: existing >= 0 ? saves[existing].id : `map_${Date.now()}`,
    savedAt: new Date().toISOString(),
    nodeCount: map.nodes.length,
    edgeCount: map.edges.length,
  };
  if (existing >= 0) {
    saves[existing] = entry;
  } else {
    saves.unshift(entry);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
  return entry;
}

export function deleteSavedMap(id: string): void {
  const saves = listSavedMaps().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
}

export function formatSavedAt(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
