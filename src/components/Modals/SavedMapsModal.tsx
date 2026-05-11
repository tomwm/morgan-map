import { useState, useEffect } from 'react';
import { X, FolderOpen, Trash2, Clock, Database, BookOpen, Star, Globe, Calendar } from 'lucide-react';
import { listSavedMaps, deleteSavedMap, formatSavedAt, SavedMap, getPublishToken, removePublishToken } from '../../utils/localSaves';
import { useMapStore } from '../../store/mapStore';
import { SEED_NODES, SEED_EDGES } from '../../data/seedData';

interface PublishedMap {
  id: string;
  name: string;
  node_count: number;
  node_positions: { id: string; x: number; y: number; type: string }[];
  edge_positions: { source: string; target: string }[];
  edge_count: number;
  published_at: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days < 30 ? `${days}d ago` : new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

interface SavedMapsModalProps {
  onClose: () => void;
}

export function SavedMapsModal({ onClose }: SavedMapsModalProps) {
  const [tab, setTab] = useState<'local' | 'published'>('local');
  const [saves, setSaves] = useState<SavedMap[]>([]);
  const [published, setPublished] = useState<PublishedMap[]>([]);
  const [publishedLoading, setPublishedLoading] = useState(false);
  const importMap = useMapStore((s) => s.importMap);
  const setMapName = useMapStore((s) => s.setMapName);
  const setCanvasSize = useMapStore((s) => s.setCanvasSize);
  const triggerFitView = useMapStore((s) => s.triggerFitView);

  useEffect(() => {
    setSaves(listSavedMaps());
  }, []);

  useEffect(() => {
    if (tab === 'published' && published.length === 0) {
      setPublishedLoading(true);
      fetch('/api/maps')
        .then((r) => r.json())
        .then((data) => { setPublished(data); setPublishedLoading(false); })
        .catch(() => setPublishedLoading(false));
    }
  }, [tab]);

  const handleLoad = (save: SavedMap) => {
    importMap({ nodes: save.nodes, edges: save.edges });
    setMapName(save.name);
    setCanvasSize(save.canvasWidth ?? 1200, save.canvasHeight ?? 900);
    setTimeout(() => triggerFitView(), 100);
    onClose();
  };

  const handleLoadExample = () => {
    importMap({ nodes: SEED_NODES, edges: SEED_EDGES });
    setMapName('Universal Credit Claim Journey');
    setTimeout(() => triggerFitView(), 100);
    onClose();
  };

  const handleDelete = (id: string) => {
    deleteSavedMap(id);
    setSaves(listSavedMaps());
  };

  const handleDeletePublished = async (mapId: string) => {
    const token = getPublishToken(mapId);
    if (!token) return;
    try {
      const res = await fetch(`/api/maps/${mapId}?token=${token}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      removePublishToken(mapId);
      setPublished((prev) => prev.filter((m) => m.id !== mapId));
    } catch {
      alert('Failed to delete map. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[480px] max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-gray-800">Open Map</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-5">
          <button
            onClick={() => setTab('local')}
            className={`flex items-center gap-1.5 px-1 py-3 text-xs font-medium border-b-2 transition-colors mr-5 ${tab === 'local' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Database size={12} />
            Saved locally
          </button>
          <button
            onClick={() => setTab('published')}
            className={`flex items-center gap-1.5 px-1 py-3 text-xs font-medium border-b-2 transition-colors ${tab === 'published' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Globe size={12} />
            Published
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* ── Published tab ── */}
          {tab === 'published' && (
            <>
              {publishedLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!publishedLoading && published.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Globe size={28} className="text-gray-200 mb-3" />
                  <p className="text-sm font-medium text-gray-400">No published maps yet</p>
                  <p className="text-xs text-gray-300 mt-1">Use File → Publish to gallery to share your map.</p>
                </div>
              )}
              {!publishedLoading && published.length > 0 && (
                <div className="flex flex-col gap-2">
                  {published.map((m) => {
                    const canDelete = !!getPublishToken(m.id);
                    return (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 group transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{m.name}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[11px] text-gray-400">{m.node_count} nodes · {m.edge_count} edges</span>
                            <span className="flex items-center gap-1 text-[11px] text-gray-400 ml-auto">
                              <Calendar size={10} />
                              {timeAgo(m.published_at)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          {canDelete && (
                            <button
                              onClick={() => handleDeletePublished(m.id)}
                              className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                              title="Delete from gallery"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                          <a
                            href={`/view/${m.id}`}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            <FolderOpen size={11} />
                            Open
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ── Local tab ── */}
          {tab === 'local' && (<>

          {/* Examples */}
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">Examples</p>
            <div
              className="flex items-center gap-3 p-3 rounded-xl border border-blue-100 bg-blue-50/60 hover:border-blue-300 hover:bg-blue-50 group transition-all cursor-pointer"
              onClick={handleLoadExample}
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <BookOpen size={14} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">Universal Credit Claim Journey</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[11px] text-gray-500">20 nodes · 22 edges</p>
                  <span className="flex items-center gap-0.5 text-[10px] font-semibold text-blue-600 bg-blue-100 rounded-full px-1.5 py-0.5">
                    <Star size={8} className="fill-blue-600" />
                    Default example
                  </span>
                </div>
              </div>
              <button className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors opacity-0 group-hover:opacity-100">
                <FolderOpen size={11} />
                Open
              </button>
            </div>
          </div>

          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">Your saved maps</p>

          {saves.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen size={32} className="text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-400">No saved maps yet</p>
              <p className="text-xs text-gray-300 mt-1">
                Use the Save button in the toolbar to save your current map
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {saves.map((save) => (
                <div
                  key={save.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/40 group transition-all"
                >
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{save.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <Clock size={10} />
                        {formatSavedAt(save.savedAt)}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {save.nodeCount} nodes · {save.edgeCount} edges
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDelete(save.id)}
                      className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      onClick={() => handleLoad(save)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      <FolderOpen size={11} />
                      Open
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          </>)}
        </div>

        {/* Footer note */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-[11px] text-gray-400">
            Maps are saved in your browser's local storage. They'll persist across sessions
            but are tied to this browser. Use Export to share or back up a map as a file.
          </p>
        </div>
      </div>
    </div>
  );
}
