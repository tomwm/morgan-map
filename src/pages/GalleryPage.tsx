import { useEffect, useState } from 'react';
import { Map, ArrowLeft, Calendar } from 'lucide-react';

function goBackToEditor() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = '/?resume=1';
  }
}
import { MapThumbnail } from '../components/MapThumbnail';

interface PublishedMap {
  id: string;
  name: string;
  node_count: number;
  edge_count: number;
  published_at: string;
  node_positions: { id: string; x: number; y: number; type: string }[];
  edge_positions: { source: string; target: string }[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function GalleryPage() {
  const [maps, setMaps] = useState<PublishedMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/maps')
      .then((r) => r.json())
      .then((data) => { setMaps(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Map size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-gray-800 tracking-tight">Morgan Map</span>
        </div>
        <div className="w-px h-5 bg-gray-200" />
        <h1 className="text-sm font-semibold text-gray-800">Published Maps</h1>
        <div className="flex-1" />
        <button
          onClick={goBackToEditor}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={13} />
          Back to editor
        </button>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center py-24 text-sm text-red-500">
            Failed to load maps. Please try again.
          </div>
        )}

        {!loading && !error && maps.length === 0 && (
          <div className="text-center py-24">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Map size={22} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No maps published yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Open the editor and use File → Publish to gallery to add the first one.
            </p>
          </div>
        )}

        {!loading && !error && maps.length > 0 && (
          <>
            <p className="text-xs text-gray-400 mb-5">{maps.length} map{maps.length !== 1 ? 's' : ''} published</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {maps.map((m) => (
                <a
                  key={m.id}
                  href={`/view/${m.id}`}
                  className="group bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all p-4 flex flex-col gap-3"
                >
                  {/* Map thumbnail */}
                  <div className="w-full h-24 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100 overflow-hidden">
                    <MapThumbnail
                      nodes={m.node_positions ?? []}
                      edges={m.edge_positions ?? []}
                    />
                  </div>

                  {/* Info */}
                  <div>
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 transition-colors leading-snug mb-1">
                      {m.name}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                      <span>{m.node_count} nodes · {m.edge_count} edges</span>
                      <span className="flex items-center gap-1 ml-auto">
                        <Calendar size={10} />
                        {timeAgo(m.published_at)}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
