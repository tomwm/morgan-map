import { useState } from 'react';
import { Map, Trash2, LogIn, Loader2, AlertCircle } from 'lucide-react';

interface PublishedMap {
  id: string;
  name: string;
  node_count: number;
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
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [maps, setMaps] = useState<PublishedMap[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(false);
    try {
      const res = await fetch('/api/admin/maps', { headers });
      if (!res.ok) { setAuthError(true); return; }
      const data = await res.json();
      setMaps(data);
      setAuthed(true);
    } catch {
      setAuthError(true);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this map from the gallery? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/maps?id=${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error();
      setMaps((prev) => prev.filter((m) => m.id !== id));
    } catch {
      alert('Delete failed. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Map size={14} className="text-white" />
        </div>
        <span className="text-sm font-bold text-gray-800 tracking-tight">Morgan Map</span>
        <div className="w-px h-5 bg-gray-200" />
        <span className="text-sm font-semibold text-gray-600">Admin</span>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Password gate */}
        {!authed && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-sm mx-auto mt-16">
            <h1 className="text-sm font-semibold text-gray-800 mb-1">Admin access</h1>
            <p className="text-xs text-gray-400 mb-5">Enter your admin password to manage published maps.</p>
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoFocus
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              />
              {authError && (
                <div className="flex items-center gap-1.5 text-xs text-red-500">
                  <AlertCircle size={12} />
                  Incorrect password
                </div>
              )}
              <button
                type="submit"
                disabled={!password || authLoading}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {authLoading ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                Sign in
              </button>
            </form>
          </div>
        )}

        {/* Map list */}
        {authed && (
          <>
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-sm font-semibold text-gray-800">Published maps</h1>
              <span className="text-xs text-gray-400">{maps.length} total</span>
            </div>

            {maps.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-16">No published maps.</p>
            )}

            <div className="flex flex-col gap-2">
              {maps.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3 group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{m.name}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {m.node_count} nodes · {m.edge_count} edges · {timeAgo(m.published_at)}
                      <span className="ml-2 font-mono text-gray-300">{m.id}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={`/view/${m.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      View
                    </a>
                    <button
                      onClick={() => handleDelete(m.id)}
                      disabled={deletingId === m.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors"
                    >
                      {deletingId === m.id
                        ? <Loader2 size={12} className="animate-spin" />
                        : <Trash2 size={12} />
                      }
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
