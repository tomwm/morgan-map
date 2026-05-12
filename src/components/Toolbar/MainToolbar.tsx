import { useRef, useState } from 'react';
import {
  Plus,
  Download,
  Upload,
  Map,
  FilePlus,
  Save,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Check,
  FolderClosed,
  Globe,
  Cloud,
  Image,
  FileType,
  FileText,
  UserRound,
} from 'lucide-react';
import { UserButton, SignInButton, useAuth } from '@clerk/clerk-react';
import { useMapStore, CANVAS_SIZE_PRESETS } from '../../store/mapStore';
import { exportToJSON, importFromJSON } from '../../utils/exportImport';
import { saveMap } from '../../utils/localSaves';
import { saveCloudMap } from '../../utils/cloudSaves';
import { exportAsPng, exportAsSvg, exportAsPdf } from '../../utils/exportCanvas';
import { SavedMapsModal } from '../Modals/SavedMapsModal';
import { PublishModal } from '../Modals/PublishModal';
import { AUTH_ENABLED } from '../Auth/AuthProvider';

interface MainToolbarProps {
  onAddNode: () => void;
  onFitView: () => void;
}

// Shared text-nav item styles — no icons, just words
const navText = 'flex items-center gap-0.5 text-[13px] text-gray-500 hover:text-gray-900 transition-colors px-2 py-1 select-none cursor-pointer whitespace-nowrap';
const navTextActive = 'flex items-center gap-0.5 text-[13px] text-blue-600 hover:text-blue-700 transition-colors px-2 py-1 select-none cursor-pointer whitespace-nowrap';

