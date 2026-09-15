/**
 * @file RaidCanvas.tsx
 * @description Reusable React component wrapping AntV X6 and RaiBridge for
 * AOAIM (Activity-Object-AI Model) interactive visual editing and aim-* SVG synchronization.
 *
 * Honors Alan Kay's Dynabook vision of dynamic, malleable visual objects.
 */

import React, { useEffect, useRef } from 'react';
import { Graph } from '@antv/x6';
import { RaiBridge } from './RaiBridge.js';
import { registerAimShapes, configureAimGraph } from './X6Shapes.js';
import type { AimOntologyKind, RaidNodeData, RaidEdgeData } from './types.js';

export interface RaidCanvasProps {
  /** The raw SVG string carrying aim-* ontological attributes */
  svg: string;
  /** Whether the canvas allows dragging and editing, or behaves as a pan/zoom viewer */
  readOnly?: boolean;
  /** Optional CSS class name for the wrapper */
  className?: string;
  /** Optional inline styles */
  style?: React.CSSProperties;
  /** Callback fired when user moves a node or adjusts an edge bend point */
  onChange?: (updatedSvg: string) => void;
  /** Callback fired when a node or edge is selected */
  onSelect?: (selection: { id: string; kind: AimOntologyKind; label: string } | null) => void;
}

/**
 * Declarative drop-in React component for rendering and interacting with
 * AOAIM diagrams conforming to the ontological aim-* SVG contract.
 */
export const RaidCanvas: React.FC<RaidCanvasProps> = ({
  svg,
  readOnly = false,
  className,
  style,
  onChange,
  onSelect,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const bridgeRef = useRef<RaiBridge>(new RaiBridge());
  const lastSerializedSvgRef = useRef<string>('');
  const isHydratingRef = useRef<boolean>(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep latest callbacks in refs to avoid re-binding graph listeners
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const svgPropRef = useRef(svg);
  svgPropRef.current = svg;

  // 1. Initialize Graph & Event Listeners on mount
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
          color: '#E5E7EB',
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

    // Helper to trigger debounced serialization
    const triggerDebouncedChange = () => {
      if (isHydratingRef.current || !onChangeRef.current) return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (!graphRef.current) return;
        const currentBaseSvg = svgPropRef.current;
        const updatedSvg = bridgeRef.current.serializeToSvg(graphRef.current, currentBaseSvg);
        lastSerializedSvgRef.current = updatedSvg;
        onChangeRef.current?.(updatedSvg);
      }, 100);
    };

    // Change listeners
    graph.on('node:change:position', triggerDebouncedChange);
    graph.on('node:change:size', triggerDebouncedChange);
    graph.on('edge:change:vertices', triggerDebouncedChange);
    graph.on('cell:added', triggerDebouncedChange);
    graph.on('cell:removed', triggerDebouncedChange);

    // Selection listeners
    graph.on('cell:click', ({ cell }) => {
      if (!onSelectRef.current) return;

      const id = String(cell.id);

      if (cell.isNode()) {
        const data = (cell.getData() ?? {}) as Partial<RaidNodeData>;
        const kind = (data.kind ?? 'act') as AimOntologyKind;
        const label = data.displayName ?? (cell.getAttrByPath('label/text') as string) ?? id;
        onSelectRef.current({ id, kind, label });
      } else if (cell.isEdge()) {
        const data = (cell.getData() ?? {}) as Partial<RaidEdgeData>;
        const label = data.label ?? (cell.getLabels()?.[0]?.attrs?.['text']?.['text'] as string) ?? '';
        onSelectRef.current({ id, kind: 'act', label });
      }
    });

    graph.on('blank:click', () => {
      onSelectRef.current?.(null);
    });

    // Responsive container resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && graphRef.current) {
          graphRef.current.resize(width, height);
        }
      }
    });

    resizeObserver.observe(container);

    // Initial hydration if SVG prop was provided
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

    // Cleanup on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      resizeObserver.disconnect();
      graph.dispose();
      graphRef.current = null;
    };
  }, [readOnly]);

  // 2. React to external SVG changes
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || !svg) return;

    // Ignore if this update was triggered by our own serialization
    if (svg === lastSerializedSvgRef.current) {
      return;
    }

    isHydratingRef.current = true;
    try {
      bridgeRef.current.hydrateFromSvg(svg, graph);
      lastSerializedSvgRef.current = svg;
    } catch (err) {
      console.error('RaidCanvas re-hydration error:', err);
    } finally {
      isHydratingRef.current = false;
    }
  }, [svg]);

  return (
    <div
      ref={containerRef}
      className={`raid-canvas-host ${className ?? ''}`.trim()}
      style={{
        width: '100%',
        height: '100%',
        minHeight: 300,
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    />
  );
};
