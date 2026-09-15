/**
 * @file RaidCanvas.tsx
 * @description Reusable React component wrapping AntV X6 and RaiBridge for
 * AOAIM (Activity-Object-AI Model) interactive visual editing, Manhattan orthogonal
 * connector routing, and aim-* SVG synchronization.
 *
 * Honors Alan Kay's Dynabook vision of dynamic, malleable visual objects
 * and Rainer Burkhardt's C++ GrafObj graphical hierarchy contracts.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Graph } from '@antv/x6';
import { RaiBridge } from './RaiBridge.js';
import { registerAimShapes, configureAimGraph, CascaisPalette } from './X6Shapes.js';
import type { AimOntologyKind, RaidNodeData, RaidEdgeData } from './types.js';

export interface RaidCanvasProps {
  /** The raw SVG string carrying aim-* ontological attributes (preferred) */
  svg?: string;
  /** Raw aim-* SVG string alias (supported for compatibility) */
  svgContent?: string;
  /** Whether the canvas allows dragging and editing, or behaves as a pan/zoom viewer */
  readOnly?: boolean;
  /** Optional CSS class name for the outer wrapper */
  className?: string;
  /** Optional inline styles for outer wrapper */
  style?: React.CSSProperties;
  /** Callback fired when user moves a node or adjusts an edge bend point */
  onChange?: (updatedSvg: string) => void;
  /** Callback returning serialized SVG DOM upon canvas change or save trigger */
  onSave?: (svg: string) => void;
  /** Callback fired when an entity is selected, providing its ontological metadata */
  onSelect?: (selection: { id: string; kind: AimOntologyKind; label: string } | null) => void;
  /** Callback fired emitting IDs of selected nodes/edges */
  onSelectionChange?: (selectedIds: string[]) => void;
  /** Whether to render built-in navigation controls (Zoom In/Out, Fit, Center, Reset). Default: true */
  showToolbar?: boolean;
}

/**
 * Declarative drop-in React component for rendering and interacting with
 * AOAIM diagrams conforming to the ontological aim-* SVG contract.
 */
