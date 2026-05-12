import { useEffect, useState } from 'react';
import { Map, Copy, Check, LayoutGrid, Trash2, LogIn, Pencil } from 'lucide-react';
import { UserButton, SignInButton, useAuth } from '@clerk/clerk-react';
import { useMapStore } from '../store/mapStore';
import { MapCanvas } from '../components/MapCanvas';
import { NodeDetailPanel } from '../components/Panel/NodeDetailPanel';
import { ViewsPanel } from '../components/Panel/ViewsPanel';
import { HelpPanel } from '../components/Panel/HelpPanel';
import { getPublishToken, removePublishToken } from '../utils/localSaves';
import { AUTH_ENABLED } from '../components/Auth/AuthProvider';

interface ViewerAppProps {
  mapId: string;
}

export function ViewerApp({ mapId }: ViewerAppProps) {
  const importMap = useMapStore((s) => s.importMap);
  const setMapName = useMapStore((s) => s.setMapName);
  const triggerFitView = useMapStore((s) => s.triggerFitView);
  const activePanel = useMapStore((s) => s.activePanel);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { isSignedIn } = AUTH_ENABLED ? useAuth() : { isSignedIn: false };

  const [mapName, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canDelete = !!getPublishToken(mapId);

  useEffect(() => {
    fetch(`/api/maps/${mapId}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => {
        importMap({ nodes: data.nodes, edges: data.edges });
        setMapName(data.name);
        setName(data.name);
        setLoading(false);
        setTimeout(() => triggerFitView(), 150);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [mapId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    const token = getPublishToken(mapId);
    if (!token) return;
    if (!confirm('Remove this map from the gallery? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/maps/${mapId}?token=${token}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      removePublishToken(mapId);
      window.location.href = '/gallery';
    } catch {
      alert('Failed to delete map. Please try again.');
      setDeleting(false);
    }
  };

  const showRightPanel =
    activePanel === 'node' || activePanel === 'views' || activePanel === 'help';

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 flex-col gap-3">
        <p className="text-sm font-medium text-gray-600">Map not found</p>
        <a href="/gallery" className="text-xs text-blue-600 hover:underline">
          Back to gallery
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">

      {/* Viewer toolbar */}
      <div className="flex items-center h-14 px-4 bg-white border-b border-gray-200 gap-3 flex-shrink-0 z-10">
        {/* Brand — links to editor */}
        <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Map size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-gray-800 tracking-tight">Morgan Map</span>
        </a>

        <div className="w-px h-5 bg-gray-200" />

        <span className="text-sm font-medium text-gray-700">{mapName}</span>

        <span className="text-[11px] bg-amber-50 border border-amber-100 text-amber-600 rounded-full px-2 py-0.5 font-medium">
          Read only
        </span>

        <div className="flex-1" />

        {/* Owner-only actions */}
        {canDelete && (
          <>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
              title="Remove from gallery"
            >
              {deleting
                ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                : <Trash2 size={13} />
              }
              {deleting ? 'Deleting…' : 'Delete'}
            </button>

            <a
              href="/?resume=1"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
              title="Open this map in the editor"
            >
              <Pencil size={13} />
              Edit
            </a>
          </>
        )}

        {/* Always-visible actions */}
        <a
          href="/gallery"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
        >
          <LayoutGrid size={13} />
          Gallery
        </a>

        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
        >
          {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
          {copied ? 'Copied!' : 'Copy link'}
        </button>

        {/* Auth */}
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

      {/* Map + panels */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 relative min-w-0">
          <MapCanvas readOnly />
        </div>
        {showRightPanel && (
          <div className="flex-shrink-0 h-full overflow-hidden">
            {activePanel === 'node' && <NodeDetailPanel readOnly />}
            {activePanel === 'views' && <ViewsPanel />}
            {activePanel === 'help' && <HelpPanel />}
          </div>
        )}
      </div>
    </div>
  );
}
