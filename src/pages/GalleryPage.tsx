import { useEffect, useState } from 'react';
import { Map, Calendar, Trash2, LogIn } from 'lucide-react';
import { UserButton, SignInButton, useAuth } from '@clerk/clerk-react';
import { getPublishToken, removePublishToken } from '../utils/localSaves';
import { MapThumbnail } from '../components/MapThumbnail';
import { AUTH_ENABLED } from '../components/Auth/AuthProvider';


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
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { isSignedIn } = AUTH_ENABLED ? useAuth() : { isSignedIn: false };

  const [maps, setMaps] = useState<PublishedMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/maps')
      .then((r) => r.json())
      .then((data) => { setMaps(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  const handleDelete = async (e: React.MouseEvent, mapId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const token = getPublishToken(mapId);
    if (!token) return;
    if (!confirm('Remove this map from the gallery?')) return;
    setDeletingId(mapId);
    try {
      const res = await fetch(`/api/maps/${mapId}?token=${token}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      removePublishToken(mapId);
      setMaps((prev) => prev.filter((m) => m.id !== mapId));
    } catch {
      alert('Failed to delete map. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Map size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-gray-800 tracking-tight">Morgan Map</span>
        </a>
        <div className="w-px h-5 bg-gray-200" />
        <h1 className="text-sm font-semibold text-gray-800">Published Maps</h1>
        <div className="flex-1" />

        {AUTH_ENABLED && (
          isSignedIn
            ? <UserButton afterSignOutUrl="/gallery" />
            : <SignInButton mode="modal">
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
                  <LogIn size={13} />
                  Sign in
                </button>
              </SignInButton>
        )}
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
              {maps.map((m) => {
                const canDelete = !!getPublishToken(m.id);
                const isDeleting = deletingId === m.id;
                return (
                  <div key={m.id} className="relative group">
                    <a
                      href={`/view/${m.id}`}
                      className="block bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all p-4 flex flex-col gap-3"
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

                    {/* Delete button — only shown if user published this map */}
                    {canDelete && (
                      <button
                        onClick={(e) => handleDelete(e, m.id)}
                        disabled={isDeleting}
                        className="absolute top-3 right-3 p-1.5 rounded-lg bg-white border border-gray-200 text-gray-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                        title="Remove from gallery"
                      >
                        {isDeleting
                          ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                          : <Trash2 size={13} />
                        }
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