export const RaidCanvas: React.FC<RaidCanvasProps> = ({
  svg,
  svgContent,
  readOnly = false,
  className,
  style,
  onChange,
  onSave,
  onSelect,
  onSelectionChange,
  showToolbar = true,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const bridgeRef = useRef<RaiBridge>(new RaiBridge());
  const lastSerializedSvgRef = useRef<string>('');
  const isHydratingRef = useRef<boolean>(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Unify svg vs svgContent props
  const activeSvg = svgContent ?? svg ?? '';

  // Callback refs to maintain stable graph event listeners
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

  const svgPropRef = useRef(activeSvg);
  svgPropRef.current = activeSvg;

  // --------------------------------------------------------------------------
  // Toolbar Actions
  // --------------------------------------------------------------------------
  const handleZoomIn = useCallback(() => {
    const graph = graphRef.current;
    if (!graph) return;
    graph.zoom(0.2);
    setZoomLevel(Math.round(graph.zoom() * 100));
  }, []);

  const handleZoomOut = useCallback(() => {
    const graph = graphRef.current;
    if (!graph) return;
    graph.zoom(-0.2);
    setZoomLevel(Math.round(graph.zoom() * 100));
  }, []);

  const handleFitToContent = useCallback(() => {
    const graph = graphRef.current;
    if (!graph) return;
    graph.zoomToFit({ padding: 32, maxScale: 1.5 });
    setZoomLevel(Math.round(graph.zoom() * 100));
  }, []);

  const handleCenter = useCallback(() => {
    const graph = graphRef.current;
    if (!graph) return;
    graph.centerContent();
  }, []);

  const handleResetView = useCallback(() => {
    const graph = graphRef.current;
    if (!graph) return;
    graph.zoom(1, { absolute: true });
    graph.centerContent();
    setZoomLevel(100);
  }, []);

  // --------------------------------------------------------------------------
  // 1. Mount Graph & Event Listeners
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current) return;

    registerAimShapes();

    const container = containerRef.current;
    const initialWidth = container.clientWidth || 800;
    const initialHeight = container.clientHeight || 600;

    const graph = new Graph({
      container,
      width: initialWidth,
      height: initialHeight,
      autoResize: false,
      grid: {
        visible: true,
        type: 'dot',
        args: {
          color: CascaisPalette.SilverLine,
          thickness: 1,
        },
      },
      interacting: {
        nodeMovable: !readOnly,
        edgeMovable: !readOnly,
        edgeLabelMovable: !readOnly,
        arrowheadMovable: !readOnly,
        vertexMovable: !readOnly,
        vertexAddable: !readOnly,
        vertexDeletable: !readOnly,
      },
      panning: {
        enabled: true,
        eventTypes: readOnly ? ['leftMouseDown', 'rightMouseDown'] : ['rightMouseDown', 'mouseWheel'],
      },
      mousewheel: {
        enabled: true,
        modifiers: ['ctrl', 'meta'],
      },
      connecting: {
        router: 'manhattan',
        connector: { name: 'rounded', args: { radius: 8 } },
        allowBlank: false,
        allowLoop: false,
        highlight: true,
      },
    });

    configureAimGraph(graph);
    graphRef.current = graph;

    // Helper: Debounced Serialization and notification
    const triggerDebouncedChange = () => {
      if (isHydratingRef.current) return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (!graphRef.current) return;
        const currentBaseSvg = svgPropRef.current;
        const updatedSvg = bridgeRef.current.serializeToSvg(graphRef.current, currentBaseSvg);
        lastSerializedSvgRef.current = updatedSvg;

        onChangeRef.current?.(updatedSvg);
        onSaveRef.current?.(updatedSvg);
      }, 100);
    };

    // Canvas change events
    graph.on('node:change:position', triggerDebouncedChange);
    graph.on('node:change:size', triggerDebouncedChange);
    graph.on('edge:change:vertices', triggerDebouncedChange);
    graph.on('cell:added', triggerDebouncedChange);
    graph.on('cell:removed', triggerDebouncedChange);

    // Zoom listener to keep toolbar indicator accurate
    graph.on('scale', () => {
      setZoomLevel(Math.round(graph.zoom() * 100));
    });

    // Selection listeners
    graph.on('cell:click', ({ cell }) => {
      const id = String(cell.id);

      if (cell.isNode()) {
        const data = (cell.getData() ?? {}) as Partial<RaidNodeData>;
        const kind = (data.kind ?? 'act') as AimOntologyKind;
        const label = data.displayName ?? (cell.getAttrByPath('label/text') as string) ?? id;
        onSelectRef.current?.({ id, kind, label });
      } else if (cell.isEdge()) {
        const data = (cell.getData() ?? {}) as Partial<RaidEdgeData>;
        const label = data.label ?? (cell.getLabels()?.[0]?.attrs?.['text']?.['text'] as string) ?? '';
        onSelectRef.current?.({ id, kind: 'act', label });
      }

      onSelectionChangeRef.current?.([id]);
    });

    graph.on('blank:click', () => {
      onSelectRef.current?.(null);
      onSelectionChangeRef.current?.([]);
    });

    // Auto-resize observer for fluid layouts
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && graphRef.current) {
          graphRef.current.resize(width, height);
        }
      }
    });

    resizeObserver.observe(container);

    // Initial Hydration
    if (svgPropRef.current) {
      isHydratingRef.current = true;
      try {
        bridgeRef.current.hydrateFromSvg(svgPropRef.current, graph);
        lastSerializedSvgRef.current = svgPropRef.current;
      } catch (err) {
        console.error('RaidCanvas hydration error:', err);
      } finally {
        isHydratingRef.current = false;
      }
    }

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      resizeObserver.disconnect();
      graph.dispose();
      graphRef.current = null;
    };
  }, [readOnly]);

  // --------------------------------------------------------------------------
  // 2. React to External SVG Changes
  // --------------------------------------------------------------------------
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || !activeSvg) return;

    // Ignore if this change originated from our own serialization
    if (activeSvg === lastSerializedSvgRef.current) {
      return;
    }

    isHydratingRef.current = true;
    try {
      bridgeRef.current.hydrateFromSvg(activeSvg, graph);
      lastSerializedSvgRef.current = activeSvg;
    } catch (err) {
      console.error('RaidCanvas re-hydration error:', err);
    } finally {
      isHydratingRef.current = false;
    }
  }, [activeSvg]);

  return (
    <div
      className={`raid-canvas-wrapper ${className ?? ''}`.trim()}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 300,
        overflow: 'hidden',
        background: CascaisPalette.ChalkWhite,
        ...style,
      }}
    >
      {/* Graph Mount Target */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          inset: 0,
        }}
      />

      {/* Built-in Navigation & Zoom Controls */}
      {showToolbar && (
        <div
          className="raid-canvas-toolbar"
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            zIndex: 10,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            padding: '4px 6px',
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${CascaisPalette.SilverLineDark}`,
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            fontFamily: 'Inter, system-ui, sans-serif',
            userSelect: 'none',
          }}
        >
          <button
            type="button"
            title="Zoom In"
            aria-label="Zoom In"
            onClick={handleZoomIn}
            style={toolbarBtnStyle}
          >
            ➕
          </button>
          <button
            type="button"
            title="Zoom Out"
            aria-label="Zoom Out"
            onClick={handleZoomOut}
            style={toolbarBtnStyle}
          >
            ➖
          </button>
          <span
            style={{
              padding: '0 6px',
              fontSize: 11,
              fontWeight: 600,
              color: CascaisPalette.TextSecondary,
              minWidth: 42,
              textAlign: 'center',
            }}
          >
            {zoomLevel}%
          </span>
          <div style={{ width: 1, height: 16, background: CascaisPalette.SilverLine, margin: '0 2px' }} />
          <button
            type="button"
            title="Fit to Content"
            aria-label="Fit to Content"
            onClick={handleFitToContent}
            style={toolbarBtnStyle}
          >
            ⛶
          </button>
          <button
            type="button"
            title="Center Content"
            aria-label="Center Content"
            onClick={handleCenter}
            style={toolbarBtnStyle}
          >
            🎯
          </button>
          <button
            type="button"
            title="Reset View (100%)"
            aria-label="Reset View"
            onClick={handleResetView}
            style={toolbarBtnStyle}
          >
            ↺
          </button>
        </div>
      )}
    </div>
  );
};

const toolbarBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  padding: 0,
  border: 'none',
  background: 'transparent',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 12,
  color: CascaisPalette.WarmGraphite,
  transition: 'background-color 0.15s ease',
};
