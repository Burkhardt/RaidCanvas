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
import { Graph, Shape, Node as X6Node, Edge, History, Transform } from '@antv/x6';
import { RaiBridge } from './RaiBridge.js';
import {
	registerAimShapes,
	configureAimGraph,
	createAimNode,
	createAimEdge,
	createAimBoundary,
	applyEdgeRouting,
	CascaisPalette,
	getDefaultNodeBounds,
	getDefaultNodeName,
	setNodeDualityActive,
} from './X6Shapes.js';
import { withAlpha } from './CascaisTheme.js';
import { isInstanceNode } from './RoleModel.js';
import {
	validateDiagramConnection,
	isNodeAllowedInDiagram,
	getSemanticEdgeKind,
	getSemanticEdgeStereotype,
} from './semanticRules.js';
import type { AimOntologyKind, AimRoutingMode, RaidNodeData, RaidEdgeData, RaidBoundaryData } from './types.js';

export interface RaidWaypointSelection { edgeId: string; index: number; x: number; y: number; }

export interface RaidCanvasState {
    showExpressions: boolean;
    canUndo: boolean;
    canRedo: boolean;
    routing: AimRoutingMode | 'mixed';
}

export interface RaidCanvasProps {
	/** The raw SVG string carrying aim-* ontological attributes (preferred) */
	svg?: string;
	/** Raw aim-* SVG string alias (supported for compatibility) */
	svgContent?: string;
	/** Whether the canvas allows dragging and editing, or behaves as a pan/zoom viewer */
	readOnly?: boolean;
    /** Allow layout edits while preventing semantic node/edge creation, reconnection and deletion. */
    layoutOnly?: boolean;
    onWaypointSelect?: (point: RaidWaypointSelection | null) => void;
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
	/**
	 * Asked before `updateNode` changes a node's archetype (kind), ahead of the debounced `onChange`.
	 * Return `false` to refuse; a promise is applied at once and reverted when it resolves `false` or
	 * rejects. Hosts use it to move a 1UCC role between Who / What / Where, or to refuse the move.
	 */
	onNodeArchetypeChange?: (node: RaidNodeData, from: AimOntologyKind, to: AimOntologyKind) => boolean | Promise<boolean>;
	/** Callback fired when the active routing mode changes (e.g. hydrated from SVG or switched by user) */
	onRoutingModeChange?: (mode: AimRoutingMode) => void;
    /** Event-driven toolbar state, including mixed routing and undo/redo. */
    onCanvasStateChange?: (state: RaidCanvasState) => void;
    /** Refit after host layout changes. Opt in for responsive multi-pane workstations. */
    fitOnResize?: boolean;
	/** Callback fired when the left hemisphere (Persona / Anchor) of a node is tapped */
	onNodeClick?: (node: RaidNodeData, event: MouseEvent) => void;
	/**
	 * The node the host's Inspector already shows. A left tap on it changes nothing, so its persona keeps no
	 * Verde hover/press and no pointer cursor.
	 */
	inspectedNodeId?: string | null;
	/** Callback fired when the right hemisphere (Portal Door) of a node is tapped */
	onNodePortalClick?: (node: RaidNodeData, event: MouseEvent) => void;
	/** Deprecated desktop double-click fallback */
	onNodeDblClick?: (node: RaidNodeData, event: MouseEvent) => void;
	/** Select this node after the incoming SVG is hydrated, without polling the graph. */
    initialSelectionId?: string;
	/** Whether to render built-in navigation controls (Zoom In/Out, Fit, Center, Reset). Default: true */
	showToolbar?: boolean;
}

