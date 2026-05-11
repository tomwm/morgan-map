import { useState, useEffect, useRef } from 'react';
import { useMapStore } from './store/mapStore';
import { writeAutosave, readAutosave } from './utils/localSaves';
import { WelcomeModal } from './components/Modals/WelcomeModal';
import { MapCanvas } from './components/MapCanvas';
import { MainToolbar } from './components/Toolbar/MainToolbar';
import { NodeDetailPanel } from './components/Panel/NodeDetailPanel';
import { ViewsPanel } from './components/Panel/ViewsPanel';
import { HelpPanel } from './components/Panel/HelpPanel';
// import { RiskInsightsPanel } from './components/Panel/RiskInsightsPanel';
import { CreateNodeModal } from './components/Modals/CreateNodeModal';
import { CreateEdgeModal } from './components/Modals/CreateEdgeModal';

// ---------------------------------------------------------------------------
// Root application component
// ---------------------------------------------------------------------------
export default function App() {
  const [showCreateNodeModal, setShowCreateNodeModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(
    () => !new URLSearchParams(window.location.search).has('resume')
  );

  const activePanel = useMapStore((s) => s.activePanel);
  const selectedEdgeId = useMapStore((s) => s.selectedEdgeId);
  const setActivePanel = useMapStore((s) => s.setActivePanel);
  const triggerFitView = useMapStore((s) => s.triggerFitView);
  const nodes = useMapStore((s) => s.nodes);
  const edges = useMapStore((s) => s.edges);
  const mapName = useMapStore((s) => s.mapName);
  const canvasWidth = useMapStore((s) => s.canvasWidth);
  const canvasHeight = useMapStore((s) => s.canvasHeight);
  const gridLocked = useMapStore((s) => s.gridLocked);
  const importMap = useMapStore((s) => s.importMap);
  const setMapName = useMapStore((s) => s.setMapName);
  const setCanvasSize = useMapStore((s) => s.setCanvasSize);

  // Restore autosave when returning from gallery/viewer
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const params = new URLSearchParams(window.location.search);
    if (params.has('resume')) {
      const saved = readAutosave();
      if (saved && saved.nodes.length > 0) {
        importMap({ nodes: saved.nodes, edges: saved.edges });
        setMapName(saved.name);
        setCanvasSize(saved.canvasWidth, saved.canvasHeight);
        setTimeout(() => triggerFitView(), 150);
      }
    }
  }, []);

  // Autosave whenever the map changes (debounced)
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      writeAutosave({ name: mapName, canvasWidth, canvasHeight, gridLocked, nodes, edges });
    }, 1000);
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
  }, [nodes, edges, mapName, canvasWidth, canvasHeight, gridLocked]);

  // The right-rail panels (node detail, risk insights, views) live here.
  const showRightPanel =
    activePanel === 'node' ||
    activePanel === 'risks' ||
    activePanel === 'views' ||
    activePanel === 'help';

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* ── Top toolbar ──────────────────────────────────────────────── */}
      <MainToolbar
        onAddNode={() => setShowCreateNodeModal(true)}
        onFitView={triggerFitView}
      />

      {/* ── Main workspace ───────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Centre: map canvas */}
        <div className="flex-1 relative min-w-0">
          <MapCanvas />
        </div>

        {/* Right rail: detail panels */}
        {showRightPanel && (
          <div className="flex-shrink-0 h-full overflow-hidden">
            {activePanel === 'node' && <NodeDetailPanel />}
            {activePanel === 'views' && <ViewsPanel />}
            {activePanel === 'help' && <HelpPanel />}
          </div>
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────────────── */}

      {showWelcome && <WelcomeModal onDismiss={() => setShowWelcome(false)} />}

      {/* Create / edit node */}
      {showCreateNodeModal && (
        <CreateNodeModal onClose={() => setShowCreateNodeModal(false)} />
      )}

      {/* Edit relationship — opens when user clicks an edge */}
      {activePanel === 'edge' && selectedEdgeId && (
        <CreateEdgeModal
          onClose={() => setActivePanel('none')}
          editEdgeId={selectedEdgeId}
        />
      )}
    </div>
  );
}
