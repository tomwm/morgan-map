import { useState } from 'react';
import { X, Globe, Copy, Check, ExternalLink, Loader2 } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { savePublishToken } from '../../utils/localSaves';

interface PublishModalProps {
  onClose: () => void;
}

const API_BASE = '/api/maps';

export function PublishModal({ onClose }: PublishModalProps) {
  const mapName = useMapStore((s) => s.mapName);
  const nodes = useMapStore((s) => s.nodes);
  const edges = useMapStore((s) => s.edges);

  const [state, setState] = useState<'confirm' | 'publishing' | 'done' | 'error'>('confirm');
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const shareUrl = publishedId
    ? `${window.location.origin}/view/${publishedId}`
    : '';

  const handlePublish = async () => {
    setState('publishing');
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: mapName, nodes, edges }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPublishedId(data.id);
      if (data.deleteToken) savePublishToken(data.id, data.deleteToken);
      setState('done');
    } catch (e) {
      console.error('Publish failed:', e);
      setState('error');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[440px] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-blue-500" />
            <h2 className="text-sm font-semibold text-gray-800">Publish to gallery</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">

          {state === 'confirm' && (
            <>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                This will publish <span className="font-semibold text-gray-800">"{mapName}"</span> to the public gallery. Anyone with the link will be able to view it in read-only mode.
              </p>
              <div className="bg-gray-50 rounded-xl p-3 mb-5 flex items-center gap-3">
                <div className="text-center px-3 border-r border-gray-200">
                  <div className="text-lg font-bold text-gray-800">{nodes.length}</div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide">nodes</div>
                </div>
                <div className="text-center px-3">
                  <div className="text-lg font-bold text-gray-800">{edges.length}</div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide">edges</div>
                </div>
                <div className="ml-auto text-xs text-gray-500 truncate max-w-[160px]">{mapName}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
                  Cancel
                </button>
                <button onClick={handlePublish} className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors">
                  Publish
                </button>
              </div>
            </>
          )}

          {state === 'publishing' && (
            <div className="flex flex-col items-center py-6 gap-3">
              <Loader2 size={28} className="text-blue-500 animate-spin" />
              <p className="text-sm text-gray-500">Publishing your map…</p>
            </div>
          )}

          {state === 'done' && (
            <>
              <div className="flex flex-col items-center pb-4 gap-2">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-1">
                  <Check size={20} className="text-green-600" />
                </div>
                <p className="text-sm font-semibold text-gray-800">Published!</p>
                <p className="text-xs text-gray-500 text-center">Your map is live in the gallery. Share the link below.</p>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-4">
                <span className="text-xs text-gray-600 flex-1 truncate">{shareUrl}</span>
                <button onClick={handleCopy} className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
                  Close
                </button>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
                >
                  <ExternalLink size={13} />
                  View in gallery
                </a>
              </div>
            </>
          )}

          {state === 'error' && (
            <>
              <p className="text-sm text-red-600 mb-4">Something went wrong. Please try again.</p>
              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
                  Cancel
                </button>
                <button onClick={() => setState('confirm')} className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors">
                  Try again
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
