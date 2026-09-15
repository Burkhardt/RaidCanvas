/**
 * @file RaidCanvas.tsx
 * @description Reusable React component wrapping AntV X6 and RaiBridge for
 * AOAIM (Activity-Object-AI Model) interactive visual editing, Manhattan orthogonal
 * connector routing, drag-and-drop shape stencils, semantic anti-entropy wiring,
 * and aim-* SVG synchronization.
 *
 * Honors Alan Kay's Dynabook vision of dynamic, malleable visual objects
 * and Rainer Burkhardt's C++ GrafObj graphical hierarchy contracts.
 */

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
} from 'react';
import { Graph, Shape, Edge } from '@antv/x6';
import { RaiBridge } from './RaiBridge.js';
import {
  registerAimShapes,
  configureAimGraph,
  createAimNode,
  applyEdgeRouting,
  CascaisPalette,
  getDefaultNodeBounds,
  getDefaultNodeName,
} from './X6Shapes.js';
import {
  validateSemanticConnection,
  getSemanticEdgeKind,
  getSemanticEdgeStereotype,
} from './semanticRules.js';
import type { AimOntologyKind, AimRoutingMode, RaidNodeData, RaidEdgeData } from './types.js';

export interface RaidCanvasProps {
  /** The raw SVG string carrying aim-* ontological attributes (preferred) */
  svg?: string;
  /** Raw aim-* SVG string alias (supported for compatibility) */
  svgContent?: string;
  /** Whether the canvas allows dragging and editing, or behaves as a pan/zoom viewer */
  readOnly?: boolean;
  /** Default routing mode for edges ('manhattan', 'normal', 'smooth'). Default: 'manhattan' */
  defaultRouting?: AimRoutingMode;
  /** Optional CSS class name for the outer wrapper */
  className?: string;
  /** Optional inline styles for outer wrapper */
  style?: React.CSSProperties;
  /** Callback fired when user moves a node, adjusts edge, or drops a shape */
  onChange?: (updatedSvg: string) => void;
  /** Callback returning serialized SVG DOM upon canvas change or save trigger */
  onSave?: (svg: string) => void;
  /** Callback fired when an entity is selected, providing its ontological metadata */
  onSelect?: (selection: { id: string; kind: AimOntologyKind; label: string } | null) => void;
  /** Callback fired emitting IDs of selected nodes/edges */
  onSelectionChange?: (selectedIds: string[]) => void;
  /** Callback fired when a stencil is dropped onto the canvas */
  onDropStencil?: (kind: AimOntologyKind, point: { x: number; y: number }) => void;
  /** Whether to render built-in navigation controls (Zoom In/Out, Fit, Center, Reset). Default: true */
  showToolbar?: boolean;
}

export interface RaidCanvasHandle {
  /** Access underlying AntV X6 Graph instance */
  getGraph: () => Graph | null;
  /** Get current serialized SVG */
  getSvg: () => string;
  /** Add a new AOAIM archetype node to the canvas */
  addNode: (
    kind: AimOntologyKind,
    x?: number,
    y?: number,
    customData?: Partial<RaidNodeData>,
  ) => string;
  /** Update properties of an existing node (label, stereotype, dimensions, etc.) */
  updateNode: (id: string, updates: Partial<RaidNodeData>) => void;
  /** Update properties of an existing edge (kind, label, stereotype, routing, ports) */
  updateEdge: (id: string, updates: Partial<RaidEdgeData>) => void;
  /** Set routing mode across the canvas or for new edges */
  setRoutingMode: (mode: AimRoutingMode, applyToAllEdges?: boolean) => void;
  /** Get the current active canvas routing mode */
  getRoutingMode: () => AimRoutingMode;
  /** Delete currently selected cell(s) */
  deleteSelection: () => void;
  /** Clear all cells on the canvas */
  clear: () => void;
  /** Center canvas content */
  center: () => void;
  /** Zoom to fit content */
  zoomToFit: () => void;
  /** Reset view to 100% zoom and center */
  resetView: () => void;
  /** Zoom in */
  zoomIn: () => void;
  /** Zoom out */
  zoomOut: () => void;
}

/**
 * Declarative drop-in React component for rendering and interacting with
 * AOAIM diagrams conforming to the ontological aim-* SVG contract.
 */
