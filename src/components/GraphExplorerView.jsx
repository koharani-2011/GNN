import React, { useState, useEffect, useRef } from 'react';
import {
  Network,
  Search,
  Filter,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sliders,
  AlertTriangle,
  ShieldCheck,
  Eye,
  ArrowRight,
  Share2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../api';

export default function GraphExplorerView({
  analysisId,
  initialRootNode,
  onInspectNode,
}) {
  const canvasRef = useRef(null);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState(initialRootNode || '');
  const [rootNode, setRootNode] = useState(initialRootNode || '');
  const [depth, setDepth] = useState(1);
  const [maxNodes, setMaxNodes] = useState(80);
  const [onlySuspicious, setOnlySuspicious] = useState(false);

  // Canvas Viewport transform (Pan & Zoom)
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const nodePositions = useRef(new Map());
  const simulationRef = useRef(null);

  // Fetch graph data
  const fetchGraph = async () => {
    if (!analysisId) return;
    setLoading(true);
    try {
      const params = {
        rootNode: rootNode || undefined,
        depth: depth.toString(),
        maxNodes: maxNodes.toString(),
        onlySuspicious: onlySuspicious ? 'true' : 'false',
      };
      const data = await api.getGraphData(analysisId, params);
      setGraphData(data);
      initPositions(data.nodes, data.edges);
    } catch (err) {
      console.error('Failed to load graph data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [analysisId, rootNode, depth, maxNodes, onlySuspicious]);

  // Initialize node layout positions (Force-directed / Circle layout)
  const initPositions = (nodes, edges) => {
    const width = 800;
    const height = 550;
    const pos = new Map();

    nodes.forEach((n, idx) => {
      // Seed radial coordinates
      const angle = (idx / (nodes.length || 1)) * 2 * Math.PI;
      const radius = 120 + Math.random() * 180;
      pos.set(n.id, {
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        radius: n.isRoot ? 14 : Math.max(7, Math.min(16, (n.inDegree + n.outDegree) * 2 + 5)),
      });
    });

    nodePositions.current = pos;
    runForceLayout(nodes, edges);
  };

  // Simple iterative force-directed spring simulation
  const runForceLayout = (nodes, edges) => {
    if (simulationRef.current) cancelAnimationFrame(simulationRef.current);

    let iterations = 0;
    const maxIterations = 80;
    const nodeMap = nodePositions.current;

    const step = () => {
      // Repulsion between all nodes
      const nodeArr = nodes;
      for (let i = 0; i < nodeArr.length; i++) {
        const u = nodeMap.get(nodeArr[i].id);
        if (!u) continue;
        for (let j = i + 1; j < nodeArr.length; j++) {
          const v = nodeMap.get(nodeArr[j].id);
          if (!v) continue;
          const dx = v.x - u.x;
          const dy = v.y - u.y;
          const dist = Math.sqrt(dx * dy + dy * dy) || 1;
          if (dist < 260) {
            const force = (260 - dist) / dist * 0.08;
            u.x -= dx * force;
            u.y -= dy * force;
            v.x += dx * force;
            v.y += dy * force;
          }
        }
      }

      // Attraction along edges
      edges.forEach((e) => {
        const u = nodeMap.get(e.source);
        const v = nodeMap.get(e.target);
        if (u && v) {
          const dx = v.x - u.x;
          const dy = v.y - u.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - 80) * 0.02;
          u.x += (dx / dist) * force;
          u.y += (dy / dist) * force;
          v.x -= (dx / dist) * force;
          v.y -= (dy / dist) * force;
        }
      });

      iterations++;
      draw();
      if (iterations < maxIterations) {
        simulationRef.current = requestAnimationFrame(step);
      }
    };

    simulationRef.current = requestAnimationFrame(step);
  };

  // Canvas render
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Apply pan & zoom
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);

    const pos = nodePositions.current;

    // Draw Edges
    graphData.edges.forEach((e) => {
      const u = pos.get(e.source);
      const v = pos.get(e.target);
      if (u && v) {
        const isHighlight =
          selectedNode && (e.source === selectedNode.id || e.target === selectedNode.id);
        ctx.beginPath();
        ctx.moveTo(u.x, u.y);
        ctx.lineTo(v.x, v.y);
        ctx.strokeStyle = isHighlight ? 'rgba(99, 102, 241, 0.9)' : 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = isHighlight ? 2.5 : 1;
        ctx.stroke();

        // Edge direction arrow
        const angle = Math.atan2(v.y - u.y, v.x - u.x);
        const targetRadius = v.radius || 10;
        const arrowX = v.x - Math.cos(angle) * targetRadius;
        const arrowY = v.y - Math.sin(angle) * targetRadius;
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX - 7 * Math.cos(angle - Math.PI / 6), arrowY - 7 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(arrowX - 7 * Math.cos(angle + Math.PI / 6), arrowY - 7 * Math.sin(angle + Math.PI / 6));
        ctx.fillStyle = isHighlight ? 'rgba(99, 102, 241, 0.9)' : 'rgba(255, 255, 255, 0.25)';
        ctx.fill();
      }
    });

    // Draw Nodes
    graphData.nodes.forEach((n) => {
      const p = pos.get(n.id);
      if (!p) return;

      const isSelected = selectedNode?.id === n.id;
      const isSuspicious = n.predictedClass === 'Suspicious (Illicit)';
      const isRoot = n.isRoot || n.id === rootNode;

      // Glow ring for selected or root
      if (isSelected || isRoot) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius + 6, 0, 2 * Math.PI);
        ctx.fillStyle = isRoot ? 'rgba(245, 158, 11, 0.3)' : 'rgba(99, 102, 241, 0.4)';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = isRoot ? '#f59e0b' : '#6366f1';
        ctx.stroke();
      }

      // Node body
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);
      ctx.fillStyle = isSuspicious ? '#ef4444' : '#10b981';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = isSuspicious ? '#fca5a5' : '#6ee7b7';
      ctx.stroke();

      // Node Label
      ctx.font = '10px system-ui, sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.textAlign = 'center';
      ctx.fillText(n.label, p.x, p.y + p.radius + 12);
    });

    ctx.restore();
  };

  useEffect(() => {
    draw();
  }, [transform, selectedNode, graphData]);

  // Handle canvas interactions
  const handleMouseDown = (e) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    setTransform((t) => ({
      ...t,
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    }));
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
    setTransform((t) => ({
      ...t,
      k: Math.max(0.2, Math.min(4, t.k * zoomFactor)),
    }));
  };

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - transform.x) / transform.k;
    const mouseY = (e.clientY - rect.top - transform.y) / transform.k;

    // Check hit test on nodes
    let hitNode = null;
    const pos = nodePositions.current;
    for (const n of graphData.nodes) {
      const p = pos.get(n.id);
      if (p) {
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        if (Math.sqrt(dx * dx + dy * dy) <= p.radius + 4) {
          hitNode = n;
          break;
        }
      }
    }

    setSelectedNode(hitNode);
  };

  const handleSearchNode = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setRootNode(searchQuery.trim());
  };

  const resetViewport = () => {
    setTransform({ x: 0, y: 0, k: 1 });
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-80px)]">
      {/* Top Filter & Exploration Toolbar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              Interactive Topology Explorer
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Displayed Subgraph: {graphData.displayedNodesCount || 0} nodes / {graphData.displayedEdgesCount || 0} edges
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search/Ego root */}
          <form onSubmit={handleSearchNode} className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search or isolate Node ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl text-xs text-white pl-8 pr-3 py-1.5 focus:outline-none focus:border-indigo-500 font-mono w-56"
            />
          </form>

          {/* Ego Hop Depth */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
            <span className="text-[10px] text-slate-400 px-2 font-mono">Ego Hops:</span>
            <button
              onClick={() => setDepth(1)}
              className={`px-2 py-0.5 rounded-lg text-xs font-mono ${
                depth === 1 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              1-Hop
            </button>
            <button
              onClick={() => setDepth(2)}
              className={`px-2 py-0.5 rounded-lg text-xs font-mono ${
                depth === 2 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              2-Hop
            </button>
          </div>

          {/* Suspicious Only Toggle */}
          <button
            onClick={() => setOnlySuspicious(!onlySuspicious)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              onlySuspicious
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            Only Suspicious
          </button>

          {rootNode && (
            <button
              onClick={() => {
                setRootNode('');
                setSearchQuery('');
              }}
              className="text-xs text-amber-400 hover:underline font-mono"
            >
              Clear Focal Root
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas + Sidebar Inspector */}
      <div className="flex-1 flex gap-6 min-h-0 relative">
        {/* Graph Canvas Container */}
        <div className="flex-1 bg-slate-950/80 border border-slate-800 rounded-2xl relative overflow-hidden shadow-2xl flex flex-col">
          {loading && (
            <div className="absolute inset-0 bg-slate-950/70 z-10 flex items-center justify-center text-slate-300 text-xs">
              Recalculating graph spring layout...
            </div>
          )}

          <canvas
            ref={canvasRef}
            width={850}
            height={560}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            onClick={handleClick}
            className="w-full h-full cursor-grab active:cursor-grabbing block"
          />

          {/* Floating Viewport Controls */}
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl p-1.5 shadow-lg backdrop-blur-md">
            <button
              onClick={() => setTransform((t) => ({ ...t, k: t.k * 1.2 }))}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTransform((t) => ({ ...t, k: t.k * 0.8 }))}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={resetViewport}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              title="Reset Zoom & Pan"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Graph Legend */}
          <div className="absolute top-4 left-4 bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg backdrop-blur-md text-xs space-y-1.5 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_#ef4444]"></span>
              <span className="text-slate-300">Flagged Illicit / Suspicious</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-slate-300">Licit Flow / Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border-2 border-amber-400 bg-slate-800"></span>
              <span className="text-slate-300">Selected / Focal Ego Node</span>
            </div>
          </div>
        </div>

        {/* Selected Node Inspector Sidebar */}
        <div className="w-80 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between shrink-0 overflow-y-auto text-xs">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                  Selected Transaction Node
                </span>
                <h4 className="font-bold text-sm text-white font-mono break-all mt-0.5">
                  {selectedNode.id}
                </h4>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400">Classification</span>
                  <span
                    className={`font-bold font-mono px-2 py-0.5 rounded text-[11px] ${
                      selectedNode.predictedClass === 'Suspicious (Illicit)'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {selectedNode.predictedClass}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400">GAT Risk Score</span>
                  <span className="font-bold text-white font-mono text-sm">
                    {(selectedNode.riskScore * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400">Confidence</span>
                  <span className="font-bold text-indigo-400 font-mono">
                    {selectedNode.confidence}%
                  </span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400">Graph In/Out Degree</span>
                  <span className="font-mono text-slate-300">
                    {selectedNode.inDegree} in / {selectedNode.outDegree} out
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => setRootNode(selectedNode.id)}
                  className="w-full py-2 px-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Isolate 2-Hop Ego Network
                </button>

                <button
                  onClick={() => onInspectNode(selectedNode.id)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Full Feature Dossier
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
              <Network className="w-10 h-10 text-slate-600 stroke-1" />
              <p className="font-semibold text-slate-400">No Node Selected</p>
              <p className="text-[11px] text-slate-500 max-w-[200px]">
                Click any node in the graph or search by Transaction ID to inspect its local neighborhood and features.
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 font-mono text-center">
            Canvas Force Graph: Pan with click & drag, zoom with scroll wheel.
          </div>
        </div>
      </div>
    </div>
  );
}