export function MainToolbar({ onAddNode }: MainToolbarProps) {
  const mapName = useMapStore((s) => s.mapName);
  const setMapName = useMapStore((s) => s.setMapName);
  const nodes = useMapStore((s) => s.nodes);
  const edges = useMapStore((s) => s.edges);
  const activePanel = useMapStore((s) => s.activePanel);
  const setActivePanel = useMapStore((s) => s.setActivePanel);
  const filters = useMapStore((s) => s.filters);
  const importMap = useMapStore((s) => s.importMap);
  const gridLocked = useMapStore((s) => s.gridLocked);
  const canvasWidth = useMapStore((s) => s.canvasWidth);
  const canvasHeight = useMapStore((s) => s.canvasHeight);
  const setCanvasSize = useMapStore((s) => s.setCanvasSize);
  const newMap = useMapStore((s) => s.newMap);
  const cloudMapId = useMapStore((s) => s.cloudMapId);
  const setCloudMapId = useMapStore((s) => s.setCloudMapId);

  const { isSignedIn, getToken } = AUTH_ENABLED
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useAuth()
    : { isSignedIn: false, getToken: async () => null };

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(mapName);
  const [showSavedMaps, setShowSavedMaps] = useState(false);
  const [savedMapsTab, setSavedMapsTab] = useState<'local' | 'cloud'>('local');
  const [showPublish, setShowPublish] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const [cloudSaveFlash, setCloudSaveFlash] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showCanvasMenu, setShowCanvasMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openSavedMaps = (tab: 'local' | 'cloud') => {
    setSavedMapsTab(tab);
    setShowSavedMaps(true);
    setShowFileMenu(false);
  };

  const hasActiveFilters =
    filters.nodeTypes.length > 0 ||
    filters.organisations.length > 0 ||
    filters.tags.length > 0 ||
    filters.criticalityRange[0] > 0 ||
    filters.criticalityRange[1] < 1 ||
    filters.automationRange[0] > 0 ||
    filters.automationRange[1] < 1;

  const handleExportJSON = () => { exportToJSON(mapName, nodes, edges); setShowFileMenu(false); };
  const handleExportPng = () => { exportAsPng(mapName); setShowFileMenu(false); };
  const handleExportSvg = () => { exportAsSvg(mapName); setShowFileMenu(false); };
  const handleExportPdf = () => { exportAsPdf(mapName); setShowFileMenu(false); };

  const handleSaveToCloud = async () => {
    setShowFileMenu(false);
    if (!isSignedIn) { window.location.href = '/sign-in'; return; }
    try {
      const token = await getToken();
      if (!token) return;
      const saved = await saveCloudMap(
        () => Promise.resolve(token),
        { id: cloudMapId ?? undefined, name: mapName, nodes, edges, canvasWidth, canvasHeight, gridLocked }
      );
      setCloudMapId(saved.id);
      setCloudSaveFlash(true);
      setTimeout(() => setCloudSaveFlash(false), 1500);
    } catch {
      alert('Failed to save to cloud. Please try again.');
    }
  };

  const handleImport = async (file: File) => {
    try {
      const data = await importFromJSON(file);
      importMap(data);
      if (data.name) setMapName(data.name);
    } catch (e) {
      console.error('Import failed:', e);
    }
  };

  const handleSave = () => {
    saveMap({ name: mapName, canvasWidth, canvasHeight, gridLocked, nodes, edges });
    setSaveFlash(true);
    setShowFileMenu(false);
    setTimeout(() => setSaveFlash(false), 1500);
  };

  const handleNewMap = () => {
    if (nodes.length > 0 && !window.confirm('Start a new map? Unsaved changes will be lost.')) return;
    newMap();
    setShowFileMenu(false);
  };

  const togglePanel = (panel: typeof activePanel) => {
    setActivePanel(activePanel === panel ? 'none' : panel);
  };

  return (
    <>
    <div className="flex items-center h-12 px-4 bg-white border-b border-gray-200 gap-2 flex-shrink-0 relative z-50">

      {/* Logo */}
      <div className="flex items-center gap-2 flex-shrink-0 mr-1">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Map size={14} className="text-white" />
        </div>
        <span className="text-sm font-bold text-gray-800 tracking-tight hidden sm:block">Morgan Map</span>
      </div>

      <div className="w-px h-4 bg-gray-200 flex-shrink-0" />

      {/* Map name */}
      <div className="flex items-center gap-2 min-w-0 flex-shrink">
        {editingName ? (
          <input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={() => { setMapName(nameDraft || mapName); setEditingName(false); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { setMapName(nameDraft || mapName); setEditingName(false); }
              if (e.key === 'Escape') setEditingName(false);
            }}
            className="text-sm font-medium text-gray-700 border border-blue-300 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-100 w-48 min-w-0"
          />
        ) : (
          <button
            onClick={() => { setNameDraft(mapName); setEditingName(true); }}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 rounded px-1 py-0.5 transition-colors truncate max-w-[180px]"
            title={`${mapName} — click to rename`}
          >
            {mapName}
          </button>
        )}
      </div>

      {/* Push nav to the right */}
      <div className="flex-1" />

      {/* ── Primary action ── */}
      <button
        onClick={onAddNode}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex-shrink-0"
      >
        <Plus size={13} />
        <span className="hidden sm:inline">Add Node</span>
        <span className="sm:hidden">Add</span>
      </button>

      <div className="w-px h-4 bg-gray-200 flex-shrink-0" />

      {/* ── Text nav ── */}
      <div className="flex items-center gap-0.5 flex-shrink-0">

        {/* Canvas Size */}
        <div className="relative">
          <button
            onClick={() => setShowCanvasMenu((v) => !v)}
            className={showCanvasMenu ? navTextActive : navText}
          >
            Canvas
            <ChevronDown size={10} className={`transition-transform ${showCanvasMenu ? 'rotate-180' : ''}`} />
          </button>
          {showCanvasMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowCanvasMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1 overflow-hidden">
                {CANVAS_SIZE_PRESETS.map((p) => {
                  const isActive = canvasWidth === p.w && canvasHeight === p.h;
                  return (
                    <button
                      key={`${p.w}x${p.h}`}
                      onClick={() => { setCanvasSize(p.w, p.h); setShowCanvasMenu(false); }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs transition-colors ${
                        isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{p.label}</span>
                      {isActive && <Check size={11} />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Filters */}
        <button
          onClick={() => togglePanel('views')}
          className={activePanel === 'views' ? navTextActive : navText}
        >
          Filters
          {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 ml-0.5" />}
        </button>

        {/* File */}
        <div className="relative">
          <button
            onClick={() => setShowFileMenu((v) => !v)}
            className={showFileMenu ? navTextActive : `${navText} ${(saveFlash || cloudSaveFlash) ? '!text-green-600' : ''}`}
          >
            {(saveFlash || cloudSaveFlash) ? 'Saved!' : 'File'}
            <ChevronDown size={10} className={`transition-transform ${showFileMenu ? 'rotate-180' : ''}`} />
          </button>
          {showFileMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowFileMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1 overflow-visible">

                <button onClick={handleNewMap} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                  <FilePlus size={13} className="text-gray-400" />New
                </button>

                <div className="my-1 border-t border-gray-100" />

                <button onClick={() => openSavedMaps('local')} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                  <FolderOpen size={13} className="text-gray-400" />Open…
                </button>

                <div className="relative group/save">
                  <button className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                    <span className="flex items-center gap-2.5"><Save size={13} className="text-gray-400" />Save</span>
                    <ChevronRight size={11} className="text-gray-400" />
                  </button>
                  <div className="absolute left-full top-0 -mt-1 ml-0.5 hidden group-hover/save:block w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-40">
                    <button onClick={handleSave} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                      <FolderClosed size={13} className="text-gray-400" />Locally
                    </button>
                    {AUTH_ENABLED && (
                      <button onClick={handleSaveToCloud} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                        <Cloud size={13} className={isSignedIn ? 'text-blue-400' : 'text-gray-400'} />
                        {isSignedIn ? 'To cloud' : 'To cloud (sign in)'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="my-1 border-t border-gray-100" />

                <button onClick={() => { fileInputRef.current?.click(); setShowFileMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                  <Upload size={13} className="text-gray-400" />Import JSON
                </button>

                <div className="relative group/export">
                  <button className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                    <span className="flex items-center gap-2.5"><Download size={13} className="text-gray-400" />Export</span>
                    <ChevronRight size={11} className="text-gray-400" />
                  </button>
                  <div className="absolute left-full top-0 -mt-1 ml-0.5 hidden group-hover/export:block w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-40">
                    <button onClick={handleExportPng} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                      <Image size={13} className="text-gray-400" />PNG
                    </button>
                    <button onClick={handleExportSvg} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                      <FileType size={13} className="text-gray-400" />SVG
                    </button>
                    <button onClick={handleExportPdf} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                      <FileText size={13} className="text-gray-400" />PDF
                    </button>
                    <div className="my-1 border-t border-gray-100" />
                    <button onClick={handleExportJSON} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                      <Download size={13} className="text-gray-400" />JSON
                    </button>
                  </div>
                </div>

                <div className="my-1 border-t border-gray-100" />

                <button onClick={() => { setShowPublish(true); setShowFileMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                  <Globe size={13} className="text-blue-400" />Publish to gallery
                </button>
              </div>
            </>
          )}
        </div>

        {/* Guide */}
        <button
          onClick={() => togglePanel('help')}
          className={activePanel === 'help' ? navTextActive : navText}
        >
          Guide
        </button>

        {/* Gallery */}
        <a
          href="/gallery"
          onClick={() => history.replaceState(null, '', '/?resume=1')}
          className={navText}
        >
          Gallery
        </a>

      </div>

      <div className="w-px h-4 bg-gray-200 flex-shrink-0" />

      {/* ── Auth circle ── */}
      {AUTH_ENABLED ? (
        isSignedIn
          ? <UserButton afterSignOutUrl="/" />
          : <SignInButton mode="modal">
              <button
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
                title="Sign in"
              >
                <UserRound size={15} className="text-gray-500" />
              </button>
            </SignInButton>
      ) : (
        /* Placeholder circle when auth not configured */
        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <UserRound size={15} className="text-gray-300" />
        </div>
      )}

    </div>

    <input
      ref={fileInputRef}
      type="file"
      accept=".json"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleImport(file);
        e.target.value = '';
      }}
    />

    {showSavedMaps && <SavedMapsModal onClose={() => setShowSavedMaps(false)} initialTab={savedMapsTab} />}
    {showPublish && <PublishModal onClose={() => setShowPublish(false)} />}
    </>
  );
}