export const RaidCanvas = React.forwardRef<RaidCanvasHandle, RaidCanvasProps>(
  function RaidCanvas(
    {
      svg,
      svgContent,
      readOnly = false,
      defaultRouting = 'manhattan',
      className,
      style,
      onChange,
      onSave,
      onSelect,
      onSelectionChange,
      onDropStencil,
      showToolbar = true,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const graphRef = useRef<Graph | null>(null);
    const bridgeRef = useRef<RaiBridge>(new RaiBridge());
    const lastSerializedSvgRef = useRef<string>('');
    const isHydratingRef = useRef<boolean>(false);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const selectedCellIdRef = useRef<string | null>(null);
    const clearEdgeToolsRef = useRef<(() => void) | null>(null);
    const routingModeRef = useRef<AimRoutingMode>(defaultRouting);
    routingModeRef.current = defaultRouting;

    const [zoomLevel, setZoomLevel] = useState<number>(100);
    const [isDragOver, setIsDragOver] = useState<boolean>(false);

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

    const onDropStencilRef = useRef(onDropStencil);
    onDropStencilRef.current = onDropStencil;

    const svgPropRef = useRef(activeSvg);
    svgPropRef.current = activeSvg;

    // Helper: Debounced Serialization and notification
    const triggerDebouncedChange = useCallback(() => {
      if (isHydratingRef.current) return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (!graphRef.current) return;
        const currentBaseSvg = svgPropRef.current;
        const updatedSvg = bridgeRef.current.serializeToSvg(
          graphRef.current,
          currentBaseSvg,
        );
        lastSerializedSvgRef.current = updatedSvg;

        onChangeRef.current?.(updatedSvg);
        onSaveRef.current?.(updatedSvg);
      }, 100);
    }, []);

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
    // Imperative Ref Handle API
    // --------------------------------------------------------------------------
    useImperativeHandle(
      ref,
      () => ({
        getGraph: () => graphRef.current,
        getSvg: () => {
          if (!graphRef.current) return svgPropRef.current;
          return bridgeRef.current.serializeToSvg(
            graphRef.current,
            svgPropRef.current,
          );
        },
        addNode: (kind, x, y, customData) => {
          const graph = graphRef.current;
          if (!graph) return '';

          const defaultBounds = getDefaultNodeBounds(kind, x ?? 200, y ?? 150);
          const defaultName = getDefaultNodeName(kind);
          const id = `${kind.toUpperCase()}_${Date.now().toString(36).slice(-4)}`;

          const nodeData: RaidNodeData = {
            id,
            kind,
            displayName: customData?.displayName ?? defaultName,
            ...(customData?.stereotype !== undefined ? { stereotype: customData.stereotype } : {}),
            ...(customData?.attributes !== undefined ? { attributes: customData.attributes } : {}),
            ...(customData?.methods !== undefined ? { methods: customData.methods } : {}),
            bounds: {
              ...defaultBounds,
              ...(customData?.bounds ?? {}),
            },
          };

          const nodeMeta = createAimNode(nodeData);
          graph.addNode(nodeMeta);

          selectedCellIdRef.current = id;
          onSelectRef.current?.({ id, kind, label: nodeData.displayName });
          onSelectionChangeRef.current?.([id]);
          triggerDebouncedChange();

          return id;
        },
        updateNode: (id, updates) => {
          const graph = graphRef.current;
          if (!graph) return;
          const node = graph.getCellById(id);
          if (!node || !node.isNode()) return;

          const currentData = (node.getData() ?? {}) as RaidNodeData;
          const nextData: RaidNodeData = {
            ...currentData,
            ...updates,
            id: updates.id ?? currentData.id ?? id,
            kind: updates.kind ?? currentData.kind ?? 'act',
            displayName: updates.displayName ?? currentData.displayName ?? id,
            bounds: {
              ...(currentData.bounds ?? { x: 0, y: 0, width: 140, height: 60 }),
              ...(updates.bounds ?? {}),
            },
          };
          node.setData(nextData);

          const displayName = nextData.displayName;
          const stereotype = nextData.stereotype;
          const labelText = stereotype ? `${stereotype}\n${displayName}` : displayName;

          if (nextData.kind === 'cls') {
            node.setAttrByPath('title/text', displayName);
            if (nextData.attributes !== undefined) {
              node.setAttrByPath('attributes/text', nextData.attributes.join('\n'));
            }
            if (nextData.methods !== undefined) {
              node.setAttrByPath('methods/text', nextData.methods.join('\n'));
            }
          } else {
            node.setAttrByPath('label/text', labelText);
          }

          if (updates.bounds) {
            node.setPosition(updates.bounds.x, updates.bounds.y);
            node.setSize(updates.bounds.width, updates.bounds.height);
          }

          triggerDebouncedChange();
        },
        updateEdge: (id, updates) => {
          const graph = graphRef.current;
          if (!graph) return;
          const edge = graph.getCellById(id);
          if (!edge || !edge.isEdge()) return;

          const currentData = (edge.getData() ?? {}) as RaidEdgeData;
          const nextData = { ...currentData, ...updates };
          edge.setData(nextData);

          if (updates.routing !== undefined) {
            applyEdgeRouting(edge, updates.routing);
          }

          if (updates.sourcePort !== undefined) {
            const currentSource = edge.getSource() as { cell?: string };
            if (currentSource.cell) {
              edge.setSource({ cell: currentSource.cell, port: updates.sourcePort });
            }
          }

          if (updates.targetPort !== undefined) {
            const currentTarget = edge.getTarget() as { cell?: string };
            if (currentTarget.cell) {
              edge.setTarget({ cell: currentTarget.cell, port: updates.targetPort });
            }
          }

          if (updates.label !== undefined || updates.stereotype !== undefined) {
            const text = updates.label ?? updates.stereotype ?? '';
            edge.setLabels(
              text
                ? [
                    {
                      attrs: {
                        text: {
                          text,
                          fill: CascaisPalette.TextSecondary,
                          fontSize: 11,
                        },
                      },
                      position: 0.5,
                    },
                  ]
                : [],
            );
          }

          triggerDebouncedChange();
        },
        setRoutingMode: (mode, applyToAll = true) => {
          routingModeRef.current = mode;
          if (applyToAll && graphRef.current) {
            for (const edge of graphRef.current.getEdges()) {
              applyEdgeRouting(edge, mode);
              const currentData = (edge.getData() ?? {}) as RaidEdgeData;
              edge.setData({ ...currentData, routing: mode });
            }
            triggerDebouncedChange();
          }
        },
        getRoutingMode: () => routingModeRef.current,
        deleteSelection: () => {
          const graph = graphRef.current;
          if (!graph || readOnly) return;
          if (selectedCellIdRef.current) {
            const cell = graph.getCellById(selectedCellIdRef.current);
            if (cell) {
              clearEdgeToolsRef.current?.();
              graph.removeCell(cell);
              selectedCellIdRef.current = null;
              onSelectRef.current?.(null);
              onSelectionChangeRef.current?.([]);
              triggerDebouncedChange();
            }
          }
        },
        clear: () => {
          const graph = graphRef.current;
          if (!graph || readOnly) return;
          graph.clearCells();
          selectedCellIdRef.current = null;
          onSelectRef.current?.(null);
          onSelectionChangeRef.current?.([]);
          triggerDebouncedChange();
        },
        center: handleCenter,
        zoomToFit: handleFitToContent,
        resetView: handleResetView,
        zoomIn: handleZoomIn,
        zoomOut: handleZoomOut,
      }),
      [
        handleCenter,
        handleFitToContent,
        handleResetView,
        handleZoomIn,
        handleZoomOut,
        readOnly,
        triggerDebouncedChange,
      ],
    );

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
        highlighting: {
          magnetAvailable: {
            name: 'stroke',
            args: {
              padding: 3,
              attrs: {
                stroke: CascaisPalette.HeraldicGreen,
                strokeWidth: 2,
              },
            },
          },
          magnetAdsorbed: {
            name: 'stroke',
            args: {
              padding: 4,
              attrs: {
                stroke: CascaisPalette.HeraldicGreen,
                strokeWidth: 3,
                fill: CascaisPalette.HeraldicGreen,
              },
            },
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
          eventTypes: readOnly
            ? ['leftMouseDown', 'rightMouseDown']
            : ['rightMouseDown', 'mouseWheel'],
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
          allowNode: true,
          allowPort: true,
          allowEdge: false,
          highlight: true,
          validateConnection({ sourceCell, targetCell }) {
            if (!sourceCell || !targetCell) return false;
            if (sourceCell === targetCell) return false;
            if (!sourceCell.isNode() || !targetCell.isNode()) return false;

            const sourceKind = (
              (sourceCell.getData() as Partial<RaidNodeData>)?.kind ?? 'act'
            ) as AimOntologyKind;
            const targetKind = (
              (targetCell.getData() as Partial<RaidNodeData>)?.kind ?? 'act'
            ) as AimOntologyKind;

            return validateSemanticConnection(sourceKind, targetKind);
          },
          createEdge() {
            const edge = new Shape.Edge({
              shape: 'aim-edge',
            });
            applyEdgeRouting(edge, routingModeRef.current);
            return edge;
          },
        },
      });

      configureAimGraph(graph);
      graphRef.current = graph;

      let activeToolEdge: Edge | null = null;

      const clearEdgeTools = () => {
        if (activeToolEdge) {
          try {
            activeToolEdge.removeTools();
          } catch {
            // Ignore if cell was already removed
          }
          activeToolEdge = null;
        }
      };
      clearEdgeToolsRef.current = clearEdgeTools;

      const setEdgeTools = (edge: Edge) => {
        clearEdgeTools();
        if (readOnly) return;
        activeToolEdge = edge;
        try {
          edge.addTools([
            {
              name: 'source-arrowhead',
              args: {
                attrs: {
                  fill: CascaisPalette.NetGold,
                  stroke: '#FFFFFF',
                  strokeWidth: 2,
                  cursor: 'grab',
                },
              },
            },
            {
              name: 'target-arrowhead',
              args: {
                attrs: {
                  fill: CascaisPalette.NetGold,
                  stroke: '#FFFFFF',
                  strokeWidth: 2,
                  cursor: 'grab',
                },
              },
            },
            {
              name: 'vertices',
              args: {
                attrs: {
                  fill: CascaisPalette.WarmGraphite,
                  stroke: '#FFFFFF',
                  strokeWidth: 1.5,
                },
              },
            },
          ]);
        } catch {
          // Fallback if tools fail to attach
        }
      };

      // Handle edge connections and re-connections with automatic semantic wiring
      graph.on('edge:connected', ({ edge, isNew }) => {
        const sourceCell = edge.getSourceCell();
        const targetCell = edge.getTargetCell();
        if (sourceCell?.isNode() && targetCell?.isNode()) {
          const sourceKind = (
            (sourceCell.getData() as Partial<RaidNodeData>)?.kind ?? 'act'
          ) as AimOntologyKind;
          const targetKind = (
            (targetCell.getData() as Partial<RaidNodeData>)?.kind ?? 'act'
          ) as AimOntologyKind;

          const edgeKind = getSemanticEdgeKind(sourceKind, targetKind);
          const currentData = (edge.getData() ?? {}) as Partial<RaidEdgeData>;
          const stereotype = currentData.stereotype ?? getSemanticEdgeStereotype(sourceKind, targetKind);

          edge.setData({
            ...currentData,
            id: edge.id,
            kind: edgeKind,
            sourceId: sourceCell.id,
            targetId: targetCell.id,
            sourcePort: edge.getSourcePortId(),
            targetPort: edge.getTargetPortId(),
            label: currentData.label ?? stereotype,
            stereotype,
            routing: currentData.routing ?? routingModeRef.current,
            bendPoints: currentData.bendPoints ?? [],
          });

          if (isNew) {
            applyEdgeRouting(edge, routingModeRef.current);
            if (stereotype) {
              edge.setLabels([
                {
                  attrs: {
                    text: {
                      text: stereotype,
                      fill: CascaisPalette.TextSecondary,
                      fontSize: 11,
                    },
                  },
                  position: 0.5,
                },
              ]);
            }
          } else {
            // Re-anchored: if edge was selected, re-attach tools
            if (selectedCellIdRef.current === edge.id) {
              setEdgeTools(edge);
            }
          }
        }
        triggerDebouncedChange();
      });

      // Canvas change events
      graph.on('node:change:position', triggerDebouncedChange);
      graph.on('node:change:size', triggerDebouncedChange);
      graph.on('edge:change:vertices', triggerDebouncedChange);
      graph.on('edge:change:source', triggerDebouncedChange);
      graph.on('edge:change:target', triggerDebouncedChange);
      graph.on('cell:added', triggerDebouncedChange);
      graph.on('cell:removed', ({ cell }) => {
        if (cell === activeToolEdge) {
          activeToolEdge = null;
        }
        triggerDebouncedChange();
      });

      // Zoom listener to keep toolbar indicator accurate
      graph.on('scale', () => {
        setZoomLevel(Math.round(graph.zoom() * 100));
      });

      // Selection listeners
      graph.on('cell:click', ({ cell }) => {
        const id = String(cell.id);
        selectedCellIdRef.current = id;

        if (cell.isNode()) {
          clearEdgeTools();
          const data = (cell.getData() ?? {}) as Partial<RaidNodeData>;
          const kind = (data.kind ?? 'act') as AimOntologyKind;
          const label =
            data.displayName ??
            (cell.getAttrByPath('label/text') as string) ??
            (cell.getAttrByPath('title/text') as string) ??
            id;
          onSelectRef.current?.({ id, kind, label });
        } else if (cell.isEdge()) {
          setEdgeTools(cell);
          const data = (cell.getData() ?? {}) as Partial<RaidEdgeData>;
          const label =
            data.label ??
            (cell.getLabels()?.[0]?.attrs?.['text']?.['text'] as string) ??
            '';
          onSelectRef.current?.({ id, kind: 'act', label });
        }

        onSelectionChangeRef.current?.([id]);
      });

      graph.on('blank:click', () => {
        clearEdgeTools();
        selectedCellIdRef.current = null;
        onSelectRef.current?.(null);
        onSelectionChangeRef.current?.([]);
      });

      // Keyboard listener for deletion
      const handleKeyDown = (e: KeyboardEvent) => {
        if (readOnly) return;
        const activeTag = (document.activeElement?.tagName ?? '').toLowerCase();
        if (
          activeTag === 'input' ||
          activeTag === 'textarea' ||
          (document.activeElement as HTMLElement)?.isContentEditable
        ) {
          return;
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (selectedCellIdRef.current && graphRef.current) {
            const cell = graphRef.current.getCellById(selectedCellIdRef.current);
            if (cell) {
              e.preventDefault();
              clearEdgeTools();
              graphRef.current.removeCell(cell);
              selectedCellIdRef.current = null;
              onSelectRef.current?.(null);
              onSelectionChangeRef.current?.([]);
              triggerDebouncedChange();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);

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
          graph.centerContent();
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
        window.removeEventListener('keydown', handleKeyDown);
        resizeObserver.disconnect();
        clearEdgeToolsRef.current = null;
        graph.dispose();
        graphRef.current = null;
      };
    }, [readOnly, triggerDebouncedChange]);

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
        graph.centerContent();
      } catch (err) {
        console.error('RaidCanvas re-hydration error:', err);
      } finally {
        isHydratingRef.current = false;
      }
    }, [activeSvg]);

    // --------------------------------------------------------------------------
    // 3. HTML5 Drag-and-Drop Stencil Dropzone
    // --------------------------------------------------------------------------
    const handleDragOver = (e: React.DragEvent) => {
      if (readOnly) return;
      const hasStencil =
        e.dataTransfer.types.includes('application/aoaim-kind') ||
        e.dataTransfer.types.includes('text/plain');
      if (hasStencil) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        if (!isDragOver) setIsDragOver(true);
      }
    };

    const handleDragLeave = (e: React.DragEvent) => {
      if (readOnly) return;
      if (e.currentTarget.contains(e.relatedTarget as Node)) return;
      setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      if (readOnly) return;
      e.preventDefault();
      setIsDragOver(false);

      const kind = (e.dataTransfer.getData('application/aoaim-kind') ||
        e.dataTransfer.getData('text/plain')) as AimOntologyKind;

      if (!kind || !graphRef.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      const graph = graphRef.current;
      const localPos = graph.clientToLocal({ x: clientX, y: clientY });

      const defaultBounds = getDefaultNodeBounds(kind, localPos.x, localPos.y);
      const bounds = {
        ...defaultBounds,
        x: Math.round(localPos.x - defaultBounds.width / 2),
        y: Math.round(localPos.y - defaultBounds.height / 2),
      };

      const defaultName = getDefaultNodeName(kind);
      const id = `${kind.toUpperCase()}_${Date.now().toString(36).slice(-4)}`;

      const nodeData: RaidNodeData = {
        id,
        kind,
        displayName: defaultName,
        bounds,
      };

      const nodeMeta = createAimNode(nodeData);
      graph.addNode(nodeMeta);

      selectedCellIdRef.current = id;
      onSelectRef.current?.({ id, kind, label: defaultName });
      onSelectionChangeRef.current?.([id]);
      onDropStencilRef.current?.(kind, { x: bounds.x, y: bounds.y });
      triggerDebouncedChange();
    };

    return (
      <div
        className={`raid-canvas-wrapper ${className ?? ''}`.trim()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: 300,
          overflow: 'hidden',
          background: isDragOver ? '#F0FDF4' : CascaisPalette.ChalkWhite,
          outline: isDragOver ? `2px dashed ${CascaisPalette.HeraldicGreen}` : 'none',
          outlineOffset: -4,
          transition: 'background-color 0.2s ease, outline 0.2s ease',
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

        {/* Dropzone Overlay Badge (active during drag over) */}
        {isDragOver && (
          <div
            style={{
              position: 'absolute',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 20,
              padding: '6px 16px',
              background: '#10B981',
              color: '#FFFFFF',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              pointerEvents: 'none',
            }}
          >
            Drop to Instantiate AOAIM Node
          </div>
        )}

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
            <div
              style={{
                width: 1,
                height: 16,
                background: CascaisPalette.SilverLine,
                margin: '0 2px',
              }}
            />
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
  },
);

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
