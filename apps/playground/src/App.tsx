import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  RaidCanvas,
  type RaidCanvasHandle,
  type RaidNodeData,
  type RaidEdgeData,
} from '@dr2rai/raid-canvas';
import { PRESETS } from './presets';
import { StencilDrawer } from './components/StencilDrawer';
import { PropertyInspector, type SelectedEntityData } from './components/PropertyInspector';
import { StudioToolbar } from './components/StudioToolbar';

export const App: React.FC = () => {
  const canvasRef = useRef<RaidCanvasHandle | null>(null);

  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESETS[0]!.id);
  const currentPreset = useMemo(
    () => PRESETS.find((p) => p.id === selectedPresetId) ?? PRESETS[0]!,
    [selectedPresetId],
  );

  const [svg, setSvg] = useState<string>(currentPreset.svg);
  const [readOnly, setReadOnly] = useState<boolean>(false);
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntityData | null>(null);
  const [activeTab, setActiveTab] = useState<'inspector' | 'svg' | 'metamodel'>('inspector');
  const [copied, setCopied] = useState<boolean>(false);
  const [stencilCollapsed, setStencilCollapsed] = useState<boolean>(false);
  const [routingMode, setRoutingMode] = useState<'manhattan' | 'normal' | 'smooth'>('manhattan');

  // Undo / Redo SVG Snapshot History
  const [history, setHistory] = useState<string[]>([currentPreset.svg]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const target = PRESETS.find((p) => p.id === presetId);
    if (target) {
      setSvg(target.svg);
      setSelectedEntity(null);
      setHistory([target.svg]);
      setHistoryIndex(0);
    }
  };

  const handleCanvasChange = (updatedSvg: string) => {
    if (updatedSvg === svg) return;
    setSvg(updatedSvg);

    setHistory((prev) => {
      const truncated = prev.slice(0, historyIndex + 1);
      return [...truncated, updatedSvg];
    });
    setHistoryIndex((prev) => prev + 1);

    // Refresh selected entity data if active
    if (selectedEntity) {
      refreshSelectedEntity(selectedEntity.id);
    }
  };

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    const targetIndex = historyIndex - 1;
    const targetSvg = history[targetIndex]!;
    setHistoryIndex(targetIndex);
    setSvg(targetSvg);
    setSelectedEntity(null);
  }, [canUndo, history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    const targetIndex = historyIndex + 1;
    const targetSvg = history[targetIndex]!;
    setHistoryIndex(targetIndex);
    setSvg(targetSvg);
    setSelectedEntity(null);
  }, [canRedo, history, historyIndex]);

  const refreshSelectedEntity = (id: string) => {
    const graph = canvasRef.current?.getGraph();
    if (!graph) return;
    const cell = graph.getCellById(id);
    if (!cell) {
      setSelectedEntity(null);
      return;
    }

    if (cell.isNode()) {
      const nodeData = (cell.getData() ?? {}) as Partial<RaidNodeData>;
      setSelectedEntity({
        id,
        type: 'node',
        nodeData: {
          ...nodeData,
          displayName:
            nodeData.displayName ??
            (cell.getAttrByPath('label/text') as string) ??
            (cell.getAttrByPath('title/text') as string) ??
            id,
          bounds: {
            x: cell.getPosition().x,
            y: cell.getPosition().y,
            width: cell.getSize().width,
            height: cell.getSize().height,
          },
        },
      });
    } else if (cell.isEdge()) {
      const edgeData = (cell.getData() ?? {}) as Partial<RaidEdgeData>;
      setSelectedEntity({
        id,
        type: 'edge',
        edgeData: {
          ...edgeData,
          sourceId: cell.getSourceCellId(),
          targetId: cell.getTargetCellId(),
          sourcePort: cell.getSourcePortId() ?? edgeData.sourcePort,
          targetPort: cell.getTargetPortId() ?? edgeData.targetPort,
          routing: edgeData.routing,
          label:
            edgeData.label ??
            (cell.getLabels()?.[0]?.attrs?.['text']?.['text'] as string) ??
            '',
        },
      });
    }
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    if (selectedIds.length === 0 || !selectedIds[0]) {
      setSelectedEntity(null);
      return;
    }
    const id = selectedIds[0];
    refreshSelectedEntity(id);
    setActiveTab('inspector');
  };

  // Keyboard shortcut listener (Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleUndo, handleRedo]);

  // Export Suite Handlers
  const handleCopySvg = () => {
    navigator.clipboard.writeText(svg);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownloadSvg = () => {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentPreset.id || 'aoaim-diagram'}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPng = () => {
    const img = new Image();
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `${currentPreset.id || 'aoaim-diagram'}.png`;
        a.click();
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  // Quick parser to extract summary facts
  const summaryFacts = useMemo(() => {
    const nodeMatches = svg.match(/aim-node="true"/g) ?? [];
    const edgeMatches = svg.match(/aim-edge="true"/g) ?? [];
    const bendMatches = svg.match(/aim-bends="([^"]+)"/g) ?? [];
    return {
      nodeCount: nodeMatches.length,
      edgeCount: edgeMatches.length,
      bendCount: bendMatches.length,
    };
  }, [svg]);

  const handleChangeRoutingMode = (mode: 'manhattan' | 'normal' | 'smooth') => {
    setRoutingMode(mode);
    canvasRef.current?.setRoutingMode(mode, true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F8FAFC' }}>
      {/* Studio Header & Top Toolbar */}
      <StudioToolbar
        presets={PRESETS}
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onDeleteSelected={() => canvasRef.current?.deleteSelection()}
        onClear={() => canvasRef.current?.clear()}
        onCenter={() => canvasRef.current?.center()}
        onFit={() => canvasRef.current?.zoomToFit()}
        onDownloadSvg={handleDownloadSvg}
        onExportPng={handleExportPng}
        onCopySvg={handleCopySvg}
        copied={copied}
        routingMode={routingMode}
        onChangeRoutingMode={handleChangeRoutingMode}
        readOnly={readOnly}
        onToggleReadOnly={setReadOnly}
      />

      {/* Main 3-Column IDE Layout */}
      <main style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Column: AOAIM Stencil Drawer (Drag-and-Drop Palette) */}
        <StencilDrawer
          onAddNode={(kind) => canvasRef.current?.addNode(kind)}
          collapsed={stencilCollapsed}
          onToggleCollapse={() => setStencilCollapsed((c) => !c)}
        />

        {/* Center Column: Interactive Visual Canvas */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            background: '#FFFFFF',
          }}
        >
          {/* Sub-header status strip */}
          <div
            style={{
              padding: '6px 16px',
              background: '#F8FAFC',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '11px',
              color: '#64748B',
            }}
          >
            <span>
              <strong>Active Model:</strong> {currentPreset.name} • {readOnly ? 'Viewer Mode' : 'Direct Manipulation (Anti-Entropy Wiring Enabled)'}
            </span>
            <span>
              {summaryFacts.nodeCount} Nodes • {summaryFacts.edgeCount} Edges
            </span>
          </div>

          {/* Canvas Host */}
          <div style={{ flex: 1, position: 'relative' }}>
            <RaidCanvas
              ref={canvasRef}
              svg={svg}
              readOnly={readOnly}
              defaultRouting={routingMode}
              onChange={handleCanvasChange}
              onSelectionChange={handleSelectionChange}
            />
          </div>
        </div>

        {/* Right Column: Multi-tab Drawer (Inspector, Live SVG, Metamodel Facts) */}
        <div
          style={{
            width: 360,
            display: 'flex',
            flexDirection: 'column',
            background: '#0F172A',
            color: '#F8FAFC',
            borderLeft: '1px solid #1E293B',
          }}
        >
          {/* Tab Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid #334155',
              background: '#1E293B',
            }}
          >
            <button
              onClick={() => setActiveTab('inspector')}
              style={{
                flex: 1,
                padding: '10px 8px',
                fontSize: '12px',
                fontWeight: '600',
                border: 'none',
                background: activeTab === 'inspector' ? '#0F172A' : 'transparent',
                color: activeTab === 'inspector' ? '#38BDF8' : '#94A3B8',
                cursor: 'pointer',
                borderBottom: activeTab === 'inspector' ? '2px solid #38BDF8' : 'none',
              }}
            >
              Inspector {selectedEntity ? `(${selectedEntity.id})` : ''}
            </button>
            <button
              onClick={() => setActiveTab('svg')}
              style={{
                flex: 1,
                padding: '10px 8px',
                fontSize: '12px',
                fontWeight: '600',
                border: 'none',
                background: activeTab === 'svg' ? '#0F172A' : 'transparent',
                color: activeTab === 'svg' ? '#38BDF8' : '#94A3B8',
                cursor: 'pointer',
                borderBottom: activeTab === 'svg' ? '2px solid #38BDF8' : 'none',
              }}
            >
              Live aim-* SVG
            </button>
            <button
              onClick={() => setActiveTab('metamodel')}
              style={{
                flex: 1,
                padding: '10px 8px',
                fontSize: '12px',
                fontWeight: '600',
                border: 'none',
                background: activeTab === 'metamodel' ? '#0F172A' : 'transparent',
                color: activeTab === 'metamodel' ? '#38BDF8' : '#94A3B8',
                cursor: 'pointer',
                borderBottom: activeTab === 'metamodel' ? '2px solid #38BDF8' : 'none',
              }}
            >
              Metamodel
            </button>
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', position: 'relative' }}>
            {activeTab === 'inspector' && (
              <PropertyInspector
                selection={selectedEntity}
                onUpdateNode={(id, updates) => {
                  canvasRef.current?.updateNode(id, updates);
                  refreshSelectedEntity(id);
                }}
                onUpdateEdge={(id, updates) => {
                  canvasRef.current?.updateEdge(id, updates);
                  refreshSelectedEntity(id);
                }}
                onDeleteSelected={() => canvasRef.current?.deleteSelection()}
              />
            )}

            {activeTab === 'svg' && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                    Synchronized aim-* XML Contract:
                  </span>
                  <button
                    onClick={handleCopySvg}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: '1px solid #475569',
                      background: '#1E293B',
                      color: copied ? '#4ADE80' : '#E2E8F0',
                      cursor: 'pointer',
                    }}
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <pre
                  style={{
                    fontFamily: '"JetBrains Mono", Consolas, monospace',
                    fontSize: '11px',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    color: '#E2E8F0',
                    background: '#0B1120',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #1E293B',
                  }}
                >
                  {svg}
                </pre>
              </div>
            )}

            {activeTab === 'metamodel' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#38BDF8' }}>
                  AOAIM Metamodel Summary
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ background: '#1E293B', padding: '12px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>Nodes Count</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#F8FAFC', marginTop: '4px' }}>
                      {summaryFacts.nodeCount}
                    </div>
                  </div>
                  <div style={{ background: '#1E293B', padding: '12px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>Edges Count</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#F8FAFC', marginTop: '4px' }}>
                      {summaryFacts.edgeCount}
                    </div>
                  </div>
                </div>

                <div style={{ background: '#1E293B', padding: '12px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>Current Archetype:</div>
                  <div style={{ fontSize: '13px', color: '#38BDF8', fontWeight: '600' }}>
                    {currentPreset.archetype}
                  </div>
                  <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                    {currentPreset.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
