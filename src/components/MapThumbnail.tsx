interface NodePos { id: string; x: number; y: number; type: string }
interface EdgePos { source: string; target: string }

interface MapThumbnailProps {
  nodes: NodePos[];
  edges: EdgePos[];
  width?: number;
  height?: number;
}

const TYPE_COLOURS: Record<string, string> = {
  decision:  '#f59e0b',
  evidence:  '#14b8a6',
  execution: '#7c3aed',
  interface: '#3b82f6',
};

export function MapThumbnail({ nodes, edges, width = 320, height = 96 }: MapThumbnailProps) {
  if (!nodes?.length) return null;

  // Compute bounding box of all node positions
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const pad = 12;
  const scaleX = (maxX - minX) > 0 ? (width  - pad * 2) / (maxX - minX) : 1;
  const scaleY = (maxY - minY) > 0 ? (height - pad * 2) / (maxY - minY) : 1;
  const scale  = Math.min(scaleX, scaleY);

  // Centre the graph within the thumbnail
  const scaledW = (maxX - minX) * scale;
  const scaledH = (maxY - minY) * scale;
  const offsetX = (width  - scaledW) / 2;
  const offsetY = (height - scaledH) / 2;

  const project = (x: number, y: number) => ({
    cx: offsetX + (x - minX) * scale,
    cy: offsetY + (y - minY) * scale,
  });

  // Build a lookup for edge endpoints
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  const r = Math.max(3, Math.min(6, scale * 10));

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full"
    >
      {/* Edges */}
      {edges?.map((e, i) => {
        const src = nodeMap[e.source];
        const tgt = nodeMap[e.target];
        if (!src || !tgt) return null;
        const s = project(src.x, src.y);
        const t = project(tgt.x, tgt.y);
        return (
          <line
            key={i}
            x1={s.cx} y1={s.cy}
            x2={t.cx} y2={t.cy}
            stroke="#cbd5e1"
            strokeWidth={1}
            strokeOpacity={0.6}
          />
        );
      })}

      {/* Nodes */}
      {nodes.map((n) => {
        const { cx, cy } = project(n.x, n.y);
        const colour = TYPE_COLOURS[n.type] ?? '#94a3b8';
        return (
          <circle
            key={n.id}
            cx={cx}
            cy={cy}
            r={r}
            fill={colour}
            fillOpacity={0.85}
          />
        );
      })}
    </svg>
  );
}