export interface RaidCanvasHandle {
	/** Access underlying AntV X6 Graph instance */
	getGraph: () => Graph | null;
    setShowExpressions: (visible: boolean) => void;
	/** Get current serialized SVG */
	getSvg: () => string;
	/** Add a new AOAIM archetype node to the canvas */
	addNode: (
		kind: AimOntologyKind,
		x?: number,
		y?: number,
		customData?: Partial<RaidNodeData>,
	) => string;
	/** Update properties of an existing node (label, stereotype, dimensions, etc.). `stereotypeGlyph: ''` clears the pictogram. */
	updateNode: (id: string, updates: Partial<RaidNodeData>) => void;
	/** Update properties of an existing edge (kind, label, stereotype, routing, ports). `stereotypeGlyph: ''` clears the pictogram. */
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
	/** Revert the last operation on the canvas */
	undo: () => void;
	/** Re-apply the last undone operation on the canvas */
	redo: () => void;
	/** Whether there are operations that can be undone */
	canUndo: () => boolean;
	/** Whether there are operations that can be redone */
	canRedo: () => boolean;
	/** Clear undo and redo history stacks */
	cleanHistory: () => void;
	/** Awaken Duality Mode (bicolor seam & portal door) on a specific node */
	activateNodeDuality: (nodeId: string) => void;
	/** Deactivate Duality Mode, putting all nodes back to sleep */
	deactivateNodeDuality: () => void;
	/** Select a specific node on the canvas */
	selectNode: (nodeId: string) => void;
	/** Currently active duality node ID, or null if dormant */
	getActiveDualityNodeId: () => string | null;
	/** Add a new boundary box (Class scope or Package folder) to the canvas */
	addBoundary: (
		kind: 'Class' | 'Package' | string,
		name: string,
		x?: number,
		y?: number,
		width?: number,
		height?: number,
	) => string;
	/** Get all boundary boxes currently on the canvas */
	getBoundaries: () => RaidBoundaryData[];
	/** Update properties of an existing boundary box */
	updateBoundary: (id: string, updates: Partial<RaidBoundaryData>) => void;
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
			readOnly = false, layoutOnly = false, onWaypointSelect,
			defaultRouting = 'manhattan',
			className,
			style,
			onChange,
			onSave,
			onSelect,
			onSelectionChange,
			onDropStencil,
			onNodeArchetypeChange,
			onRoutingModeChange,
			onNodeClick,
			inspectedNodeId,
			onNodePortalClick,
			onNodeDblClick,
			showToolbar = true, initialSelectionId, onCanvasStateChange, fitOnResize = false,
		},
		ref,
	) {
		const containerRef = useRef<HTMLDivElement | null>(null);
		const wrapperRef = useRef<HTMLDivElement | null>(null);
		const graphRef = useRef<Graph | null>(null);
		const bridgeRef = useRef<RaiBridge>(new RaiBridge());
		const lastSerializedSvgRef = useRef<string>('');
		const isHydratingRef = useRef<boolean>(false);
        const hydrationVersionRef = useRef(0);
        const initialSelectionRef = useRef({ version: -1, id: '' });
		const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
		const selectedCellIdRef = useRef<string | null>(null);
		const clearEdgeToolsRef = useRef<(() => void) | null>(null);
		const routingModeRef = useRef<AimRoutingMode>(defaultRouting);
		const selectedWaypointRef = useRef<RaidWaypointSelection | null>(null);
        const onWaypointSelectRef = useRef(onWaypointSelect);
        onWaypointSelectRef.current = onWaypointSelect;
		const activeDualityNodeIdRef = useRef<string | null>(null);

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

		const onNodeArchetypeChangeRef = useRef(onNodeArchetypeChange);
		onNodeArchetypeChangeRef.current = onNodeArchetypeChange;
		const archetypeRevertRef = useRef(false);

        const onCanvasStateChangeRef = useRef(onCanvasStateChange);
        onCanvasStateChangeRef.current = onCanvasStateChange;
        const fitOnResizeRef = useRef(fitOnResize);
        fitOnResizeRef.current = fitOnResize;
        const emitCanvasState = useCallback(() => {
            const graph = graphRef.current;
            if (!graph || isHydratingRef.current) return;
            const modes = new Set(graph.getEdges().map(edge => edge.getRouter()?.name === 'manhattan' ? 'manhattan' : edge.getConnector()?.name === 'smooth' ? 'smooth' : 'normal'));
            const routing = modes.size > 1 ? 'mixed' : [...modes][0] ?? routingModeRef.current;
            if (routing !== 'mixed') {
                routingModeRef.current = routing;
                (graph as Graph & { _aimRoutingMode?: AimRoutingMode })._aimRoutingMode = routing;
            }
            const history = graph as Graph & { canUndo?: () => boolean; canRedo?: () => boolean };
            onCanvasStateChangeRef.current?.({ showExpressions: (graph as Graph & { _aimShowExpressions?: boolean })._aimShowExpressions ?? true, routing, canUndo: !readOnly && (history.canUndo?.() ?? false), canRedo: !readOnly && (history.canRedo?.() ?? false) });
        }, [readOnly]);

		const onRoutingModeChangeRef = useRef(onRoutingModeChange);
		onRoutingModeChangeRef.current = onRoutingModeChange;

		const onNodeClickRef = useRef(onNodeClick);
		onNodeClickRef.current = onNodeClick;

		const inspectedNodeIdRef = useRef(inspectedNodeId);
		inspectedNodeIdRef.current = inspectedNodeId;

		const onNodePortalClickRef = useRef(onNodePortalClick);
		onNodePortalClickRef.current = onNodePortalClick;

		const onNodeDblClickRef = useRef(onNodeDblClick);
		onNodeDblClickRef.current = onNodeDblClick;

		const svgPropRef = useRef(activeSvg);
		svgPropRef.current = activeSvg;

		const deactivateDuality = useCallback(() => {
			if (!activeDualityNodeIdRef.current || !graphRef.current) {
				activeDualityNodeIdRef.current = null;
				return;
			}
			const graph = graphRef.current;
			const prevNode = graph.getCellById(activeDualityNodeIdRef.current);
			if (prevNode && prevNode.isNode()) {
				const wasEnabled = (graph as unknown as { isHistoryEnabled?: () => boolean }).isHistoryEnabled?.();
				if (wasEnabled) (graph as unknown as { disableHistory?: () => void }).disableHistory?.();
				try {
					setNodeDualityActive(prevNode, false);
				} finally {
					if (wasEnabled) (graph as unknown as { enableHistory?: () => void }).enableHistory?.();
				}
			}
			activeDualityNodeIdRef.current = null;
		}, []);

		const activateDuality = useCallback((nodeOrId: X6Node | string) => {
			if (!graphRef.current) return;
			const graph = graphRef.current;
			const node = typeof nodeOrId === 'string' ? graph.getCellById(nodeOrId) : nodeOrId;
			if (node && node.isNode()) {
				const rawData = (node.getData() ?? {}) as Record<string, any>;
				const isClassBoundary = rawData.kind === 'Class' || node.shape === 'aim-boundary-class';
				let href = rawData.href as string | undefined;
				if (!href && isClassBoundary) {
					const name = rawData.name || rawData.displayName || String(node.id);
					href = `/classes?select=${encodeURIComponent(name)}`;
					node.setData({ ...rawData, href }, { silent: true });
				}
				if (href && href.trim().length > 0) {
					const wasEnabled = (graph as unknown as { isHistoryEnabled?: () => boolean }).isHistoryEnabled?.();
					if (wasEnabled) (graph as unknown as { disableHistory?: () => void }).disableHistory?.();
					try {
						if (activeDualityNodeIdRef.current && activeDualityNodeIdRef.current !== String(node.id)) {
							const prevNode = graph.getCellById(activeDualityNodeIdRef.current);
							if (prevNode && prevNode.isNode()) {
								setNodeDualityActive(prevNode, false);
							}
						}
						setNodeDualityActive(node, true);
						activeDualityNodeIdRef.current = String(node.id);
					} finally {
						if (wasEnabled) (graph as unknown as { enableHistory?: () => void }).enableHistory?.();
					}
				}
			}
		}, []);

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
					{ routingMode: routingModeRef.current },
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
			() => {
				const handle: RaidCanvasHandle = {
				getGraph: () => graphRef.current,
                setShowExpressions: visible => {
                    const graph = graphRef.current;
                    if (!graph || readOnly) return;
                    (graph as Graph & { _aimShowExpressions?: boolean })._aimShowExpressions = visible;
                    for (const edge of graph.getEdges()) edge.setLabels(createAimEdge({ ...edge.getData(), id: edge.id, sourceId: edge.getSourceCellId(), targetId: edge.getTargetCellId(), bendPoints: edge.getVertices() } as RaidEdgeData, visible).labels ?? [], { ignoreHistory: true });
                    emitCanvasState();
                    triggerDebouncedChange();
                },
				getSvg: () => {
					if (!graphRef.current) return svgPropRef.current;
					return bridgeRef.current.serializeToSvg(
						graphRef.current,
						svgPropRef.current,
						{ routingMode: routingModeRef.current },
					);
				},
				addNode: (kind, x, y, customData) => {
                    if (readOnly || layoutOnly) return "";
					const graph = graphRef.current;
					if (!graph) return '';
					if (!isNodeAllowedInDiagram({ ...customData, kind }, new DOMParser().parseFromString(svgPropRef.current, 'image/svg+xml').documentElement.getAttribute('aim-archetype') ?? '')) return '';

					const defaultBounds = getDefaultNodeBounds(kind, x ?? 200, y ?? 150);
					const defaultName = getDefaultNodeName(kind);
					const id = `${kind.toUpperCase()}_${Date.now().toString(36).slice(-4)}`;

					const nodeData: RaidNodeData = {
						id,
						kind,
						displayName: customData?.displayName ?? defaultName,
						...(customData?.qualifier !== undefined ? { qualifier: customData.qualifier } : {}),
						instance: isInstanceNode({ kind, ...(customData?.instance !== undefined ? { instance: customData.instance } : {}), ...(customData?.slot ? { slot: true } : {}) }),
						...(customData?.slot === true ? { slot: true } : {}),
						...(customData?.restriction ? { restriction: customData.restriction } : {}),
						...(customData?.state ? { state: customData.state } : {}),
						...(customData?.description !== undefined ? { description: customData.description } : {}),
						...(customData?.descriptionWidth !== undefined ? { descriptionWidth: customData.descriptionWidth } : {}),
						...(customData?.stereotype !== undefined ? { stereotype: customData.stereotype } : (kind === 'plc' ? { stereotype: 'Venue' } : {})),
						...(customData?.attributes !== undefined ? { attributes: customData.attributes } : {}),
						...(customData?.methods !== undefined ? { methods: customData.methods } : {}),
						...(customData?.properties !== undefined ? { properties: customData.properties } : {}),
						...(customData?.unbound !== undefined ? { unbound: customData.unbound } : {}),
						...(customData?.href !== undefined ? { href: customData.href } : {}),
						...(customData?.stereotypeGlyph ? { stereotypeGlyph: customData.stereotypeGlyph } : {}),
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
                    if (readOnly || layoutOnly) return;
					const graph = graphRef.current;
					if (!graph) return;
					const node = graph.getCellById(id);
					if (!node || !node.isNode()) return;

					const currentData = (node.getData() ?? {}) as RaidNodeData;
					// The host may refuse an archetype change (e.g. a role still bound by a live Activity).
					// A synchronous `false` leaves the node untouched; a promise applies at once and reverts on
					// `false` or rejection.
					const archetypeGuard = onNodeArchetypeChangeRef.current;
					if (archetypeGuard && updates.kind !== undefined && updates.kind !== currentData.kind && !archetypeRevertRef.current) {
						const from = currentData.kind;
						let verdict: boolean | Promise<boolean>;
						try {
							verdict = archetypeGuard(currentData, from, updates.kind);
						} catch {
							return;
						}
						if (verdict === false) return;
						if (verdict && typeof (verdict as Promise<boolean>).then === 'function') {
							const before = { ...node.getPosition(), ...node.getSize() };
							const revert = () => {
								if (!graphRef.current?.getCellById(id)) return;
								archetypeRevertRef.current = true;
								try {
									handle.updateNode(id, { kind: from, slot: currentData.slot === true, bounds: before });
								} finally {
									archetypeRevertRef.current = false;
								}
							};
							(verdict as Promise<boolean>).then(ok => { if (ok === false) revert(); }, revert);
						}
					}
					let nextData: RaidNodeData = {
						...currentData,
						...updates,
						id: updates.id ?? currentData.id ?? id,
						kind: updates.kind ?? currentData.kind ?? 'act',
						displayName: updates.displayName ?? currentData.displayName ?? id,
						bounds: {
							...(currentData.bounds ?? { x: 0, y: 0, width: 140, height: 60 }),
							...(updates.bounds ?? {}),
						},
						...(updates.qualifier !== undefined
							? { qualifier: updates.qualifier }
							: currentData.qualifier !== undefined
								? { qualifier: currentData.qualifier }
								: {}),
						...(updates.instance !== undefined
							? { instance: updates.instance }
							: currentData.instance !== undefined
								? { instance: currentData.instance }
								: {}),
						...(updates.href !== undefined
							? { href: updates.href }
							: currentData.href !== undefined
								? { href: currentData.href }
								: {}),
						...(updates.stereotype !== undefined
							? { stereotype: updates.stereotype }
							: currentData.stereotype !== undefined
								? { stereotype: currentData.stereotype }
								: {}),
					};
					// CR053: `stereotypeGlyph: ''` clears the pictogram.
					if (nextData.stereotypeGlyph === '') {
						const { stereotypeGlyph: _cleared, ...withoutGlyph } = nextData;
						nextData = withoutGlyph;
					}
					// A new archetype starts from its own defaults: whatever only the old one carried (its instance
					// default, a Class's projected roles, a role slot) must not decide how the new one looks.
					if (nextData.kind !== currentData.kind) {
						const { instance: _instance, roleAttributes: _roles, slot: _slot, ...rest } = nextData;
						nextData = {
							...rest,
							...(updates.instance !== undefined ? { instance: updates.instance } : {}),
							...(nextData.kind === 'cls' && nextData.roleAttributes ? { roleAttributes: nextData.roleAttributes } : {}),
							...((updates.slot ?? (currentData.slot === true && ['per', 'obj', 'plc'].includes(nextData.kind))) ? { slot: true } : {}),
						};
					}
                    if (!isNodeAllowedInDiagram(nextData, new DOMParser().parseFromString(svgPropRef.current, 'image/svg+xml').documentElement.getAttribute('aim-archetype') ?? '')) return;
					// Every update re-renders canonically through createAimNode, so the result depends only on the
					// node's data and live geometry, never on which attrs an earlier edit happened to patch.
					// Resizing does not sync into data.bounds, so the live position and size are the base.
					let placement: Partial<RaidNodeData['bounds']> = { ...node.getPosition(), ...node.getSize() };
					// A new archetype takes its own default size, centred where the old shape was, so the
					// result never depends on the archetype it replaced.
					if (nextData.kind !== currentData.kind && updates.bounds?.width === undefined && updates.bounds?.height === undefined) {
						const { width, height } = getDefaultNodeBounds(nextData.kind);
						const { x, y } = node.getPosition();
						const old = node.getSize();
						placement = { x: Math.round(x + (old.width - width) / 2), y: Math.round(y + (old.height - height) / 2), width, height };
					}
					const canonical = createAimNode({ ...nextData, bounds: { ...nextData.bounds, ...placement, ...(updates.bounds ?? {}) } });
					node.setData(canonical.data, { overwrite: true });
					const fresh = graph.createNode(canonical);
					node.prop('shape', canonical.shape);
					node.setMarkup(fresh.getMarkup());
					node.setAttrs(fresh.getAttrs(), { overwrite: true });
					node.resize(Number(canonical.width), Number(canonical.height));
					if (canonical.x !== undefined && canonical.y !== undefined) node.position(Number(canonical.x), Number(canonical.y));

					// The fresh attrs show the dormant face; an awakened node keeps its portal unless its link is gone.
					if (activeDualityNodeIdRef.current === id) {
						const linked = Boolean(nextData.href?.trim());
						setNodeDualityActive(node, linked);
						if (!linked) activeDualityNodeIdRef.current = null;
					}

					triggerDebouncedChange();
				},
				updateEdge: (id, updates) => {
                    if (readOnly) return;
                    if (layoutOnly) updates = { ...(updates.bendPoints !== undefined ? { bendPoints: updates.bendPoints } : {}), ...(updates.routing !== undefined ? { routing: updates.routing } : {}) };
					const graph = graphRef.current;
					if (!graph) return;
					const edge = graph.getCellById(id);
					if (!edge || !edge.isEdge()) return;

					const currentData = (edge.getData() ?? {}) as RaidEdgeData;
					const mutableData: Record<string, unknown> = { ...currentData, ...updates };
					// CR053: `stereotypeGlyph: ''` clears the pictogram.
					if (mutableData['stereotypeGlyph'] === '') delete mutableData['stereotypeGlyph'];

					if (updates.bendPoints !== undefined) {
                        selectedWaypointRef.current = null;
                        onWaypointSelectRef.current?.(null);
						edge.setVertices(updates.bendPoints.map((p) => ({ x: p.x, y: p.y })));
						mutableData.bendPoints = updates.bendPoints;
					}

					if (updates.routing !== undefined) {
						applyEdgeRouting(edge, updates.routing);
					}

					if (updates.sourcePort !== undefined) {
						const currentSource = edge.getSource() as { cell?: string };
						if (currentSource.cell) {
							if (updates.sourcePort === '' || updates.sourcePort === 'auto') {
								edge.setSource({ cell: currentSource.cell });
								delete mutableData.sourcePort;
							} else {
								edge.setSource({ cell: currentSource.cell, port: updates.sourcePort });
								mutableData.sourcePort = updates.sourcePort;
							}
						}
					}

					if (updates.targetPort !== undefined) {
						const currentTarget = edge.getTarget() as { cell?: string };
						if (currentTarget.cell) {
							if (updates.targetPort === '' || updates.targetPort === 'auto') {
								edge.setTarget({ cell: currentTarget.cell });
								delete mutableData.targetPort;
							} else {
								edge.setTarget({ cell: currentTarget.cell, port: updates.targetPort });
								mutableData.targetPort = updates.targetPort;
							}
						}
					}

					edge.setData(mutableData as unknown as RaidEdgeData, { overwrite: true });

					if (updates.kind !== undefined || updates.directed !== undefined) {
						const nextEdgeData = mutableData as unknown as RaidEdgeData;
						const isDirected = nextEdgeData.directed !== false;
						const edgeMeta = createAimEdge(nextEdgeData, (graph as Graph & { _aimShowExpressions?: boolean })._aimShowExpressions ?? true);
						edge.prop('shape', edgeMeta.shape);
						edge.setAttrs(edgeMeta.attrs ?? {});
						if (!isDirected) {
							edge.removeProp('attrs/line/targetMarker');
							edge.removeProp('attrs/line/sourceMarker');
							const view = graph.findViewByCell(edge);
							const path = view?.container?.querySelector('path[marker-end]');
							path?.removeAttribute('marker-end');
						} else {
							const targetMarker = (edgeMeta.attrs?.['line'] as Record<string, unknown> | undefined)?.['targetMarker'];
							if (targetMarker) {
								edge.setAttrByPath('line/targetMarker', targetMarker as any);
							}
						}
					}

					if (
						updates.label !== undefined ||
						updates.stereotype !== undefined ||
						updates.stereotypeGlyph !== undefined ||
						updates.expression !== undefined ||
						updates.expressionColor !== undefined ||
						updates.satisfied !== undefined
					) {
						const nextEdgeData = mutableData as unknown as RaidEdgeData;
						const edgeMeta = createAimEdge(nextEdgeData, (graph as Graph & { _aimShowExpressions?: boolean })._aimShowExpressions ?? true);
						edge.setLabels(edgeMeta.labels ?? []);
					}

					triggerDebouncedChange();
				},
				setRoutingMode: (mode, applyToAll = true) => {
					routingModeRef.current = mode;
					if (graphRef.current) {
						(graphRef.current as unknown as { _aimRoutingMode?: AimRoutingMode })._aimRoutingMode = mode;
					}
					onRoutingModeChangeRef.current?.(mode);
					if (applyToAll && graphRef.current) {
						const graph = graphRef.current;
						const batchName = 'change-routing-mode';
						graph.startBatch(batchName);
						try {
							for (const edge of graph.getEdges()) {
								applyEdgeRouting(edge, mode);
								const currentData = (edge.getData() ?? {}) as RaidEdgeData;
								edge.setData({ ...currentData, routing: mode });
							}
						} finally {
							graph.stopBatch(batchName);
						}
						triggerDebouncedChange();
					}
				},
				getRoutingMode: () => routingModeRef.current,
				deleteSelection: () => {
                    if (readOnly || layoutOnly) return;
					const graph = graphRef.current;
					if (!graph || readOnly) return;
					if (selectedCellIdRef.current) {
						if (selectedCellIdRef.current === activeDualityNodeIdRef.current) {
							activeDualityNodeIdRef.current = null;
						}
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
                    if (readOnly || layoutOnly) return;
					const graph = graphRef.current;
					if (!graph || readOnly) return;
					deactivateDuality();
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
				undo: () => {
					const graph = graphRef.current;
					if (!graph || readOnly) return;
					if ((graph as unknown as { canUndo?: () => boolean }).canUndo?.()) {
						(graph as unknown as { undo: () => void }).undo();
						triggerDebouncedChange();
					}
				},
				redo: () => {
					const graph = graphRef.current;
					if (!graph || readOnly) return;
					if ((graph as unknown as { canRedo?: () => boolean }).canRedo?.()) {
						(graph as unknown as { redo: () => void }).redo();
						triggerDebouncedChange();
					}
				},
				canUndo: () => {
					const graph = graphRef.current;
					if (!graph || readOnly) return false;
					return (graph as unknown as { canUndo?: () => boolean }).canUndo?.() ?? false;
				},
				canRedo: () => {
					const graph = graphRef.current;
					if (!graph || readOnly) return false;
					return (graph as unknown as { canRedo?: () => boolean }).canRedo?.() ?? false;
				},
				cleanHistory: () => {
					const graph = graphRef.current;
					if (!graph || readOnly) return;
					(graph as unknown as { cleanHistory?: () => void }).cleanHistory?.();
				},
				activateNodeDuality: (nodeId: string) => {
					activateDuality(nodeId);
				},
				deactivateNodeDuality: () => {
					deactivateDuality();
				},
				selectNode: (nodeId: string) => {
					selectedCellIdRef.current = nodeId;
					const graph = graphRef.current;
					if (graph) {
						const cell = graph.getCellById(nodeId);
						if (cell) {
							(graph as any).cleanSelection?.();
							(graph as any).select?.(cell);
							if (cell.isNode()) {
								clearEdgeToolsRef.current?.();
								const data = (cell.getData() ?? {}) as Partial<RaidNodeData>;
								const kind = (data.kind ?? 'act') as AimOntologyKind;
								const label =
									data.displayName ??
									(cell.getAttrByPath('label/text') as string) ??
									(cell.getAttrByPath('title/text') as string) ??
									nodeId;
								onSelectRef.current?.({ id: nodeId, kind, label });
							}
						}
					}
					onSelectionChangeRef.current?.([nodeId]);
				},
				getActiveDualityNodeId: () => activeDualityNodeIdRef.current,
				addBoundary: (kind, name, x, y, width, height) => {
                    if (readOnly || layoutOnly) return "";
					const graph = graphRef.current;
					if (!graph) return '';
					const id = `boundary_${Date.now().toString(36).slice(-4)}`;
					const isPackage = kind.toLowerCase() === 'package';
					const boundaryData: RaidBoundaryData = {
						id,
						kind: isPackage ? 'Package' : 'Class',
						name,
						elementIds: [],
						bounds: {
							x: x ?? 100,
							y: y ?? 80,
							width: width ?? (isPackage ? 340 : 320),
							height: height ?? (isPackage ? 240 : 220),
						},
					};
					const boundaryMeta = createAimBoundary(boundaryData);
					const node = graph.addNode(boundaryMeta);
					node.setZIndex(0);
					triggerDebouncedChange();
					return id;
				},
				getBoundaries: () => {
					if (!graphRef.current) return [];
					const metamodel = bridgeRef.current.metamodelFromGraph(graphRef.current);
					return metamodel.boundaries ? [...metamodel.boundaries] : [];
				},
				updateBoundary: (id, updates) => {
                    if (readOnly || layoutOnly) return;
					const graph = graphRef.current;
					if (!graph) return;
					const node = graph.getCellById(id);
					if (!node || !node.isNode()) return;
					const currentData = (node.getData() ?? {}) as RaidBoundaryData;
					const nextData: RaidBoundaryData = {
						...currentData,
						...updates,
						id: updates.id ?? currentData.id ?? id,
						kind: updates.kind ?? currentData.kind ?? 'Class',
						name: updates.name ?? currentData.name ?? id,
						href: updates.href !== undefined ? updates.href : currentData.href,
						bounds: {
							...currentData.bounds,
							...(updates.bounds ?? {}),
						},
					};
					node.setData(nextData, { overwrite: true });
					const label = `${nextData.kind}: ${nextData.name}`;
					node.setAttrByPath('headerText/text', label);
					if (nextData.kind === 'Package') {
						const primaryColor = '#1E293B';
						const tabWidth = Math.max(140, Math.min(node.getSize().width * 0.55, label.length * 7.5 + 36));
						node.setAttrByPath('body/stroke', primaryColor);
						node.setAttrByPath('body/strokeDasharray', 'none');
						node.setAttrByPath('body/refY', 26);
						node.setAttrByPath('body/refHeight2', -26);
						node.setAttrByPath('folderTab/d', `M 0 26 L 0 6 A 6 6 0 0 1 6 0 L ${tabWidth - 18} 0 L ${tabWidth} 26 Z`);
						node.setAttrByPath('folderTab/fill', CascaisPalette.ChalkWhite);
						node.setAttrByPath('folderTab/stroke', primaryColor);
						node.setAttrByPath('headerText/fill', '#1E293B');
						node.setAttrByPath('headerText/refX', 12);
						node.setAttrByPath('headerText/refY', 14);
					} else {
						const primaryColor = CascaisPalette.NetGoldStroke;
						node.setAttrByPath('body/stroke', primaryColor);
						node.setAttrByPath('body/strokeDasharray', '6,4');
						node.setAttrByPath('body/refY', 0);
						node.setAttrByPath('body/refHeight2', 0);
						node.setAttrByPath('headerText/fill', CascaisPalette.WarmGraphite);
						node.setAttrByPath('headerText/refX', 14);
						node.setAttrByPath('headerText/refY', 18);
					}
					if (updates.bounds) {
						node.setPosition(updates.bounds.x, updates.bounds.y);
						node.setSize(updates.bounds.width, updates.bounds.height);
					}
					triggerDebouncedChange();
				},
				};
				return handle;
			},
			[
				handleCenter,
				handleFitToContent,
				handleResetView,
				handleZoomIn,
				handleZoomOut,
				readOnly, layoutOnly, emitCanvasState,
				triggerDebouncedChange,
				activateDuality,
				deactivateDuality,
			],
		);

		// --------------------------------------------------------------------------
		// 1. Mount Graph & Event Listeners
		// --------------------------------------------------------------------------
		useEffect(() => {
			if (!containerRef.current) return;

			registerAimShapes();

			const container = containerRef.current;
			const wrapper = wrapperRef.current;
			const initialWidth = wrapper?.clientWidth || container.clientWidth || 800;
			const initialHeight = wrapper?.clientHeight || container.clientHeight || 600;

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
								stroke: CascaisPalette.TelemetryGreen,
								strokeWidth: 2,
							},
						},
					},
					magnetAdsorbed: {
						name: 'stroke',
						args: {
							padding: 4,
							attrs: {
								stroke: CascaisPalette.TelemetryGreen,
								strokeWidth: 3,
								fill: CascaisPalette.TelemetryGreen,
							},
						},
					},
				},
				interacting: {
					nodeMovable: !readOnly,
					edgeMovable: !readOnly,
					edgeLabelMovable: !readOnly,
					arrowheadMovable: !readOnly && !layoutOnly,
                    magnetConnectable: !readOnly && !layoutOnly,
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
				embedding: {
					enabled: !readOnly && !layoutOnly,
					findParent({ node }) {
						const bbox = node.getBBox();
						return this.getNodes().filter((n) => {
							if (n === node) return false;
							const isBoundary =
								n.shape === 'aim-boundary' ||
								n.shape === 'aim-boundary-class' ||
								n.shape === 'aim-boundary-package' ||
								(n.getData() as any)?.isBoundary;
							if (!isBoundary) return false;
							const parentBBox = n.getBBox();
							return parentBBox.containsRect(bbox);
						});
					},
					validate({ child, parent }) {
						const isBoundary =
							parent.shape === 'aim-boundary' ||
							parent.shape === 'aim-boundary-class' ||
							parent.shape === 'aim-boundary-package' ||
							(parent.getData() as any)?.isBoundary;
						return Boolean(isBoundary && !child.shape?.startsWith('aim-boundary'));
					},
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

						return validateDiagramConnection({ ...sourceCell.getData(), kind: sourceKind }, { ...targetCell.getData(), kind: targetKind }, new DOMParser().parseFromString(svgPropRef.current, 'image/svg+xml').documentElement.getAttribute('aim-archetype') ?? '');
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

			if (!readOnly) {
				graph.use(
					new History({
						enabled: true,
						beforeAddCommand(_event, args: any) {
							// CR031: Reject any commands generated during hydration/inflation
							if (isHydratingRef.current) {
								return false;
							}
							// Discard transient port hover noise, internal selection/hover mutations, and Duality view-state awakening (CR035)
							if (
								args?.key === 'ports' ||
								args?.path?.startsWith('ports') ||
								args?.path?.includes('/ports/') ||
								args?.key === 'tools' ||
								args?.key === 'door' ||
								args?.key === 'seam' ||
								args?.key === 'chevron' ||
								args?.path?.startsWith('attrs/door') ||
								args?.path?.startsWith('attrs/seam') ||
								args?.path?.startsWith('attrs/chevron') ||
								args?.path?.includes('/door/') ||
								args?.path?.includes('/seam/') ||
								args?.path?.includes('/chevron/')
							) {
								return false;
							}
							if (args?.options?.ignoreHistory === true || args?.options?.silent === true) {
								return false;
							}
							return true;
						},
					}),
				);

				graph.use(
					new Transform({
						resizing: {
							enabled: (node) =>
								node.shape === 'aim-boundary' ||
								node.shape === 'aim-boundary-class' ||
								node.shape === 'aim-boundary-package' ||
								(node.getData() as any)?.isBoundary,
							minWidth: 180,
							minHeight: 120,
						},
						rotating: {
							enabled: false,
						},
					}),
				);
			}

			graphRef.current = graph;
			// A re-created node (e.g. a role slot changing category) mounts a fresh view: carry the mark over.
			graph.on('view:mounted', ({ view }) => {
				if (view.cell.isNode()) view.container.classList.toggle('aim-inspected', String(view.cell.id) === inspectedNodeIdRef.current);
			});
            let stateQueued = false;
            let disposed = false;
            const queueCanvasState = () => {
                if (stateQueued) return;
                stateQueued = true;
                queueMicrotask(() => { stateQueued = false; if (!disposed) emitCanvasState(); });
            };
            graph.on('history:change', queueCanvasState);
            // Labels are a projection of semantic data and the current diagram preference.
            // Reapply after history restores an older edge snapshot.
            const refreshExpressionLabels = () => {
                for (const edge of graph.getEdges()) {
                    edge.setLabels(createAimEdge({ ...edge.getData(), id: edge.id, sourceId: edge.getSourceCellId(), targetId: edge.getTargetCellId(), bendPoints: edge.getVertices() } as RaidEdgeData, (graph as Graph & { _aimShowExpressions?: boolean })._aimShowExpressions ?? true).labels ?? [], { ignoreHistory: true });
                }
            };
            graph.on('history:undo', refreshExpressionLabels);
            graph.on('history:redo', refreshExpressionLabels);
            graph.on('edge:change:router', queueCanvasState);
            graph.on('edge:change:connector', queueCanvasState);
            graph.on('cell:added', queueCanvasState);
            graph.on('cell:removed', queueCanvasState);
            queueCanvasState();

			let activeToolEdge: Edge | null = null;
            let activeWaypointHandle: SVGElement | null = null;

			const clearEdgeTools = () => {
                activeWaypointHandle = null;
                selectedWaypointRef.current = null;
                onWaypointSelectRef.current?.(null);
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
				const edgeData = edge.getData() as Partial<RaidEdgeData> | undefined;
				const isDirected = edgeData?.directed !== false;
				const circleHandleD = 'M -5 0 A 5 5 0 1 0 5 0 A 5 5 0 1 0 -5 0';

				try {
					edge.addTools([
                        ...(!layoutOnly ? [{
							name: 'source-arrowhead',
							args: {
								attrs: {
									d: isDirected ? 'M 10 -8 -10 0 10 8 Z' : circleHandleD,
									fill: CascaisPalette.NetGold,
									stroke: CascaisPalette.ChalkWhite,
									strokeWidth: 2,
									cursor: 'grab',
								},
							},
						},
						{
							name: 'target-arrowhead',
							args: {
								attrs: {
									d: isDirected ? 'M -10 -8 10 0 -10 8 Z' : circleHandleD,
									fill: CascaisPalette.NetGold,
									stroke: CascaisPalette.ChalkWhite,
									strokeWidth: 2,
									cursor: 'grab',
								},
							},
						},
                        ] : []),
						{
							name: 'vertices',
							args: {
								attrs: {
                                    r: 8,
									fill: CascaisPalette.WarmGraphite,
									stroke: CascaisPalette.ChalkWhite,
									strokeWidth: 1.5,
								},
								processHandle: (handle: any) => {
									if (handle?.container) {
										handle.container.setAttribute('role', 'button');
                                        handle.container.setAttribute('tabindex', '0');
                                        handle.container.setAttribute('aria-label', `Bend point P${handle.options.index + 1}`);
                                        const selectWaypoint = () => {
                                            const index = handle.options.index as number;
                                            const point = edge.getVertices()[index];
                                            if (!point) return;
                                            selectedCellIdRef.current = edge.id;
                                            activeWaypointHandle?.setAttribute('aria-pressed', 'false');
                                            activeWaypointHandle = handle.container;
                                            activeWaypointHandle?.setAttribute('aria-pressed', 'true');
                                            const selection = { edgeId: edge.id, index, x: point.x, y: point.y };
                                            selectedWaypointRef.current = selection;
                                            onWaypointSelectRef.current?.(selection);
                                        };
                                        handle.container.addEventListener('pointerdown', selectWaypoint);
                                        handle.container.addEventListener('keydown', (event: KeyboardEvent) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                selectWaypoint();
                                            }
                                        });
                                        handle.container.addEventListener('contextmenu', (e: MouseEvent) => {
											e.preventDefault();
											e.stopPropagation();
                                            selectedWaypointRef.current = null;
                                            onWaypointSelectRef.current?.(null);
											handle.emit('remove', { e, handle });
										});
									}
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

					const isOwnerBinding =
						(targetKind === 'rf' && ['obj', 'per', 'plc', 'act'].includes(sourceKind)) ||
						(targetKind === 'rol' && ['cls', 'uc'].includes(sourceKind));

					const isDirected = currentData.directed !== undefined ? currentData.directed : !isOwnerBinding;

					const sourcePort = edge.getSourcePortId();
					const targetPort = edge.getTargetPortId();

					const edgeData: RaidEdgeData = {
						...currentData,
						id: edge.id,
						kind: edgeKind,
						directed: isDirected,
						sourceId: sourceCell.id,
						targetId: targetCell.id,
						...(sourcePort ? { sourcePort } : {}),
						...(targetPort ? { targetPort } : {}),
						label: currentData.label ?? stereotype,
						stereotype,
						routing: currentData.routing ?? routingModeRef.current,
						bendPoints: currentData.bendPoints ?? [],
					};

					edge.setData(edgeData);

					const edgeMeta = createAimEdge(edgeData, (graph as Graph & { _aimShowExpressions?: boolean })._aimShowExpressions ?? true);
					edge.prop('shape', edgeMeta.shape);
					edge.setAttrs(edgeMeta.attrs ?? {});
					if (!isDirected) {
						edge.removeProp('attrs/line/targetMarker');
						edge.removeProp('attrs/line/sourceMarker');
						const view = graph.findViewByCell(edge);
						const path = view?.container?.querySelector('path[marker-end]');
						path?.removeAttribute('marker-end');
						} else {
							const targetMarker = (edgeMeta.attrs?.['line'] as Record<string, unknown> | undefined)?.['targetMarker'];
							if (targetMarker) {
								edge.setAttrByPath('line/targetMarker', targetMarker as any);
							}
						}
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
			graph.on('node:change:size', ({ node }: any) => {
				if (node && String(node.id) === activeDualityNodeIdRef.current) {
					setNodeDualityActive(node, true);
				}
				triggerDebouncedChange();
			});
			graph.on('edge:change:vertices', ({ edge }) => {
                triggerDebouncedChange();
                const selection = selectedWaypointRef.current;
                if (selection?.edgeId !== edge.id) return;
                const point = edge.getVertices()[selection.index];
                selectedWaypointRef.current = point ? { ...selection, x: point.x, y: point.y } : null;
                onWaypointSelectRef.current?.(selectedWaypointRef.current);
            });
			graph.on('edge:change:source', triggerDebouncedChange);
			graph.on('edge:change:target', triggerDebouncedChange);
			graph.on('cell:added', triggerDebouncedChange);
			graph.on('cell:removed', ({ cell }) => {
				if (cell === activeToolEdge) {
					activeToolEdge = null;
				}
				triggerDebouncedChange();
			});

			graph.on('node:embedded', ({ cell, parent, current }: any) => {
				const childNode = cell;
				const parentNode = parent ?? current;
				if (childNode?.isNode() && parentNode?.isNode()) {
					const childData = (childNode.getData() ?? {}) as Partial<RaidNodeData>;
					const parentData = (parentNode.getData() ?? {}) as Partial<RaidBoundaryData>;
					const boundaryId = String(parentNode.id);
					childNode.setData({ ...childData, boundaryId }, { silent: true, overwrite: true });

					const elementIds = Array.isArray(parentData.elementIds) ? [...parentData.elementIds] : [];
					const childId = String(childNode.id);
					if (!elementIds.includes(childId)) {
						elementIds.push(childId);
						parentNode.setData({ ...parentData, elementIds }, { silent: true, overwrite: true });
					}
				}
				triggerDebouncedChange();
			});

			graph.on('node:unembedded', ({ cell, parent, previous }: any) => {
				const childNode = cell;
				const prevParent = parent ?? previous;
				if (childNode?.isNode()) {
					const childData = (childNode.getData() ?? {}) as Partial<RaidNodeData>;
					childNode.setData({ ...childData, boundaryId: undefined }, { silent: true, overwrite: true });

					if (prevParent?.isNode()) {
						const parentData = (prevParent.getData() ?? {}) as Partial<RaidBoundaryData>;
						const elementIds = (parentData.elementIds ?? []).filter((id: string) => id !== String(childNode.id));
						prevParent.setData({ ...parentData, elementIds }, { silent: true, overwrite: true });
					}
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
					const data = (cell.getData() ?? {}) as Record<string, any>;
					const isBoundary =
						cell.shape === 'aim-boundary' ||
						cell.shape === 'aim-boundary-class' ||
						cell.shape === 'aim-boundary-package' ||
						Boolean(data.isBoundary);

					const rawKind = (data.kind ?? (isBoundary ? 'Class' : 'act')) as string;
					const label =
						data.displayName ??
						data.name ??
						(cell.getAttrByPath('headerText/text') as string)?.replace(/^(Class|Package):\s*/, '') ??
						(cell.getAttrByPath('label/text') as string) ??
						(cell.getAttrByPath('title/text') as string) ??
						id;
					onSelectRef.current?.({ id, kind: rawKind as AimOntologyKind, label });
				} else if (cell.isEdge()) {
					deactivateDuality();
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

			// Node click and drag-immunity tracking
			const extractNodeData = (node: any): RaidNodeData => {
				const bbox = node.getBBox ? node.getBBox() : { x: 0, y: 0, width: 140, height: 60 };
				const rawData = (node.getData?.() ?? {}) as Record<string, any>;
				const isBoundary =
					node.shape === 'aim-boundary' ||
					node.shape === 'aim-boundary-class' ||
					node.shape === 'aim-boundary-package' ||
					Boolean(rawData.isBoundary);

				const rawKind = (rawData.kind ?? (isBoundary ? 'Class' : 'act')) as string;
				const displayName =
					rawData.displayName ??
					rawData.name ??
					(node.getAttrByPath?.('headerText/text') as string)?.replace(/^(Class|Package):\s*/, '') ??
					(node.getAttrByPath?.('label/text') as string) ??
					(node.getAttrByPath?.('title/text') as string) ??
					String(node.id);

				const href =
					rawData.href ??
					(isBoundary && rawKind === 'Class' && displayName
						? `/classes?select=${encodeURIComponent(displayName)}`
						: undefined);

				return {
					...rawData,
					id: String(node.id),
					kind: rawKind as AimOntologyKind,
					displayName,
					...(href ? { href } : {}),
					bounds: {
						x: Math.round(bbox.x),
						y: Math.round(bbox.y),
						width: Math.round(bbox.width),
						height: Math.round(bbox.height),
					},
				};
			};

			let pointerDownState: {
				id: string;
				clientX: number;
				clientY: number;
				moved: boolean;
			} | null = null;

			graph.on('node:mousedown', ({ node, e }) => {
				pointerDownState = {
					id: String(node.id),
					clientX: e.clientX,
					clientY: e.clientY,
					moved: false,
				};
			});

			graph.on('node:moving', ({ node }) => {
				if (pointerDownState && pointerDownState.id === String(node.id)) {
					pointerDownState.moved = true;
				}
				wrapperRef.current?.classList.add('aim-dragging');
			});
			const endDrag = () => wrapperRef.current?.classList.remove('aim-dragging');
			graph.on('node:moved', endDrag);
			graph.on('node:mouseup', endDrag);

			graph.on('node:move', ({ node }) => {
				if (pointerDownState && pointerDownState.id === String(node.id)) {
					pointerDownState.moved = true;
				}
			});

			graph.on('node:click', ({ node, e, x }: any) => {
				const start = pointerDownState;
				pointerDownState = null;

				const dx = start ? e.clientX - start.clientX : 0;
				const dy = start ? e.clientY - start.clientY : 0;
				const distance = Math.hypot(dx, dy);

				// Drag immunity guard: if pointer moved > 4px or moving event fired, suppress click
				if (start && (start.moved || distance > 4)) {
					return;
				}

				const nodeData = extractNodeData(node);
				const mouseEvt = ((e as any).originalEvent ?? e) as MouseEvent;
				const hasHref = Boolean(nodeData.href && nodeData.href.trim().length > 0);

				if (!hasHref) {
					// Unlinked node: put any active duality to sleep and fire standard onNodeClick
					deactivateDuality();
					if (onNodeClickRef.current) {
						onNodeClickRef.current(nodeData, mouseEvt);
					}
					return;
				}

				const nodeId = String(node.id);
				if (activeDualityNodeIdRef.current !== nodeId) {
					// Tap 1 (Awakening Tap):
					// Awaken duality mode on this node (reveals gold seam & green door).
					// Deactivates any previously awakened node.
					// Does NOT fire navigation or inspector callbacks yet.
					activateDuality(node);
					return;
				}

				// Tap 2 (Action Tap on Active Dual Node):
				const bbox = node.getBBox ? node.getBBox() : { x: 0, y: 0, width: 140, height: 60 };
				const targetElem = (mouseEvt?.target as Element | null);
				const isDoorElement = Boolean(
					targetElem?.classList?.contains('aim-portal-door') ||
					targetElem?.classList?.contains('aim-portal-chevron') ||
					targetElem?.closest?.('.aim-portal-door') ||
					targetElem?.closest?.('.aim-portal-chevron')
				);

				const clickX = x ?? (e as any)?.x;
				const isRightHemisphere = clickX !== undefined && bbox.width > 0
					? clickX >= (bbox.x + bbox.width / 2)
					: isDoorElement;

				const isPortalClick = isDoorElement || isRightHemisphere;

				if (isPortalClick && onNodePortalClickRef.current) {
					onNodePortalClickRef.current(nodeData, mouseEvt);
				} else if (onNodeClickRef.current) {
					onNodeClickRef.current(nodeData, mouseEvt);
				}
			});

            // A secondary click on the heraldic door has the same public navigation contract.
            graph.on('node:contextmenu', ({ node, e }) => {
                const event = ((e as any).originalEvent ?? e) as MouseEvent;
                const target = event.target as Element | null;
                if (!target?.closest?.('.aim-portal-door, .aim-portal-chevron')) return;
                const data = extractNodeData(node);
                if (!data.href || !onNodePortalClickRef.current) return;
                event.preventDefault();
                event.stopPropagation();
                onNodePortalClickRef.current(data, event);
            });

			graph.on('node:dblclick', ({ node, e }) => {
				if (onNodeDblClickRef.current) {
					const nodeData = extractNodeData(node);
					const mouseEvt = ((e as any).originalEvent ?? e) as MouseEvent;
					onNodeDblClickRef.current(nodeData, mouseEvt);
				}
			});

			graph.on('blank:click', () => {
				clearEdgeTools();
				deactivateDuality();
				pointerDownState = null;
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
                    const point = selectedWaypointRef.current;
                    if (point) {
                        const edge = graph.getCellById(point.edgeId);
                        if (edge?.isEdge()) { e.preventDefault(); edge.removeVertexAt(point.index); }
                        selectedWaypointRef.current = null;
                        onWaypointSelectRef.current?.(null);
                        return;
                    }
                    if (layoutOnly) return;
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

			// Auto-resize observer for fluid layouts (CR035: observe host wrapper, not X6-pinned container)
			const resizeObserver = new ResizeObserver((entries) => {
				for (const entry of entries) {
					const { width, height } = entry.contentRect;
					if (width > 0 && height > 0 && graphRef.current) {
						graphRef.current.resize(width, height);
                        if (fitOnResizeRef.current && graphRef.current.getCells().length) graphRef.current.zoomToFit({ padding: 40, maxScale: 1 });
					}
				}
			});

			if (wrapperRef.current) {
				resizeObserver.observe(wrapperRef.current);
			} else {
				resizeObserver.observe(container);
			}

			// Initial Hydration
			if (svgPropRef.current) {
				isHydratingRef.current = true;
				try {
					hydrationVersionRef.current += 1;
                const metamodel = bridgeRef.current.hydrateFromSvg(svgPropRef.current, graph, { inferPorts: false });
					lastSerializedSvgRef.current = svgPropRef.current;
					if (metamodel.routing) {
						routingModeRef.current = metamodel.routing;
						(graph as unknown as { _aimRoutingMode?: AimRoutingMode })._aimRoutingMode = metamodel.routing;
						onRoutingModeChangeRef.current?.(metamodel.routing);
					}
					graph.zoomToFit({ padding: 40, maxScale: 1 });
				} catch (err) {
					console.error('RaidCanvas hydration error:', err);
				} finally {
					isHydratingRef.current = false;
					// CR031: Guarantee clean undo stack on diagram arrival
					(graph as unknown as { cleanHistory?: () => void }).cleanHistory?.();
				}
			}

			// Cleanup
			return () => {
                disposed = true;
				if (debounceTimerRef.current) {
					clearTimeout(debounceTimerRef.current);
				}
				window.removeEventListener('keydown', handleKeyDown);
				resizeObserver.disconnect();
				clearEdgeToolsRef.current = null;
				graph.dispose();
				graphRef.current = null;
			};
		}, [readOnly, layoutOnly, triggerDebouncedChange, emitCanvasState]);

		// Mark the node the host's Inspector already shows (see `inspectedNodeId`).
		useEffect(() => {
			const graph = graphRef.current;
			if (!graph) return;
			for (const node of graph.getNodes()) {
				graph.findViewByCell(node)?.container.classList.toggle('aim-inspected', String(node.id) === inspectedNodeId);
			}
		}, [inspectedNodeId]);

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
				hydrationVersionRef.current += 1;
                const metamodel = bridgeRef.current.hydrateFromSvg(activeSvg, graph, { inferPorts: false });
				lastSerializedSvgRef.current = activeSvg;
				if (metamodel.routing) {
					routingModeRef.current = metamodel.routing;
					(graph as unknown as { _aimRoutingMode?: AimRoutingMode })._aimRoutingMode = metamodel.routing;
					onRoutingModeChangeRef.current?.(metamodel.routing);
				}
				graph.zoomToFit({ padding: 40, maxScale: 1 });
			} catch (err) {
				console.error('RaidCanvas re-hydration error:', err);
			} finally {
				isHydratingRef.current = false;
				// CR031: Guarantee clean undo stack on external diagram update
				(graph as unknown as { cleanHistory?: () => void }).cleanHistory?.();
			}
		}, [activeSvg]);

        useEffect(() => {
            const graph = graphRef.current;
            if (!graph || !initialSelectionId) return;
            if (initialSelectionRef.current.id === initialSelectionId && initialSelectionRef.current.version === hydrationVersionRef.current) return;
            initialSelectionRef.current = { id: initialSelectionId, version: hydrationVersionRef.current };
            const cell = graph.getCellById(initialSelectionId);
            if (!cell?.isNode()) return;
            selectedCellIdRef.current = initialSelectionId;
            const data = cell.getData() as Partial<RaidNodeData>;
            onSelectRef.current?.({ id: initialSelectionId, kind: data.kind ?? 'obj', label: data.displayName ?? initialSelectionId });
            onSelectionChangeRef.current?.([initialSelectionId]);
        }, [initialSelectionId, activeSvg, readOnly]);

		// --------------------------------------------------------------------------
		// 3. HTML5 Drag-and-Drop Stencil Dropzone
		// --------------------------------------------------------------------------
		const handleDragOver = (e: React.DragEvent) => {
			if (readOnly || layoutOnly) return;
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
			if (readOnly || layoutOnly) return;
			e.preventDefault();
			setIsDragOver(false);

			if (!graphRef.current || !containerRef.current) return;
			const rect = containerRef.current.getBoundingClientRect();
			const clientX = e.clientX - rect.left;
			const clientY = e.clientY - rect.top;
			const graph = graphRef.current;
			const localPos = graph.clientToLocal({ x: clientX, y: clientY });

			const boundaryKind = e.dataTransfer.getData('application/aim-boundary');
			if (boundaryKind) {
				const isPkg = boundaryKind.toLowerCase() === 'package';
				const defaultName = isPkg ? 'Namespace' : 'DomainClass';
				const width = isPkg ? 340 : 320;
				const height = isPkg ? 240 : 220;
				const id = `boundary_${Date.now().toString(36).slice(-4)}`;
				const boundaryData: RaidBoundaryData = {
					id,
					kind: isPkg ? 'Package' : 'Class',
					name: defaultName,
					elementIds: [],
					bounds: {
						x: Math.round(localPos.x - width / 2),
						y: Math.round(localPos.y - height / 2),
						width,
						height,
					},
				};
				const boundaryMeta = createAimBoundary(boundaryData);
				const node = graph.addNode(boundaryMeta);
				node.setZIndex(0);
				selectedCellIdRef.current = id;
				onSelectRef.current?.({ id, kind: 'cls', label: defaultName });
				onSelectionChangeRef.current?.([id]);
				triggerDebouncedChange();
				return;
			}

			const kind = (e.dataTransfer.getData('application/aoaim-kind') ||
				e.dataTransfer.getData('application/aim-stencil') ||
				e.dataTransfer.getData('text/plain')) as AimOntologyKind;

			if (!kind) return;

			let customData: Partial<RaidNodeData> | undefined;
			const customDataRaw = e.dataTransfer.getData('application/aim-custom-data');
			if (customDataRaw) {
				try {
					customData = JSON.parse(customDataRaw);
				} catch {}
			}
			const isUnbound = e.dataTransfer.getData('application/aim-unbound') === 'true';
			if (isUnbound) {
				customData = {
					...(customData ?? {}),
					unbound: true,
				};
			}

			if (!isNodeAllowedInDiagram({ ...customData, kind }, new DOMParser().parseFromString(svgPropRef.current, 'image/svg+xml').documentElement.getAttribute('aim-archetype') ?? '')) return;

			const defaultBounds = getDefaultNodeBounds(kind, localPos.x, localPos.y);
			const bounds = {
				...defaultBounds,
				...(customData?.bounds ?? {}),
				x: Math.round(localPos.x - (customData?.bounds?.width ?? defaultBounds.width) / 2),
				y: Math.round(localPos.y - (customData?.bounds?.height ?? defaultBounds.height) / 2),
			};

			const defaultName = getDefaultNodeName(kind);
			const id = `${kind.toUpperCase()}_${Date.now().toString(36).slice(-4)}`;

			const nodeData: RaidNodeData = {
				id,
				kind,
				displayName: customData?.displayName ?? defaultName,
				...(customData?.qualifier !== undefined ? { qualifier: customData.qualifier } : {}),
				instance: isInstanceNode({ kind, ...(customData?.instance !== undefined ? { instance: customData.instance } : {}), ...(customData?.slot ? { slot: true } : {}) }),
				...(customData?.slot === true ? { slot: true } : {}),
				...(customData?.restriction ? { restriction: customData.restriction } : {}),
				...(customData?.state ? { state: customData.state } : {}),
				...(customData?.description !== undefined ? { description: customData.description } : {}),
				...(customData?.descriptionWidth !== undefined ? { descriptionWidth: customData.descriptionWidth } : {}),
				...(customData?.stereotype !== undefined ? { stereotype: customData.stereotype } : (kind === 'plc' ? { stereotype: 'Venue' } : {})),
				...(customData?.attributes !== undefined ? { attributes: customData.attributes } : {}),
				...(customData?.methods !== undefined ? { methods: customData.methods } : {}),
				...(customData?.properties !== undefined ? { properties: customData.properties } : {}),
				...(customData?.unbound !== undefined ? { unbound: customData.unbound } : {}),
				...(customData?.href !== undefined ? { href: customData.href } : {}),
				...(customData?.stereotypeGlyph ? { stereotypeGlyph: customData.stereotypeGlyph } : {}),
				bounds,
			};

			const nodeMeta = createAimNode(nodeData);
			graph.addNode(nodeMeta);

			selectedCellIdRef.current = id;
			onSelectRef.current?.({ id, kind, label: nodeData.displayName });
			onSelectionChangeRef.current?.([id]);
			onDropStencilRef.current?.(kind, { x: bounds.x, y: bounds.y });
			triggerDebouncedChange();
		};

		return (
			<div
				ref={wrapperRef}
				className={`raid-canvas-wrapper ${onNodeClick ? 'aim-inspectable' : ''} ${className ?? ''}`.replace(/\s+/g, ' ').trim()}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				style={{
					position: 'relative',
					width: '100%',
					height: '100%',
					minHeight: 300,
					overflow: 'hidden',
					background: isDragOver ? CascaisPalette.EmeraldWhisper : CascaisPalette.ChalkWhite,
					outline: isDragOver ? `2px dashed ${CascaisPalette.TelemetryGreen}` : 'none',
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
							background: CascaisPalette.TelemetryGreen,
							color: CascaisPalette.ChalkWhite,
							borderRadius: 20,
							fontSize: 12,
							fontWeight: 600,
							boxShadow: `0 4px 12px ${withAlpha(CascaisPalette.TelemetryGreen, 0.3)}`,
							pointerEvents: 'none',
						}}
					>
						Drop to Instantiate AOAIM Node
					</div>
				)}

				{/* Built-in Navigation & Zoom Controls */}
				{showToolbar && (
					<div
						className="raid-ui raid-canvas-toolbar join"
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
							className="btn btn-xs btn-ghost btn-square"
                            style={toolbarBtnStyle}
						>
							➕
						</button>
						<button
							type="button"
							title="Zoom Out"
							aria-label="Zoom Out"
							onClick={handleZoomOut}
							className="btn btn-xs btn-ghost btn-square"
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
							className="btn btn-xs btn-ghost btn-square"
                            style={toolbarBtnStyle}
						>
							⛶
						</button>
						<button
							type="button"
							title="Center Content"
							aria-label="Center Content"
							onClick={handleCenter}
							className="btn btn-xs btn-ghost btn-square"
                            style={toolbarBtnStyle}
						>
							🎯
						</button>
						<button
							type="button"
							title="Reset View (100%)"
							aria-label="Reset View"
							onClick={handleResetView}
							className="btn btn-xs btn-ghost btn-square"
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
