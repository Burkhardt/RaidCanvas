import { projectRoleAttributes, classAttributeLines, isInstanceNode, restrictionTag } from './RoleModel.js';
/**
 * @file RaiBridge.ts
 * @description Bidirectional synchronization bridge between the SVG `aim-*` ontological
 * contract and AntV X6 Graph models.
 *
 * Capabilities:
 * - Hydrate: Ingests an SVG containing `aim-*` semantic attributes and inflates an interactive
 *   AntV X6 graph with orthogonal ports and Manhattan-routed edges.
 * - Serialize: Extracts updated coordinates, node dimensions, and user-dragged bend points from
 *   the X6 graph, serializing them back into the SVG document while preserving semantic fidelity.
 */

import { Graph } from '@antv/x6';
import {
	AimSvgContract,
	type AimOntologyKind,
	type AimEdgeKind,
	type AimRoutingMode,
	type RaidNodeData,
	type RaidEdgeData,
	type RaidBoundaryData,
	type RaidMetamodel,
	type SvgBendPoint,
	type Bounds,
	type HydrationOptions,
	type SerializationOptions,
} from './types.js';
import {
	layoutDescription,
	wrapDescription,
	createAimNode,
	createAimEdge,
	createAimBoundary,
	configureAimGraph,
	CascaisPalette,
	wrapAimText,
	computeMaxLineLength,
	computeExpressionPillColors,
	OBJECT_FOLD,
	objectCardOutline,
	objectFoldFlap,
} from './X6Shapes.js';
import {
	resolveStereotype,
	isInitiatingStereotype,
	renderStereotypeIconSvg,
} from './StereotypeIcons.js';
import {
	resolveStereotypeGlyph,
	resolveStereotypeGlyphs,
	splitStereotypeGlyphRefs,
	getStereotypeGlyphUrl,
	computeStereotypeGlyphLayout,
	GLYPH_EDGE_SIZE,
} from './StereotypeGlyphs.js';
import { DualityWashStrength, GenericRoleLine, HeraldicWash } from './CascaisTheme.js';
import { EDGE_HEAD_PATHS, EDGE_TAIL_PATHS, edgeHeadMarkerId, edgeLabelOf, edgeLineOf, edgeTailMarkerId, type MarkerPath } from './EdgeGrammar.js';
import { renderShapeFigureSvg, shapeFigureOf, shapeFigurePlacement, shapeNodeWidth } from './ShapeFigures.js';

/**
 * Press and hover feedback embedded in exported SVGs, matching the live canvas: the portal anchor raises the door to
 * the hover wash and the chevron to full Vermelho. Pressing applies to every input; hover only to a mouse or trackpad,
 * because the iPad has no hover and ungated :hover styles stick after a tap in WebKit.
 */
const PORTAL_FEEDBACK_STYLES = [
	`a:active > .aim-portal-door { fill: ${HeraldicWash.vermelho(DualityWashStrength.hover)}; }`,
	`a:active > .aim-portal-chevron { fill: ${CascaisPalette.BandeiraVermelho}; }`,
	'@media (hover: hover) and (pointer: fine) {',
	'.aim-node:hover { filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); }',
	`a:hover > .aim-portal-door { fill: ${HeraldicWash.vermelho(DualityWashStrength.hover)}; }`,
	`a:hover > .aim-portal-chevron { fill: ${CascaisPalette.BandeiraVermelho}; }`,
	'}',
].join(' ');

/**
 * CR055 (Koyo D5) — a static export shows a linked node at rest: the door is a clear click target, and only
 * the Net Gold seam and the Vermelho chevron mark the portal. Older SVGs (an emerald door, or a painted
 * persona) heal on their next save: personas go, doors clear, chevrons turn Vermelho. Idempotent.
 */
function healPortalAtRest(doc: Document): void {
	for (const persona of Array.from(doc.querySelectorAll('.aim-portal-persona'))) {
		persona.remove();
	}
	for (const door of Array.from(doc.querySelectorAll('.aim-portal-door'))) {
		door.setAttribute('fill', HeraldicWash.vermelho(0));
	}
	for (const chevron of Array.from(doc.querySelectorAll('.aim-portal-chevron'))) {
		chevron.setAttribute('fill', HeraldicWash.vermelho(DualityWashStrength.chevron));
	}
}

/**
 * CR053 — the value written to `aim-stereotype-glyph`: the canonical file name when the library knows
 * the glyph, otherwise the reference verbatim, so a glyph from a newer library survives a round trip.
 */
function stereotypeGlyphAttrValue(cell: { readonly stereotypeGlyph?: string | undefined }): string | undefined {
	const refs = splitStereotypeGlyphRefs(cell.stereotypeGlyph);
	if (refs.length === 0) return undefined;
	return refs.map((ref) => resolveStereotypeGlyph(ref)?.file ?? ref).join(', ');
}

/**
 * CR053 — headless edge pictogram box: centred on the midpoint, or stacked above `stackTop`
 * (the top of the label / expression pill). `undefined` for no glyph or an unknown one.
 */
function edgeGlyphPlacement(
	edge: RaidEdgeData,
	mid: { x: number; y: number },
	stackTop: number | undefined,
): { url: string; x: number; y: number; size: number } | undefined {
	const entry = resolveStereotypeGlyph(edge.stereotypeGlyph);
	const url = entry ? getStereotypeGlyphUrl(entry.file) : undefined;
	if (!url) return undefined;
	const size = GLYPH_EDGE_SIZE;
	return { url, x: mid.x - size / 2, y: stackTop === undefined ? mid.y - size / 2 : stackTop - 2 - size, size };
}

/**
 * Escapes XML special characters for safe inclusion in XML text nodes.
 * Replaces &, <, and >.
 */
export function escapeXmlText(str: string): string {
	if (!str) return '';
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

/**
 * Escapes XML special characters for safe inclusion in XML attribute values.
 * Replaces &, <, >, ", and '.
 */
export function escapeXmlAttr(str: string): string {
	if (!str) return '';
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

/**
 * Every edge marker the grammar knows, heads and tails, as SVG `<marker>` elements. They share one box
 * touching the node at (10, 5); `auto-start-reverse` turns a tail round at the start of the line.
 */
function edgeMarkersSvg(): { id: string; svg: string }[] {
	const marker = (id: string, { d, fill }: MarkerPath) => ({
		id,
		svg: `<marker id="${id}" viewBox="-1 -1 12 13" refX="10" refY="5" markerWidth="8" markerHeight="8.7" orient="auto-start-reverse">`
			+ `<path d="${d}" fill="${fill === 'ink' ? CascaisPalette.WarmGraphite : fill === 'paper' ? CascaisPalette.ChalkWhite : 'none'}" stroke="${CascaisPalette.WarmGraphite}" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round" /></marker>`,
	});
	return [
		...(Object.entries(EDGE_HEAD_PATHS) as [keyof typeof EDGE_HEAD_PATHS, MarkerPath][]).map(([head, path]) => marker(edgeHeadMarkerId(head), path)),
		...(Object.entries(EDGE_TAIL_PATHS) as [keyof typeof EDGE_TAIL_PATHS, MarkerPath][]).map(([tail, path]) => marker(edgeTailMarkerId(tail), path)),
	];
}

export class RaiBridge {
	private readonly diagramContexts = new WeakMap<Graph, Pick<RaidMetamodel, 'diagramId' | 'archetype' | 'metadata'>>();
	/**
	 * Escapes XML text content.
	 */
	public escapeXmlText(str: string): string {
		return escapeXmlText(str);
	}

	/**
	 * Escapes XML attribute values.
	 */
	public escapeXmlAttr(str: string): string {
		return escapeXmlAttr(str);
	}

	/**
	 * Hydrates an AntV X6 graph from an SVG source string or DOM Element.
	 *
	 * @param svgSource Raw SVG markup string or SVGSVGElement DOM node.
	 * @param graph The AntV X6 Graph instance to populate.
	 * @param options Hydration options.
	 * @returns The extracted RaidMetamodel representation.
	 */
	public hydrateFromSvg(
		svgSource: string | Element,
		graph: Graph,
		options: HydrationOptions = {},
	): RaidMetamodel {
		configureAimGraph(graph);

		if (options.clearGraph !== false) {
			graph.clearCells();
		}

		const metamodel = projectRoleAttributes(this.extractMetamodel(svgSource, options));
        (graph as Graph & { _aimShowExpressions?: boolean })._aimShowExpressions = metamodel.showExpressions ?? true;
		this.diagramContexts.set(graph, { diagramId: metamodel.diagramId, archetype: metamodel.archetype, ...(metamodel.metadata ? { metadata: metamodel.metadata } : {}) });

		// 0. Add all boundary nodes to graph at zIndex 0
		if (metamodel.boundaries) {
			for (const boundaryData of metamodel.boundaries) {
				const boundaryMeta = createAimBoundary(boundaryData);
				const boundaryNode = graph.addNode(boundaryMeta);
				boundaryNode.setZIndex(0);
			}
		}

		// 1. Add all nodes to graph
		for (const nodeData of metamodel.nodes) {
			const nodeMeta = createAimNode(nodeData);
			const node = graph.addNode(nodeMeta);
			if (nodeData.boundaryId) {
				const boundaryNode = graph.getCellById(nodeData.boundaryId);
				if (boundaryNode && boundaryNode.isNode()) {
					boundaryNode.addChild(node);
				}
			}
		}

		// 1b. Embed any additional children specified in boundary elementIds
		if (metamodel.boundaries) {
			for (const boundaryData of metamodel.boundaries) {
				const boundaryNode = graph.getCellById(boundaryData.id);
				if (boundaryNode && boundaryNode.isNode()) {
					for (const elemId of boundaryData.elementIds) {
						const childNode = graph.getCellById(elemId);
						if (childNode && childNode.isNode() && !childNode.getParent()) {
							boundaryNode.addChild(childNode);
						}
					}
				}
			}
		}

		// 2. Add all edges to graph
		for (const edgeData of metamodel.edges) {
			const edgeMeta = createAimEdge(edgeData, metamodel.showExpressions ?? true);
			graph.addEdge(edgeMeta);
		}

		return metamodel;
	}

	/**
	 * Serializes current X6 graph layout (positions, bounds, bend points) back into an SVG document.
	 *
	 * @param graph The AntV X6 Graph instance.
	 * @param baseSvg Optional base SVG string to update in-place.
	 * @param options Serialization options.
	 * @returns The updated SVG markup string adhering to the aim-* contract.
	 */
	public serializeToSvg(
		graph: Graph,
		baseSvg?: string,
		options: SerializationOptions = {},
	): string {
		const metamodel = projectRoleAttributes(this.metamodelFromGraph(graph));
        for (const node of metamodel.nodes) {
            if (node.kind === 'cls') {
                const cell = graph.getCellById(node.id);
                if (cell?.isNode()) {
                    cell.setData({ ...cell.getData(), roleAttributes: node.roleAttributes }, { silent: true });
                    cell.setAttrByPath('attributes/text', classAttributeLines(node).join('\n'));
                }
            }
        }

		if (baseSvg) {
			return this.updateExistingSvg(baseSvg, metamodel, options);
		}

		return this.generateFreshSvg(metamodel, options);
	}

	/**
	 * Extracts a pure RaidMetamodel from an active AntV X6 Graph.
	 */
	public metamodelFromGraph(graph: Graph): RaidMetamodel {
		const nodes: RaidNodeData[] = [];
		const edges: RaidEdgeData[] = [];
		const boundaries: RaidBoundaryData[] = [];

		// Extract nodes and boundaries
		const x6Nodes = graph.getNodes();
		for (const node of x6Nodes) {
			const pos = node.getPosition();
			const size = node.getSize();
			const customData = (node.getData() ?? {}) as Record<string, any>;

			if (
				node.shape === 'aim-boundary' ||
				node.shape === 'aim-boundary-class' ||
				node.shape === 'aim-boundary-package' ||
				customData.isBoundary
			) {
				const children =
					node.getChildren()?.filter((c) => c.isNode()).map((c) => String(c.id)) ??
					(customData.elementIds ?? []);
				const headerText = (node.getAttrByPath('headerText/text') as string) ?? '';
				const rawName =
					customData.name ??
					headerText.replace(/^(Class|Package):\s*/, '').trim() ??
					String(node.id);
				const kind = customData.kind ?? (node.shape === 'aim-boundary-package' ? 'Package' : 'Class');

				boundaries.push({
					id: String(node.id),
					kind,
					name: rawName,
					...(customData.package ? { package: customData.package } : {}),
					...(customData.href ? { href: customData.href } : {}),
					elementIds: Array.from(new Set(children)),
					bounds: {
						x: pos.x,
						y: pos.y,
						width: size.width,
						height: size.height,
					},
					...(customData.properties ? { properties: customData.properties } : {}),
				});
				continue;
			}

			const id = node.id;
			const kind = (customData.kind ?? this.kindFromShape(node.shape)) as AimOntologyKind;
			const displayName = customData.displayName ?? (node.getAttrByPath('label/text') as string) ?? id;
			const isSlot = customData.slot === true;
			// A slot's qualifier element shows `: <Class>`, which is the restriction, not a qualifier
			const qualifier = customData.qualifier ?? (isSlot ? undefined : (node.getAttrByPath('qualifier/text') as string)) ?? undefined;
			const isInstance = isSlot
				? undefined
				: customData.instance ??
					(node.getAttrByPath('label/textDecoration') === 'underline' ||
					node.getAttrByPath('title/textDecoration') === 'underline'
						? true
						: undefined);
			const parentNode = node.getParent();
			const boundaryId =
				parentNode &&
				(parentNode.shape?.startsWith('aim-boundary') ||
					(parentNode.getData() as any)?.isBoundary)
					? String(parentNode.id)
					: (customData.boundaryId ?? undefined);

			const nodeData: RaidNodeData = {
				id,
				kind,
				displayName,
				...(qualifier ? { qualifier } : {}),
				...(isInstance !== undefined ? { instance: isInstance } : {}),
				...(customData.unbound === true ? { unbound: true } : {}),
				...(isSlot ? { slot: true } : {}),
				...(customData.restriction ? { restriction: customData.restriction } : {}),
				...(customData.state ? { state: customData.state } : {}),
				...(boundaryId ? { boundaryId } : {}),
				...(customData.stereotype !== undefined ? { stereotype: customData.stereotype } : {}),
				...(customData.stereotypeGlyph ? { stereotypeGlyph: customData.stereotypeGlyph } : {}),
				...(customData.namespace !== undefined ? { namespace: customData.namespace } : {}),
				...(customData.description !== undefined ? { description: customData.description } : {}),
				...(customData.descriptionWidth !== undefined ? { descriptionWidth: customData.descriptionWidth } : {}),
				...(customData.visibility !== undefined ? { visibility: customData.visibility } : {}),
				...(customData.attributes !== undefined ? { attributes: customData.attributes } : {}),
				...(customData.methods !== undefined ? { methods: customData.methods } : {}),
				bounds: {
					x: pos.x,
					y: pos.y,
					width: size.width,
					height: size.height,
				},
				...(customData.href !== undefined && customData.href.trim().length > 0 ? { href: customData.href.trim() } : {}),
				...(customData.properties !== undefined ? { properties: customData.properties } : {}),
			};

			nodes.push(nodeData);
		}

		// Extract edges
		const x6Edges = graph.getEdges();
		for (const edge of x6Edges) {
			const source = edge.getSourceCell();
			const target = edge.getTargetCell();
			if (!source || !target) continue;

			const vertices = edge.getVertices();
			const bendPoints: SvgBendPoint[] = vertices.map((v) => ({ x: v.x, y: v.y }));
			const customData = (edge.getData() ?? {}) as Partial<RaidEdgeData>;

			const sourcePort = edge.getSourcePortId();
			const targetPort = edge.getTargetPortId();
			const label = (edge.getLabels()?.[0]?.attrs?.['text']?.['text'] as string | undefined) ?? customData.label;

			let routing: AimRoutingMode | undefined = customData.routing;
			if (!routing) {
				const router = edge.getRouter();
				const routerName = typeof router === 'string' ? router : router?.name;
				const connector = edge.getConnector();
				const connectorName = typeof connector === 'string' ? connector : connector?.name;
				if (connectorName === 'smooth') {
					routing = 'smooth';
				} else if (routerName === 'normal') {
					routing = 'normal';
				} else if (routerName === 'manhattan') {
					routing = 'manhattan';
				}
			}

			// Extract live rendered SVG path data from X6 EdgeView if available
			let pathData: string | undefined = customData.pathData;
			if (!pathData) {
				const edgeView =
					typeof (graph as unknown as { findViewByCell?: (cell: unknown) => unknown }).findViewByCell === 'function'
						? (
								graph as unknown as {
									findViewByCell: (cell: unknown) => {
										getConnectionPathData?: () => string;
										container?: Element;
									} | null;
								}
							).findViewByCell(edge)
						: null;

				if (edgeView) {
					if (typeof edgeView.getConnectionPathData === 'function') {
						const d = edgeView.getConnectionPathData();
						if (d && d.trim().length > 0) pathData = d;
					}
					if (!pathData && edgeView.container) {
						const pathEl = edgeView.container.querySelector('path[d]');
						const d = pathEl?.getAttribute('d');
						if (d && d.trim().length > 0) pathData = d;
					}
				}
			}

			const edgeData: RaidEdgeData = {
				...(customData.directed !== undefined ? { directed: customData.directed } : {}),
				id: edge.id,
				kind: customData.kind ?? 'association',
				sourceId: source.id,
				targetId: target.id,
				...(sourcePort !== undefined ? { sourcePort } : {}),
				...(targetPort !== undefined ? { targetPort } : {}),
				...(routing !== undefined ? { routing } : {}),
				...(label !== undefined ? { label } : {}),
				...(customData.stereotype !== undefined ? { stereotype: customData.stereotype } : {}),
				...(customData.stereotypeGlyph ? { stereotypeGlyph: customData.stereotypeGlyph } : {}),
				...(customData.sourceCardinality !== undefined ? { sourceCardinality: customData.sourceCardinality } : {}),
				...(customData.targetCardinality !== undefined ? { targetCardinality: customData.targetCardinality } : {}),
				...(customData.expression !== undefined ? { expression: customData.expression } : {}),
				...(customData.expressionColor !== undefined ? { expressionColor: customData.expressionColor } : {}),
				...(customData.satisfied !== undefined ? { satisfied: customData.satisfied } : {}),
				...(customData.ast !== undefined ? { ast: customData.ast } : {}),
				bendPoints,
				...(pathData !== undefined ? { pathData } : {}),
			};

			edges.push(edgeData);
		}

		const diagramRouting = (graph as unknown as { _aimRoutingMode?: AimRoutingMode })._aimRoutingMode;

		return {
			diagramId: 'RaidDiagram',
			archetype: 'InteractiveCanvas',
			...this.diagramContexts.get(graph),
            showExpressions: (graph as Graph & { _aimShowExpressions?: boolean })._aimShowExpressions ?? true,
			nodes,
			edges,
			...(boundaries.length > 0 ? { boundaries } : {}),
			...(diagramRouting !== undefined ? { routing: diagramRouting } : {}),
		};
	}

	/**
	 * Parses semicolon-separated bend points: "100,50; 200,50; 200,150"
	 */
	public parseBendPoints(bendsStr: string): SvgBendPoint[] {
		if (!bendsStr || bendsStr.trim().length === 0) {
			return [];
		}

		return bendsStr
			.split(';')
			.map((part) => part.trim())
			.filter((part) => part.length > 0)
			.map((part) => {
				const [xStr, yStr] = part.split(',');
				const x = parseFloat(xStr?.trim() ?? '0');
				const y = parseFloat(yStr?.trim() ?? '0');
				return { x: Number.isNaN(x) ? 0 : x, y: Number.isNaN(y) ? 0 : y };
			});
	}

	/**
	 * Formats bend points into the canonical aim-bends format: "x1,y1; x2,y2"
	 */
	public formatBendPoints(points: readonly SvgBendPoint[]): string {
		return points.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`).join('; ');
	}

	/**
	 * Computes a clean fallback SVG path connecting source and target nodes
	 * when running in headless environments (e.g. CLI, tests) without an active DOM.
	 */
	public computeFallbackEdgePath(
		sourceNode: RaidNodeData,
		targetNode: RaidNodeData,
		bendPoints: readonly SvgBendPoint[] = [],
		routingMode: AimRoutingMode = 'manhattan',
	): string {
		const scx = Math.round(sourceNode.bounds.x + sourceNode.bounds.width / 2);
		const scy = Math.round(sourceNode.bounds.y + sourceNode.bounds.height / 2);
		const tcx = Math.round(targetNode.bounds.x + targetNode.bounds.width / 2);
		const tcy = Math.round(targetNode.bounds.y + targetNode.bounds.height / 2);

		let sx = scx;
		let sy = scy;
		let tx = tcx;
		let ty = tcy;

		const dx = tcx - scx;
		const dy = tcy - scy;

		if (Math.abs(dx) >= Math.abs(dy)) {
			if (dx > 0) {
				sx = Math.round(sourceNode.bounds.x + sourceNode.bounds.width);
				sy = scy;
				tx = Math.round(targetNode.bounds.x);
				ty = tcy;
			} else {
				sx = Math.round(sourceNode.bounds.x);
				sy = scy;
				tx = Math.round(targetNode.bounds.x + targetNode.bounds.width);
				ty = tcy;
			}
		} else {
			if (dy > 0) {
				sx = scx;
				sy = Math.round(sourceNode.bounds.y + sourceNode.bounds.height);
				tx = tcx;
				ty = Math.round(targetNode.bounds.y);
			} else {
				sx = scx;
				sy = Math.round(sourceNode.bounds.y);
				tx = tcx;
				ty = Math.round(targetNode.bounds.y + targetNode.bounds.height);
			}
		}

		if (bendPoints.length > 0) {
			return `M ${sx} ${sy} ` + bendPoints.map((p) => `L ${Math.round(p.x)} ${Math.round(p.y)}`).join(' ') + ` L ${tx} ${ty}`;
		}

		if (routingMode === 'normal') {
			return `M ${sx} ${sy} L ${tx} ${ty}`;
		}

		if (routingMode === 'smooth') {
			if (Math.abs(dx) >= Math.abs(dy)) {
				const midX = Math.round((sx + tx) / 2);
				return `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`;
			} else {
				const midY = Math.round((sy + ty) / 2);
				return `M ${sx} ${sy} C ${sx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`;
			}
		}

		// Manhattan orthogonal default
		if (Math.abs(dx) >= Math.abs(dy)) {
			const midX = Math.round((sx + tx) / 2);
			return `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${ty} L ${tx} ${ty}`;
		} else {
			const midY = Math.round((sy + ty) / 2);
			return `M ${sx} ${sy} L ${sx} ${midY} L ${tx} ${midY} L ${tx} ${ty}`;
		}
	}

	// --------------------------------------------------------------------------
	// Private Helper Implementation
	// --------------------------------------------------------------------------

	private resolveSvgElement(source: string | Element): Element {
		if (typeof source !== 'string') {
			return source;
		}

		if (typeof DOMParser !== 'undefined') {
			const parser = new DOMParser();
			const parsed = parser.parseFromString(source, 'image/svg+xml');
			const root = parsed.documentElement;
			if (root.tagName.toLowerCase() === 'parsererror') {
				throw new Error('Failed to parse SVG: XML Parser Error');
			}
			return root;
		}

		throw new Error('DOMParser unavailable in current execution environment');
	}

	public extractMetamodel(source: string | Element, options: HydrationOptions = {}): RaidMetamodel {
		const svgRoot = this.resolveSvgElement(source);
		const nodes: RaidNodeData[] = [];
		const edges: RaidEdgeData[] = [];

		// 1. Locate all node elements
		const nodeElements = Array.from(
			svgRoot.querySelectorAll(AimSvgContract.SELECTOR_NODE),
		);

		for (const el of nodeElements) {
			const id =
				el.getAttribute(AimSvgContract.ATTR_ID) ??
				el.getAttribute('data-node') ??
				el.getAttribute('data-element-id') ??
				el.getAttribute('id');

			if (!id) continue;

			const rawKind = el.getAttribute(AimSvgContract.ATTR_KIND) ?? 'act';
			const kind = this.normalizeKind(rawKind);

			const displayName =
				el.getAttribute(AimSvgContract.ATTR_DISPLAY_NAME) ??
				el.querySelector('text')?.textContent?.trim() ??
				id;

			const qualifier = el.getAttribute(AimSvgContract.ATTR_QUALIFIER) ?? undefined;
			const slot = el.getAttribute(AimSvgContract.ATTR_SLOT) === 'true' || undefined;
			const restriction = el.getAttribute(AimSvgContract.ATTR_RESTRICTION)?.trim() || undefined;
			const state = el.getAttribute(AimSvgContract.ATTR_STATE)?.trim() || undefined;
			const isInstance = isInstanceNode({ kind, instance: el.getAttribute(AimSvgContract.ATTR_INSTANCE) === 'true', ...(slot ? { slot } : {}) }) ? true : undefined;
			const href =
				el.getAttribute(AimSvgContract.ATTR_HREF) ??
				el.querySelector('a')?.getAttribute('href') ??
				el.querySelector('a')?.getAttribute('xlink:href') ??
				el.getAttribute('href') ??
				undefined;

			const stereotype = el.getAttribute(AimSvgContract.ATTR_STEREOTYPE) ?? undefined;
			const stereotypeGlyph = el.getAttribute(AimSvgContract.ATTR_STEREOTYPE_GLYPH)?.trim() || undefined;
			const bounds = this.extractBounds(el, options.defaultNodeSize);

			const unbound = el.getAttribute(AimSvgContract.ATTR_UNBOUND) === 'true' || undefined;
			const boundaryId = el.getAttribute('aim-boundary-id') ?? undefined;

			nodes.push({
				id,
				kind,
				displayName,
				...(qualifier !== undefined ? { qualifier } : {}),
				...(isInstance !== undefined ? { instance: isInstance } : {}),
				...(unbound ? { unbound: true } : {}),
				...(slot ? { slot: true } : {}),
				...(restriction ? { restriction } : {}),
				...(state ? { state } : {}),
				...(boundaryId ? { boundaryId } : {}),
				...(href !== undefined && href.trim().length > 0 ? { href: href.trim() } : {}),
				...(stereotype !== undefined ? { stereotype } : {}),
				...(stereotypeGlyph ? { stereotypeGlyph } : {}),
				...(el.getAttribute('aim-description') ? { description: JSON.parse(el.getAttribute('aim-description')!) } : {}),
				...(el.getAttribute('aim-descriptionWidth') ? { descriptionWidth: JSON.parse(el.getAttribute('aim-descriptionWidth')!) } : {}),
				...(el.getAttribute('aim-visibility') ? { visibility: JSON.parse(el.getAttribute('aim-visibility')!) } : {}),
				...(el.getAttribute('aim-attributes') ? { attributes: JSON.parse(el.getAttribute('aim-attributes')!) } : {}),
				...(el.getAttribute('aim-methods') ? { methods: JSON.parse(el.getAttribute('aim-methods')!) } : {}),
				...(el.getAttribute('aim-properties') ? { properties: JSON.parse(el.getAttribute('aim-properties')!) } : {}),
				...(el.getAttribute('aim-namespace') ? { namespace: el.getAttribute('aim-namespace')! } : {}),
				bounds,
			});
		}

		// 1b. Locate all boundary elements
		const boundaryElements = Array.from(
			svgRoot.querySelectorAll(AimSvgContract.SELECTOR_BOUNDARY),
		);
		const boundaries: RaidBoundaryData[] = [];

		for (const el of boundaryElements) {
			const id =
				el.getAttribute(AimSvgContract.ATTR_ID) ??
				el.getAttribute('id') ??
				`boundary_${boundaries.length + 1}`;
			const rawKind = el.getAttribute(AimSvgContract.ATTR_BOUNDARY);
			const kind = rawKind && rawKind !== 'true' ? rawKind : (el.classList?.contains('aim-boundary-package') ? 'Package' : 'Class');
			const name =
				el.getAttribute(AimSvgContract.ATTR_BOUNDARY_NAME) ??
				el.querySelector('.aim-boundary-header-text, text')?.textContent?.replace(/^(Class|Package):\s*/, '')?.trim() ??
				id;
			const pkg = el.getAttribute(AimSvgContract.ATTR_BOUNDARY_PACKAGE) ?? undefined;
			const href = el.getAttribute(AimSvgContract.ATTR_HREF) ?? undefined;
			const elementsAttr = el.getAttribute(AimSvgContract.ATTR_BOUNDARY_ELEMENTS);
			const elementIds = elementsAttr
				? elementsAttr.split(',').map((s) => s.trim()).filter(Boolean)
				: [];
			const bounds = this.extractBounds(el, { width: 320, height: 220 });

			boundaries.push({
				id,
				kind,
				name,
				...(pkg ? { package: pkg } : {}),
				...(href ? { href } : {}),
				elementIds,
				bounds,
			});
		}

		// 2. Locate all edge elements
		const edgeElements = Array.from(
			svgRoot.querySelectorAll(AimSvgContract.SELECTOR_EDGE),
		);

		for (const el of edgeElements) {
			const id = el.getAttribute(AimSvgContract.ATTR_ID) ?? el.getAttribute('id') ?? `edge-${edges.length + 1}`;
			const sourceId = el.getAttribute(AimSvgContract.ATTR_SOURCE);
			const targetId = el.getAttribute(AimSvgContract.ATTR_TARGET);

			if (!sourceId || !targetId) continue;

			const rawEdgeKind = el.getAttribute(AimSvgContract.ATTR_EDGE_KIND) ?? 'association';
			const kind = this.normalizeEdgeKind(rawEdgeKind);

			const bendsAttr = el.getAttribute(AimSvgContract.ATTR_BENDS) ?? '';
			const bendPoints = this.parseBendPoints(bendsAttr);

			const label =
				el.getAttribute('aim-label') ??
				el.querySelector('text')?.textContent?.trim() ??
				undefined;

			const expression = el.getAttribute(AimSvgContract.ATTR_EXPRESSION) ?? undefined;
			const expressionColor = el.getAttribute(AimSvgContract.ATTR_EXPRESSION_COLOR) ?? undefined;
			const satisfiedAttr = el.getAttribute(AimSvgContract.ATTR_SATISFIED);
			const satisfied = satisfiedAttr === 'true' ? true : (satisfiedAttr === 'false' ? false : undefined);

			let sourcePort = el.getAttribute(AimSvgContract.ATTR_SOURCE_PORT) ?? undefined;
			let targetPort = el.getAttribute(AimSvgContract.ATTR_TARGET_PORT) ?? undefined;

			const sourceNode = nodes.find((n) => n.id === sourceId);
			const targetNode = nodes.find((n) => n.id === targetId);

			// Infer optimal orthogonal docking ports only if explicitly requested in options
			if (options.inferPorts === true && sourceNode && targetNode) {
				const dx =
					targetNode.bounds.x +
					targetNode.bounds.width / 2 -
					(sourceNode.bounds.x + sourceNode.bounds.width / 2);
				const dy =
					targetNode.bounds.y +
					targetNode.bounds.height / 2 -
					(sourceNode.bounds.y + sourceNode.bounds.height / 2);

				if (!sourcePort) {
					sourcePort =
						Math.abs(dx) >= Math.abs(dy)
							? dx >= 0
								? 'port-right'
								: 'port-left'
							: dy >= 0
								? 'port-bottom'
								: 'port-top';
				}
				if (!targetPort) {
					targetPort =
						Math.abs(dx) >= Math.abs(dy)
							? dx >= 0
								? 'port-left'
								: 'port-right'
							: dy >= 0
								? 'port-top'
								: 'port-bottom';
				}
			}

			// If bendPoints contains only the 2 terminal endpoints of a straight connector,
			// clear them so the orthogonal router doesn't treat the terminals as obstacle waypoints
			const isTerminalOnly =
				bendPoints.length === 2 &&
				sourceNode &&
				targetNode &&
				((Math.abs(bendPoints[0]!.y - bendPoints[1]!.y) < 2 &&
					Math.abs(bendPoints[0]!.y - (sourceNode.bounds.y + sourceNode.bounds.height / 2)) < 40) ||
					(Math.abs(bendPoints[0]!.x - bendPoints[1]!.x) < 2 &&
						Math.abs(bendPoints[0]!.x - (sourceNode.bounds.x + sourceNode.bounds.width / 2)) < 40));
			const effectiveBendPoints = isTerminalOnly ? [] : bendPoints;

			const sourceCardinality =
				el.getAttribute('aim-source-cardinality') ?? undefined;
			const targetCardinality =
				el.getAttribute('aim-target-cardinality') ?? undefined;
			const rawRouting =
				el.getAttribute(AimSvgContract.ATTR_ROUTING) ??
				el.getAttribute('aim-routing') ??
				undefined;
			const routing = rawRouting ? this.normalizeRouting(rawRouting) : undefined;
			const edgeStereotype = el.getAttribute(AimSvgContract.ATTR_STEREOTYPE) ?? undefined;
			const edgeGlyph = el.getAttribute(AimSvgContract.ATTR_STEREOTYPE_GLYPH)?.trim() || undefined;

			edges.push({
				id,
				kind,
				sourceId,
				targetId,
				...(sourcePort !== undefined ? { sourcePort } : {}),
				...(targetPort !== undefined ? { targetPort } : {}),
				...(routing !== undefined ? { routing } : {}),
				...(label !== undefined ? { label } : {}),
				...(edgeStereotype !== undefined ? { stereotype: edgeStereotype } : {}),
				...(edgeGlyph ? { stereotypeGlyph: edgeGlyph } : {}),
				...(expression !== undefined ? { expression } : {}),
				...(expressionColor !== undefined ? { expressionColor } : {}),
				...(satisfied !== undefined ? { satisfied } : {}),
				...(sourceCardinality !== undefined ? { sourceCardinality } : {}),
				...(targetCardinality !== undefined ? { targetCardinality } : {}),
				directed: el.getAttribute('aim-directed') !== 'false',
				bendPoints: effectiveBendPoints,
			});
		}

		const rawDiagramRouting =
			svgRoot.getAttribute(AimSvgContract.ATTR_ROUTING) ??
			svgRoot.getAttribute('aim-routing') ??
			undefined;
		const diagramRouting = rawDiagramRouting ? this.normalizeRouting(rawDiagramRouting) : undefined;

		return {
			diagramId: svgRoot.getAttribute('id') ?? 'ImportedDiagram',
            showExpressions: (svgRoot.getAttribute(AimSvgContract.ATTR_SHOW_EXPRESSIONS) ?? svgRoot.getAttribute('data-aim-show-expressions')) !== 'false',
			archetype: svgRoot.getAttribute('aim-archetype') ?? 'AOAIMDiagram',
			nodes,
			edges,
			...(boundaries.length > 0 ? { boundaries } : {}),
			...(diagramRouting !== undefined ? { routing: diagramRouting } : {}),
		};
	}

	private extractBounds(
		el: Element,
		defaultSize: { width: number; height: number } = { width: 140, height: 60 },
	): Bounds {
		let x = 0;
		let y = 0;
		let width = defaultSize.width;
		let height = defaultSize.height;

		// Check transform matrix or translate
		const transform = el.getAttribute('transform');
		if (transform) {
			const match = /translate\(\s*([-\d.]+)[,\s]+([-\d.]+)\s*\)/.exec(transform);
			if (match && match[1] && match[2]) {
				x = parseFloat(match[1]);
				y = parseFloat(match[2]);
			}
		}

		// Check direct geometry attributes (rect, ellipse, circle)
		const rect = el.querySelector?.('rect') ?? (el.tagName?.toLowerCase() === 'rect' ? el : null);
		if (rect) {
			if (!transform && rect.getAttribute('x')) x = parseFloat(rect.getAttribute('x')!);
			if (!transform && rect.getAttribute('y')) y = parseFloat(rect.getAttribute('y')!);
			if (rect.getAttribute('width')) width = parseFloat(rect.getAttribute('width')!);
			if (rect.getAttribute('height')) height = parseFloat(rect.getAttribute('height')!);
		}

		const ellipse =
			el.querySelector?.('ellipse') ?? (el.tagName?.toLowerCase() === 'ellipse' ? el : null);
		if (ellipse) {
			const rx = parseFloat(ellipse.getAttribute('rx') ?? `${width / 2}`);
			const ry = parseFloat(ellipse.getAttribute('ry') ?? `${height / 2}`);
			width = rx * 2;
			height = ry * 2;
			if (!transform) {
				const cx = parseFloat(ellipse.getAttribute('cx') ?? '0');
				const cy = parseFloat(ellipse.getAttribute('cy') ?? '0');
				x = cx - rx;
				y = cy - ry;
			}
		}

        const circle = !rect && !ellipse ? el.querySelector?.('circle') : null;
        if (circle) {
            const r = Number(circle.getAttribute('r')) || 11;
            width = height = r * 2;
            if (!transform) { x = Number(circle.getAttribute('cx')) - r; y = Number(circle.getAttribute('cy')) - r; }
        }
		return { x, y, width, height };
	}

	public updateExistingSvg(
		baseSvg: string,
		model: RaidMetamodel,
		_options: SerializationOptions = {},
	): string {
		if (typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined') {
			return this.generateFreshSvg(model, _options);
		}

		const parser = new DOMParser();
		const doc = parser.parseFromString(baseSvg, 'image/svg+xml');
		if (doc.documentElement.tagName.toLowerCase() === 'parsererror') {
			throw new Error(`Failed to parse baseSvg: ${doc.documentElement.textContent}`);
		}

		// Ensure defs and arrow markers exist for external vector viewers (Preview, Chrome, Safari)
		let defs = doc.querySelector('defs');
		if (!defs) {
			defs = doc.createElementNS('http://www.w3.org/2000/svg', 'defs');
			doc.documentElement.insertBefore(defs, doc.documentElement.firstChild);
		}
		// Every edge head the grammar knows, so any edge in the file can point at its marker.
		for (const { id, svg: markerSvg } of edgeMarkersSvg()) {
			if (doc.querySelector(`#${id}`)) continue;
			const holder = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${markerSvg}</svg>`, 'image/svg+xml');
			const marker = holder.documentElement.firstElementChild;
			if (marker) defs.appendChild(doc.importNode(marker, true));
		}

		// Ensure AOAIM style rules are present
		let style: Element | null = doc.querySelector('style');
		if (!style) {
			style = doc.createElementNS('http://www.w3.org/2000/svg', 'style');
			defs.appendChild(style);
		}
		if (style && !style.textContent?.includes('aim-instance="true"')) {
			style.textContent = (style.textContent ? style.textContent + '\n' : '') + `
			.aim-node { cursor: pointer; transition: filter 0.15s ease; }
			.aim-portal-seam { stroke: ${CascaisPalette.NetGoldStroke}; stroke-width: 1.5; pointer-events: none; }
			${PORTAL_FEEDBACK_STYLES}
			.aim-edge { fill: none; stroke: ${CascaisPalette.WarmGraphite}; stroke-width: 1.5; }
			text { font-family: Inter, system-ui, sans-serif; }
			.aim-node[aim-instance="true"] text.aim-name, .aim-node[aim-instance="true"] tspan.aim-name { text-decoration: underline; }
`;
		}

		doc.documentElement.setAttribute(AimSvgContract.ATTR_SHOW_EXPRESSIONS, String(model.showExpressions ?? true));

		// Update diagram-level routing mode on root <svg>
		const diagramRouting = _options.routingMode ?? model.routing;
		if (diagramRouting) {
			doc.documentElement.setAttribute(AimSvgContract.ATTR_ROUTING, diagramRouting);
		}

		// Viewport Auto-Bounds: expand root viewBox/width/height so external viewers (Preview/QuickLook)
		// do not clip nodes or edges that have been moved outside the base frame.
		if (_options.autoBounds !== false && model.nodes.length > 0) {
			const padding = _options.viewportPadding ?? 60;
			const viewBoxAttr = doc.documentElement.getAttribute('viewBox');

			let curMinX = 0;
			let curMinY = 0;
			let curWidth = 800;
			let curHeight = 600;

			if (viewBoxAttr) {
				const parts = viewBoxAttr.trim().split(/[\s,]+/).map(Number);
				if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
					curMinX = parts[0]!;
					curMinY = parts[1]!;
					curWidth = parts[2]!;
					curHeight = parts[3]!;
				}
			} else {
				const w = parseFloat(doc.documentElement.getAttribute('width') ?? '800');
				const h = parseFloat(doc.documentElement.getAttribute('height') ?? '600');
				if (!isNaN(w) && w > 0) curWidth = w;
				if (!isNaN(h) && h > 0) curHeight = h;
			}

			let envMinX = curMinX;
			let envMinY = curMinY;
			let envMaxX = curMinX + curWidth;
			let envMaxY = curMinY + curHeight;

			for (const node of model.nodes) {
				envMinX = Math.min(envMinX, node.bounds.x - padding);
				envMinY = Math.min(envMinY, node.bounds.y - padding);
				envMaxX = Math.max(envMaxX, node.bounds.x + node.bounds.width + padding);
				envMaxY = Math.max(envMaxY, node.bounds.y + node.bounds.height + padding);
			}

			for (const b of model.boundaries ?? []) {
				envMinX = Math.min(envMinX, b.bounds.x - padding);
				envMinY = Math.min(envMinY, b.bounds.y - padding);
				envMaxX = Math.max(envMaxX, b.bounds.x + b.bounds.width + padding);
				envMaxY = Math.max(envMaxY, b.bounds.y + b.bounds.height + padding);
			}

			for (const edge of model.edges) {
				for (const bp of edge.bendPoints) {
					envMinX = Math.min(envMinX, bp.x - padding);
					envMinY = Math.min(envMinY, bp.y - padding);
					envMaxX = Math.max(envMaxX, bp.x + padding);
					envMaxY = Math.max(envMaxY, bp.y + padding);
				}
			}

			// Retain 0 origin if original viewBox started at 0 and no content extends into negative coordinates
			if (curMinX === 0 && envMinX > -10) {
				envMinX = 0;
			}
			if (curMinY === 0 && envMinY > -10) {
				envMinY = 0;
			}

			const finalMinX = Math.round(envMinX);
			const finalMinY = Math.round(envMinY);
			const finalWidth = Math.round(envMaxX - envMinX);
			const finalHeight = Math.round(envMaxY - envMinY);

			doc.documentElement.setAttribute('viewBox', `${finalMinX} ${finalMinY} ${finalWidth} ${finalHeight}`);
			if (doc.documentElement.hasAttribute('width')) {
				doc.documentElement.setAttribute('width', `${finalWidth}`);
			}
			if (doc.documentElement.hasAttribute('height')) {
				doc.documentElement.setAttribute('height', `${finalHeight}`);
			}
		}

		// Ensure layers exist
		let nodesLayer = doc.querySelector('.aim-nodes-layer');
		if (!nodesLayer) {
			nodesLayer = doc.documentElement;
		}

		// Remove deleted nodes
		const existingNodeEls = Array.from(doc.querySelectorAll(AimSvgContract.SELECTOR_NODE));
		for (const nodeEl of existingNodeEls) {
			const id = nodeEl.getAttribute(AimSvgContract.ATTR_ID) ?? nodeEl.getAttribute('id');
			if (id && !model.nodes.some((n) => n.id === id)) {
				nodeEl.remove();
			}
		}

		// Update or insert nodes with canonical archetype shape markup
		for (const node of model.nodes) {
			let el = doc.querySelector(`[${AimSvgContract.ATTR_ID}="${node.id}"], [id="${node.id}"]`);
			if (!el) {
				el = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
				nodesLayer.appendChild(el);
			}

			el.setAttribute('transform', `translate(${node.bounds.x}, ${node.bounds.y})`);
			el.setAttribute(AimSvgContract.ATTR_NODE, 'true');
			el.setAttribute(AimSvgContract.ATTR_ID, node.id);
			el.setAttribute(AimSvgContract.ATTR_KIND, node.kind);
			el.setAttribute(AimSvgContract.ATTR_DISPLAY_NAME, node.displayName);
			if (node.href !== undefined && node.href.trim().length > 0) {
				el.setAttribute(AimSvgContract.ATTR_HREF, node.href.trim());
			} else {
				el.removeAttribute(AimSvgContract.ATTR_HREF);
			}
			if (node.qualifier !== undefined && node.qualifier !== '') {
				el.setAttribute(AimSvgContract.ATTR_QUALIFIER, node.qualifier);
			} else {
				el.removeAttribute(AimSvgContract.ATTR_QUALIFIER);
			}
			if (isInstanceNode(node)) {
				el.setAttribute(AimSvgContract.ATTR_INSTANCE, 'true');
			} else {
				el.removeAttribute(AimSvgContract.ATTR_INSTANCE);
			}
			if (node.stereotype) {
				const stereoVal: string = Array.isArray(node.stereotype) ? (node.stereotype as readonly string[]).join(', ') : String(node.stereotype);
				el.setAttribute(AimSvgContract.ATTR_STEREOTYPE, stereoVal);
			} else {
				el.removeAttribute(AimSvgContract.ATTR_STEREOTYPE);
			}
			const glyphRef = stereotypeGlyphAttrValue(node);
			if (glyphRef) {
				el.setAttribute(AimSvgContract.ATTR_STEREOTYPE_GLYPH, glyphRef);
			} else {
				el.removeAttribute(AimSvgContract.ATTR_STEREOTYPE_GLYPH);
			}

			if (node.unbound === true) {
				el.setAttribute(AimSvgContract.ATTR_UNBOUND, 'true');
			} else {
				el.removeAttribute(AimSvgContract.ATTR_UNBOUND);
			}
			if (node.slot === true) {
				el.setAttribute(AimSvgContract.ATTR_SLOT, 'true');
			} else {
				el.removeAttribute(AimSvgContract.ATTR_SLOT);
			}
			if (node.restriction) {
				el.setAttribute(AimSvgContract.ATTR_RESTRICTION, node.restriction);
			} else {
				el.removeAttribute(AimSvgContract.ATTR_RESTRICTION);
			}
			if (node.state) {
				el.setAttribute(AimSvgContract.ATTR_STATE, node.state);
			} else {
				el.removeAttribute(AimSvgContract.ATTR_STATE);
			}
			if (node.boundaryId) {
				el.setAttribute('aim-boundary-id', node.boundaryId);
			} else {
				el.removeAttribute('aim-boundary-id');
			}

			for (const field of ["description", "descriptionWidth", "visibility", "attributes", "methods", "properties", "namespace"] as const) {
				if (node[field] !== undefined) el.setAttribute(`aim-${field}`, field === 'namespace' ? String(node[field]) : JSON.stringify(node[field]));
				else el.removeAttribute(`aim-${field}`);
			}

			// Replace inner content with canonical archetype shape markup
			const innerSvg = this.renderNodeInnerSvg(node);
			const fragmentDoc = parser.parseFromString(
				`<g xmlns="http://www.w3.org/2000/svg">${innerSvg}</g>`,
				'image/svg+xml',
			);
			if (fragmentDoc.documentElement.tagName.toLowerCase() === 'parsererror') {
				throw new Error(`Failed to parse inner SVG for node ${node.id}: ${fragmentDoc.documentElement.textContent}`);
			}

			while (el.firstChild) {
				el.removeChild(el.firstChild);
			}

			for (const child of Array.from(fragmentDoc.documentElement.childNodes)) {
				el.appendChild(doc.importNode(child, true));
			}
		}

		// Remove deleted boundaries
		const existingBoundaryEls = Array.from(doc.querySelectorAll(AimSvgContract.SELECTOR_BOUNDARY));
		for (const bEl of existingBoundaryEls) {
			const id = bEl.getAttribute(AimSvgContract.ATTR_ID) ?? bEl.getAttribute('id');
			if (id && !model.boundaries?.some((b) => b.id === id)) {
				bEl.remove();
			}
		}

		// Update or insert boundary boxes (Class context and Package scopes)
		if (model.boundaries && model.boundaries.length > 0) {
			for (const b of model.boundaries) {
				let el = doc.querySelector(`[${AimSvgContract.ATTR_ID}="${b.id}"], [id="${b.id}"]`);
				if (!el) {
					el = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
					if (nodesLayer && nodesLayer.parentNode) {
						nodesLayer.parentNode.insertBefore(el, nodesLayer);
					} else {
						doc.documentElement.insertBefore(el, doc.documentElement.firstChild);
					}
				}

				const isPackage = (b.kind ?? '').toLowerCase() === 'package';
				const primaryColor = isPackage ? '#1E293B' : CascaisPalette.NetGoldStroke;
				const label = `${b.kind || (isPackage ? 'Package' : 'Class')}: ${b.name || b.id}`;
				const tabWidth = Math.max(80, label.length * 7.5 + 20);

				el.setAttribute('transform', `translate(${b.bounds.x}, ${b.bounds.y})`);
				el.setAttribute(AimSvgContract.ATTR_BOUNDARY, b.kind || (isPackage ? 'Package' : 'Class'));
				el.setAttribute(AimSvgContract.ATTR_ID, b.id);
				el.setAttribute(AimSvgContract.ATTR_BOUNDARY_NAME, b.name);
				if (b.package) el.setAttribute(AimSvgContract.ATTR_BOUNDARY_PACKAGE, b.package);
				if (b.href) {
					el.setAttribute(AimSvgContract.ATTR_HREF, b.href);
				} else {
					el.removeAttribute(AimSvgContract.ATTR_HREF);
				}
				if (b.elementIds && b.elementIds.length > 0) {
					el.setAttribute(AimSvgContract.ATTR_BOUNDARY_ELEMENTS, b.elementIds.join(','));
				} else {
					el.removeAttribute(AimSvgContract.ATTR_BOUNDARY_ELEMENTS);
				}
				el.setAttribute('class', `aim-boundary ${isPackage ? 'aim-boundary-package' : 'aim-boundary-class'}`);

				while (el.firstChild) {
					el.removeChild(el.firstChild);
				}

				if (isPackage) {
					// UML Tabbed Folder: Protruding tab on top-left outside main rectangle per media_1789883224444.png
					const tab = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
					tab.setAttribute('d', `M 0 26 L 0 6 A 6 6 0 0 1 6 0 L ${tabWidth - 18} 0 L ${tabWidth} 26 Z`);
					tab.setAttribute('fill', CascaisPalette.ChalkWhite);
					tab.setAttribute('stroke', primaryColor);
					tab.setAttribute('stroke-width', '1.5');
					tab.setAttribute('class', 'aim-boundary-tab');
					el.appendChild(tab);

					const tabText = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
					tabText.setAttribute('x', '12');
					tabText.setAttribute('y', '17');
					tabText.setAttribute('fill', primaryColor);
					tabText.setAttribute('font-family', 'Inter, system-ui, sans-serif');
					tabText.setAttribute('font-size', '11');
					tabText.setAttribute('font-weight', 'bold');
					tabText.setAttribute('class', 'aim-boundary-header-text');
					tabText.textContent = label;
					el.appendChild(tabText);

					const body = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
					body.setAttribute('x', '0');
					body.setAttribute('y', '26');
					body.setAttribute('width', `${b.bounds.width}`);
					body.setAttribute('height', `${Math.max(40, b.bounds.height - 26)}`);
					body.setAttribute('rx', '6');
					body.setAttribute('ry', '6');
					body.setAttribute('fill', 'rgba(248, 250, 252, 0.70)');
					body.setAttribute('stroke', primaryColor);
					body.setAttribute('stroke-width', '1.5');
					body.setAttribute('class', 'aim-boundary-body');
					el.appendChild(body);
				} else {
					// UML Class / Subject Boundary: Rectangle with Anthracite name inset inside top-left (no gold badge)
					const body = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
					body.setAttribute('width', `${b.bounds.width}`);
					body.setAttribute('height', `${b.bounds.height}`);
					body.setAttribute('rx', '8');
					body.setAttribute('ry', '8');
					body.setAttribute('fill', 'rgba(248, 250, 252, 0.65)');
					body.setAttribute('stroke', primaryColor);
					body.setAttribute('stroke-width', '1.5');
					body.setAttribute('stroke-dasharray', '6,4');
					body.setAttribute('class', 'aim-boundary-body');
					el.appendChild(body);

					const headerText = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
					headerText.setAttribute('x', '14');
					headerText.setAttribute('y', '22');
					headerText.setAttribute('fill', CascaisPalette.WarmGraphite);
					headerText.setAttribute('font-family', 'Inter, system-ui, sans-serif');
					headerText.setAttribute('font-size', '12');
					headerText.setAttribute('font-weight', 'bold');
					headerText.setAttribute('class', 'aim-boundary-header-text');
					headerText.textContent = label;
					el.appendChild(headerText);
				}
			}
		}

		let edgesLayer = doc.querySelector('.aim-edges-layer');
		if (!edgesLayer) {
			edgesLayer = doc.documentElement;
		}

		// Remove deleted edges
		const existingEdgeEls = Array.from(doc.querySelectorAll(AimSvgContract.SELECTOR_EDGE));
		for (const edgeEl of existingEdgeEls) {
			const id = edgeEl.getAttribute(AimSvgContract.ATTR_ID) ?? edgeEl.getAttribute('id');
			if (id && !model.edges.some((e) => e.id === id)) {
				edgeEl.remove();
			}
		}

		// Update or insert edges with live path geometry
		for (const edge of model.edges) {
			let el = doc.querySelector(`[${AimSvgContract.ATTR_ID}="${edge.id}"], [id="${edge.id}"]`);
			if (!el) {
				el = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
				if (nodesLayer && nodesLayer.parentNode === doc.documentElement) {
					doc.documentElement.insertBefore(el, nodesLayer);
				} else {
					edgesLayer.appendChild(el);
				}
			}

			const bendsString = this.formatBendPoints(edge.bendPoints);
			el.setAttribute(AimSvgContract.ATTR_BENDS, bendsString);
			el.setAttribute(AimSvgContract.ATTR_EDGE, 'true');
			el.setAttribute(AimSvgContract.ATTR_ID, edge.id);
			el.setAttribute(AimSvgContract.ATTR_EDGE_KIND, edge.kind);
			if (edge.sourceId !== undefined) {
				el.setAttribute(AimSvgContract.ATTR_SOURCE, edge.sourceId);
			}
			if (edge.targetId !== undefined) {
				el.setAttribute(AimSvgContract.ATTR_TARGET, edge.targetId);
			}
			if (edge.sourcePort !== undefined && edge.sourcePort !== '' && edge.sourcePort !== 'auto') {
				el.setAttribute(AimSvgContract.ATTR_SOURCE_PORT, edge.sourcePort);
			} else {
				el.removeAttribute(AimSvgContract.ATTR_SOURCE_PORT);
			}
			if (edge.targetPort !== undefined && edge.targetPort !== '' && edge.targetPort !== 'auto') {
				el.setAttribute(AimSvgContract.ATTR_TARGET_PORT, edge.targetPort);
			} else {
				el.removeAttribute(AimSvgContract.ATTR_TARGET_PORT);
			}
			if (edge.routing !== undefined) {
				el.setAttribute(AimSvgContract.ATTR_ROUTING, edge.routing);
			}
			if (edge.stereotype !== undefined) {
				el.setAttribute(AimSvgContract.ATTR_STEREOTYPE, edge.stereotype);
			}
			const edgeGlyphRef = stereotypeGlyphAttrValue(edge);
			if (edgeGlyphRef) {
				el.setAttribute(AimSvgContract.ATTR_STEREOTYPE_GLYPH, edgeGlyphRef);
			} else {
				el.removeAttribute(AimSvgContract.ATTR_STEREOTYPE_GLYPH);
			}
			if (edge.sourceCardinality !== undefined) {
				el.setAttribute('aim-source-cardinality', edge.sourceCardinality);
			}
			if (edge.targetCardinality !== undefined) {
				el.setAttribute('aim-target-cardinality', edge.targetCardinality);
			}

			// Update or inject <path class="aim-edge"> with rendered path geometry
			let pathD = edge.pathData;
			if (!pathD) {
				const sourceNode = model.nodes.find((n) => n.id === edge.sourceId);
				const targetNode = model.nodes.find((n) => n.id === edge.targetId);
				if (sourceNode && targetNode) {
					pathD = this.computeFallbackEdgePath(sourceNode, targetNode, edge.bendPoints, edge.routing ?? model.routing);
				}
			}

			let pathEl = el.querySelector('path.aim-edge') ?? el.querySelector('path');
			if (!pathEl) {
				pathEl = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
				pathEl.setAttribute('class', 'aim-edge');
				el.appendChild(pathEl);
			}

			if (pathD) {
				pathEl.setAttribute('d', pathD);
			}
			pathEl.setAttribute('fill', 'none');
			pathEl.setAttribute('stroke', CascaisPalette.WarmGraphite);
			pathEl.setAttribute('stroke-width', '1.5');

			const line = edgeLineOf(edge);
			if (line.dash) pathEl.setAttribute('stroke-dasharray', line.dash);
			else pathEl.removeAttribute('stroke-dasharray');

			el.setAttribute('aim-directed', String(edge.directed !== false));
			if (line.head === 'none') pathEl.removeAttribute('marker-end');
			else pathEl.setAttribute('marker-end', `url(#${edgeHeadMarkerId(line.head)})`);
			if (line.tail) pathEl.setAttribute('marker-start', `url(#${edgeTailMarkerId(line.tail)})`);
			else pathEl.removeAttribute('marker-start');

			if (edge.expression !== undefined) {
				el.setAttribute(AimSvgContract.ATTR_EXPRESSION, edge.expression);
			} else {
				el.removeAttribute(AimSvgContract.ATTR_EXPRESSION);
			}
			if (edge.expressionColor !== undefined) {
				el.setAttribute(AimSvgContract.ATTR_EXPRESSION_COLOR, edge.expressionColor);
			} else {
				el.removeAttribute(AimSvgContract.ATTR_EXPRESSION_COLOR);
			}
			if (edge.satisfied !== undefined) {
				el.setAttribute(AimSvgContract.ATTR_SATISFIED, String(edge.satisfied));
			} else {
				el.removeAttribute(AimSvgContract.ATTR_SATISFIED);
			}

			const midPoint =
				edge.bendPoints.length > 0
					? (edge.bendPoints[Math.floor(edge.bendPoints.length / 2)] ?? { x: 50, y: 50 })
					: (() => {
							const s = model.nodes.find((n) => n.id === edge.sourceId);
							const t = model.nodes.find((n) => n.id === edge.targetId);
							if (s && t) {
								return {
									x: Math.round((s.bounds.x + s.bounds.width / 2 + t.bounds.x + t.bounds.width / 2) / 2),
									y: Math.round((s.bounds.y + s.bounds.height / 2 + t.bounds.y + t.bounds.height / 2) / 2),
								};
							}
							return { x: 50, y: 50 };
						})();

			// Update or inject edge label
			const edgeLabel = edgeLabelOf(edge);
			if (edgeLabel) {
				let textEl = el.querySelector('text.aim-edge-label') ?? el.querySelector('text');
				if (!textEl) {
					textEl = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
					el.appendChild(textEl);
				}
				textEl.setAttribute('class', 'aim-edge-label');
				textEl.setAttribute('x', `${midPoint.x}`);
				textEl.setAttribute('y', `${edge.expression && model.showExpressions !== false ? midPoint.y - 14 : midPoint.y - 8}`);
				textEl.setAttribute('font-size', '11');
				textEl.setAttribute('fill', CascaisPalette.TextSecondary);
				textEl.setAttribute('text-anchor', 'middle');
				textEl.textContent = edgeLabel;
			}

			// Update or inject edge AST expression capsule pill
			if (edge.expression && model.showExpressions !== false) {
				const { pillBg, pillBorder, pillText } = computeExpressionPillColors(
					edge.expressionColor,
					edge.satisfied,
				);

				let pillG = el.querySelector('g.aim-expression-pill');
				if (!pillG) {
					pillG = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
					pillG.setAttribute('class', 'aim-expression-pill');
					el.appendChild(pillG);
				}
				const pillW = Math.max(48, edge.expression.length * 7 + 16);
				const pillH = 18;
				pillG.innerHTML = `
					<rect x="${midPoint.x - pillW / 2}" y="${midPoint.y - pillH / 2}" width="${pillW}" height="${pillH}" rx="8" ry="8" fill="${pillBg}" stroke="${pillBorder}" stroke-width="1" />
					<text x="${midPoint.x}" y="${midPoint.y + 4}" fill="${pillText}" font-size="10" font-weight="bold" font-family="ui-monospace, monospace" text-anchor="middle">${escapeXmlText(edge.expression)}</text>
				`;
			} else {
				el.querySelector('g.aim-expression-pill')?.remove();
			}

			// CR053: edge pictogram above the label / pill
			el.querySelector('image.aim-stereotype-glyph')?.remove();
			const pillShown = Boolean(edge.expression && model.showExpressions !== false);
			const glyphBox = edgeGlyphPlacement(
				edge,
				midPoint,
				edgeLabel ? midPoint.y - (pillShown ? 14 : 8) - 11 : pillShown ? midPoint.y - 9 : undefined,
			);
			if (glyphBox) {
				const imageEl = doc.createElementNS('http://www.w3.org/2000/svg', 'image');
				imageEl.setAttribute('href', glyphBox.url);
				imageEl.setAttribute('x', `${glyphBox.x}`);
				imageEl.setAttribute('y', `${glyphBox.y}`);
				imageEl.setAttribute('width', `${glyphBox.size}`);
				imageEl.setAttribute('height', `${glyphBox.size}`);
				imageEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
				imageEl.setAttribute('class', 'aim-stereotype-glyph aim-stereotype-glyph-edge');
				el.appendChild(imageEl);
			}
		}

		healPortalAtRest(doc);

		return new XMLSerializer().serializeToString(doc);
	}

	private renderSvgText(
		text: string,
		cx: number,
		cy: number,
		fontSize: number,
		fontWeight: string,
		fill: string,
		underline: boolean = false,
		qualifier?: string,
		boxWidth?: number,
		tag?: string,
	): string {
		const wrapLength = boxWidth ? computeMaxLineLength(boxWidth, fontSize) : 18;
		const nameWrapped = wrapAimText(text, wrapLength);
		const nameLines = nameWrapped.split('\n');

		const hasQualifier = Boolean(qualifier && qualifier.trim().length > 0);
		const qualifierLines = hasQualifier ? wrapAimText(qualifier!, wrapLength).split('\n') : [];

		// A role slot's expected Class (`: Person`) sits quietly below the role name
		const tagLines = tag && tag.trim().length > 0 ? [tag] : [];
		const totalLines = qualifierLines.length + nameLines.length + tagLines.length;
		const underlineAttr = underline ? ' text-decoration="underline"' : '';
		const weightAttr = fontWeight !== 'normal' ? ` font-weight="${fontWeight}"` : '';

		if (totalLines <= 1) {
			const lineContent = nameLines[0] !== undefined ? escapeXmlText(nameLines[0]) : '';
			return `      <text class="aim-name" x="${cx}" y="${cy}" font-size="${fontSize}"${weightAttr} fill="${fill}" text-anchor="middle" dominant-baseline="central"${underlineAttr}>${lineContent}</text>\n`;
		}

		const lineHeight = fontSize * 1.25;
		const startY = cy - ((totalLines - 1) * lineHeight) / 2;

		let tspans = '';
		qualifierLines.forEach((qLine, idx) => {
			const y = Math.round(startY + idx * lineHeight);
			tspans += `<tspan class="aim-qualifier" x="${cx}" y="${y}" font-size="${fontSize - 1}" font-style="italic" fill="${CascaisPalette.TextSecondary}">${escapeXmlText(qLine)}</tspan>`;
		});

		nameLines.forEach((nLine, idx) => {
			const y = Math.round(startY + (qualifierLines.length + idx) * lineHeight);
			tspans += `<tspan class="aim-name" x="${cx}" y="${y}" font-size="${fontSize}"${weightAttr} fill="${fill}"${underlineAttr}>${escapeXmlText(nLine)}</tspan>`;
		});

		tagLines.forEach((tLine, idx) => {
			const y = Math.round(startY + (qualifierLines.length + nameLines.length + idx) * lineHeight);
			tspans += `<tspan class="aim-restriction" x="${cx}" y="${y}" font-size="${fontSize - 1}" font-style="italic" fill="${CascaisPalette.TextSecondary}">${escapeXmlText(tLine)}</tspan>`;
		});

		return `      <text font-size="${fontSize}" fill="${fill}" text-anchor="middle" dominant-baseline="central">${tspans}</text>\n`;
	}

	/**
	 * Generates the canonical inner SVG elements (shapes and styled text)
	 * for a given AOAIM node archetype.
	 */
	public renderNodeInnerSvg(node: RaidNodeData): string {
		let svg = '';
		node = layoutDescription(node);
		const isInstance = isInstanceNode(node);
		const isUnbound = node.unbound === true;
		const width = node.bounds.width;
		const height = node.bounds.height;
		// 1UCC role slot: the role name is prominent and the expected Class is the quiet tag below it, in
		// place of any qualifier line. No ring or dashed outline: the plain name and the tag mark the slot.
		const isSlot = node.slot === true && (node.kind === 'per' || node.kind === 'obj' || node.kind === 'plc');
		const qualifierText = isSlot ? undefined : node.qualifier;
		const slotTag = isSlot ? restrictionTag(node.restriction) : undefined;
		const resolvedStereo = resolveStereotype(node.stereotype, node.kind);
		// CR053: a known pictogram replaces the built-in stereotype icon (and the Person's stick figure),
		// exactly as on the live canvas; a frameless Place keeps its icon. Description cards and roles carry no glyph.
		const glyphs = ['uc', 'act', 'cls', 'obj', 'per', 'plc'].includes(node.kind) && !(node.kind === 'obj' && node.description)
			? resolveStereotypeGlyphs(node.stereotypeGlyph)
			: [];
		const glyph = glyphs[0];
		const hasStereoIcon = Boolean(glyph) || Boolean(resolvedStereo && resolvedStereo !== 'initiates');
		const drawBuiltInIcon = hasStereoIcon && !glyph;
		const cardTextCx = hasStereoIcon ? Math.round(width * 0.62) : width / 2;
		const cardTextWidth = hasStereoIcon ? Math.max(40, width - 52) : width;
		const iconY = Math.max(6, Math.round((height - 24) / 2));

		const rawDisplayName = isUnbound && !node.displayName.startsWith('[') && !node.displayName.endsWith(']')
			? `[${node.displayName}]`
			: node.displayName;
		const textColor = isUnbound ? CascaisPalette.GraphiteMuted : CascaisPalette.TextPrimary;
		const unboundAttrs = isUnbound ? ' stroke-dasharray="5,4" opacity="0.70"' : '';

		// A node that stands as a Shape is one element whatever its archetype: the Shape on an invisible
		// box (kept, because its size is what extraction reads), the Class and the name beneath it.
		const figure = shapeFigureOf(node);
		if (figure) {
			const place = shapeFigurePlacement(figure, width);
			const ink = isInitiatingStereotype(node.stereotype) ? CascaisPalette.NetGoldStroke : CascaisPalette.WarmGraphite;
			svg += `      <rect width="${width}" height="${height}" fill="none" stroke="none" />\n`;
			svg += `      <g${unboundAttrs}>${renderShapeFigureSvg(figure, { x: place.x, y: place.y, ink, ...(node.state ? { state: node.state } : {}) })}</g>\n`;
			svg += this.renderSvgText(rawDisplayName, place.cx, place.y + place.height + 24, 12, '500', textColor, isInstance, qualifierText, width, slotTag);
		} else if (node.kind === 'uc') {
			const rx = width / 2;
			const ry = height / 2;
			svg += `      <ellipse cx="${rx}" cy="${ry}" rx="${rx}" ry="${ry}" fill="${CascaisPalette.ChalkWhite}" stroke="${CascaisPalette.NetGoldStroke}" stroke-width="2"${unboundAttrs} />\n`;
			if (drawBuiltInIcon) {
				svg += renderStereotypeIconSvg(node.stereotype, 12, iconY);
			}
			svg += this.renderSvgText(rawDisplayName, cardTextCx, ry, 13, 'bold', textColor, isInstance, node.qualifier, cardTextWidth);
		} else if (node.kind === 'act') {
			svg += `      <rect width="${width}" height="${height}" rx="12" ry="12" fill="${CascaisPalette.ChalkWhite}" stroke="${CascaisPalette.CascaisRed}" stroke-width="2"${unboundAttrs} />\n`;
			if (drawBuiltInIcon) {
				svg += renderStereotypeIconSvg(node.stereotype, 12, iconY);
			}
			svg += this.renderSvgText(rawDisplayName, cardTextCx, height / 2, 13, '600', textColor, isInstance, node.qualifier, cardTextWidth);
		} else if (node.kind === 'cls') {
			svg += `      <rect width="${width}" height="${height}" fill="${CascaisPalette.ChalkWhite}" stroke="${CascaisPalette.SilverLineDark}" stroke-width="1.5"${unboundAttrs} />\n`;
			svg += `      <rect width="${width}" height="28" fill="${CascaisPalette.CanvasCream}" stroke="none" />\n`;
			svg += `      <line x1="0" y1="28" x2="${width}" y2="28" stroke="${CascaisPalette.SilverLineDark}" stroke-width="1.5" />\n`;
			if (drawBuiltInIcon) {
				svg += renderStereotypeIconSvg(node.stereotype, 8, 2);
			}
			svg += this.renderSvgText(rawDisplayName, cardTextCx, 14, 12, 'bold', textColor, isInstance, undefined, cardTextWidth);
            classAttributeLines(node).forEach((line, i) => {
                svg += `<text x="8" y="${46 + i * 16}" font-size="11" fill="#475569">${escapeXmlText(line)}</text>`;
            });
		} else if (node.kind === 'obj' && node.description) {
            svg += this.renderObjectCard(width, height, '#CBD5E1', unboundAttrs);
            svg += this.renderSvgText(rawDisplayName, width / 2, 22, 13, '600', textColor, true, undefined, width);
            wrapDescription(node.description, node.descriptionWidth).split('\n').forEach((line, i) => {
                svg += `<text x="14" y="${62 + i * 18}" font-size="12" fill="#475569">${escapeXmlText(line)}</text>`;
            });
        } else if (node.kind === 'obj') {
			svg += this.renderObjectCard(width, height, CascaisPalette.SilverLineDark, unboundAttrs);
			if (drawBuiltInIcon) {
				svg += renderStereotypeIconSvg(node.stereotype, 12, iconY);
			}
			svg += this.renderSvgText(rawDisplayName, cardTextCx, height / 2, 12, 'normal', textColor, isInstance, qualifierText, cardTextWidth, slotTag);
		} else if (node.kind === 'per') {
			const isInitiating = isInitiatingStereotype(node.stereotype);
			const isLead = resolvedStereo === 'lead';
			const strokeColor = (isInitiating && !isLead) ? CascaisPalette.NetGoldStroke : CascaisPalette.WarmGraphite;
			const cx = Math.round(width / 2);
			svg += `      <rect width="${width}" height="${height}" fill="none" stroke="none" />\n`;
			if (glyph) {
				// The pictogram silhouette, emitted below, takes the figure's place.
			} else {
				const torsoD = isLead
					? `M ${cx - 21} 54 v -6 a 10 10 0 0 1 10 -10 H ${cx + 11} a 10 10 0 0 1 10 10 v 6 L ${cx + 8} 47`
					: `M ${cx + 21} 54 v -6 a 10 10 0 0 0 -10 -10 H ${cx - 11} a 10 10 0 0 0 -10 10 v 6`;
				svg += `      <path d="${torsoD}" fill="none" stroke="${strokeColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"${unboundAttrs} />\n`;
				svg += `      <circle cx="${cx}" cy="20" r="12" fill="${CascaisPalette.ChalkWhite}" stroke="${strokeColor}" stroke-width="2.2"${unboundAttrs} />\n`;
				if (resolvedStereo === 'customer') {
					svg += renderStereotypeIconSvg('customer', cx - 12, -7, CascaisPalette.NetGoldStroke, CascaisPalette.NetGold);
				} else if (resolvedStereo === 'headliner') {
					svg += renderStereotypeIconSvg('headliner', cx - 8, 38.5, CascaisPalette.NetGoldStroke, CascaisPalette.NetGold);
				} else if (resolvedStereo === 'ai') {
					const aiColor = isInitiating ? CascaisPalette.NetGoldStroke : CascaisPalette.WarmGraphite;
					svg += renderStereotypeIconSvg('ai', cx - 12, 8, aiColor, aiColor);
				} else if (resolvedStereo === 'lead') {
					svg += renderStereotypeIconSvg(node.stereotype, cx - 12, 58, CascaisPalette.NetGoldStroke, CascaisPalette.NetGold);
				} else if (resolvedStereo === 'observer') {
					const obsColor = isInitiating ? CascaisPalette.NetGoldStroke : CascaisPalette.WarmGraphite;
					const cyclopsTransform = `translate(${cx}, 20) scale(0.85) translate(-12, -9.5)`;
					svg += renderStereotypeIconSvg(node.stereotype, cx - 12, 11, obsColor, CascaisPalette.NetGold, cyclopsTransform);
				}
			}
			svg += this.renderSvgText(rawDisplayName, cx, 80, 12, '500', textColor, isInstance, qualifierText, width, slotTag);
		} else if (node.kind === 'rol' || node.kind === 'rf') {
            const fill = node.kind === 'rf' ? String(node.properties?.color ?? CascaisPalette.AccentBlue) : CascaisPalette.ChalkWhite;
            const ring = node.kind === 'rol'
                ? `stroke="${GenericRoleLine.stroke}" stroke-width="${GenericRoleLine.strokeWidth}" stroke-dasharray="${GenericRoleLine.dash}"`
                : `stroke="${CascaisPalette.WarmGraphite}" stroke-width="2"${unboundAttrs}`;
            svg += `<circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) / 2}" fill="${escapeXmlAttr(fill)}" ${ring} />`;
            svg += this.renderSvgText(rawDisplayName, width / 2, -14, 13, '600', textColor, isInstance, undefined, 240);

		} else {
			svg += `      <rect width="${width}" height="${height}" fill="${CascaisPalette.ChalkWhite}" stroke="${CascaisPalette.WarmGraphite}" stroke-width="1.5" />\n`;
			if (drawBuiltInIcon) {
				svg += renderStereotypeIconSvg(node.stereotype, 12, iconY);
			}
			svg += this.renderSvgText(node.displayName, cardTextCx, height / 2, 12, 'normal', CascaisPalette.TextPrimary, isInstance, node.qualifier, cardTextWidth);
		}

		if (glyphs.length > 0) {
			const frameless = figure !== undefined;
			const boxWidth = frameless ? shapeNodeWidth(width) : width;
			computeStereotypeGlyphLayout(node.kind, boxWidth, height, glyphs.length, { frameless }).forEach((p, i) => {
				const url = getStereotypeGlyphUrl(glyphs[i]!.file) ?? '';
				svg += `      <image href="${escapeXmlAttr(url)}" x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}" preserveAspectRatio="xMidYMid meet" class="aim-stereotype-glyph aim-stereotype-glyph-${p.mode}"${isUnbound ? ' opacity="0.70"' : ''} />\n`;
			});
		}

		// The Duality of the Object: Portuguese Bicolor Seam & Portal Door
		if (node.href !== undefined && node.href.trim().length > 0) {
			const escapedHref = escapeXmlAttr(node.href.trim());
			const midX = Math.round(width / 2);

			// An Object card's door stops at its folded corner
			let doorPath = node.kind === 'obj'
				? `M ${midX} 0 H ${width - OBJECT_FOLD} L ${width} ${OBJECT_FOLD} V ${height} H ${midX} Z`
				: `M ${midX} 0 H ${width} v ${height} H ${midX} Z`;
			let seamX1 = midX;
			let seamY1 = 0;
			let seamX2 = midX;
			let seamY2 = height;
			let chevronX = width - 12;
			let chevronY = Math.round(height / 2);
			const chevronFill = HeraldicWash.vermelho(DualityWashStrength.chevron);

			// A Shape's door is its own outline seen through the right half of its box. The nested viewport
			// does the cutting, so it works in every viewer and no Shape carries a half of its own.
			let doorMarkup: string | undefined;
			if (figure) {
				const place = shapeFigurePlacement(figure, width);
				const half = place.width / 2;
				doorMarkup = `<svg x="${place.cx}" y="${place.y}" width="${half}" height="${place.height}" viewBox="${half} 0 ${half} ${place.height}" fill="${HeraldicWash.vermelho(0)}" class="aim-portal-door"><path d="${figure.outline}" fill-rule="evenodd" /></svg>`;
				seamX1 = place.cx;
				seamY1 = place.y;
				seamX2 = place.cx;
				seamY2 = place.y + place.height;
				chevronX = place.cx + half + 12;
				chevronY = place.y + 20;
			} else if (node.kind === 'per') {
				const cx = Math.round(width / 2);
				const headRight = `M ${cx} 8 A 12 12 0 0 1 ${cx} 32 Z`;
				const torsoRight = `M ${cx} 38 H ${cx + 11} a 10 10 0 0 1 10 10 v 6 H ${cx} Z`;
				doorPath = `${headRight} ${torsoRight}`;
				seamX1 = cx;
				seamY1 = 8;
				seamX2 = cx;
				seamY2 = 54;
				chevronX = width - 10;
				chevronY = Math.round(height / 2);
			} else if (node.kind === 'uc') {
				const rx = Math.round(width / 2);
				const ry = Math.round(height / 2);
				doorPath = `M ${rx} 0 A ${rx} ${ry} 0 0 1 ${rx} ${height} Z`;
			} else if (node.kind === 'act') {
				const r = 12;
				doorPath = `M ${midX} 0 H ${width - r} a ${r} ${r} 0 0 1 ${r} ${r} v ${height - 2 * r} a ${r} ${r} 0 0 1 -${r} ${r} H ${midX} Z`;
			}

			// CR055 (Koyo D5): exported at rest — the door is a clear click target; seam and chevron mark the portal
			svg += `      <a href="${escapedHref}" target="_blank">\n`;
			svg += `        ${doorMarkup ?? `<path d="${doorPath}" fill="${HeraldicWash.vermelho(0)}" fill-rule="evenodd" class="aim-portal-door" />`}\n`;
			svg += `        <line x1="${seamX1}" y1="${seamY1}" x2="${seamX2}" y2="${seamY2}" stroke="${CascaisPalette.NetGoldStroke}" stroke-width="1.5" class="aim-portal-seam" />\n`;
			svg += `        <text x="${chevronX}" y="${chevronY}" fill="${chevronFill}" font-size="14" font-weight="bold" font-family="Inter, system-ui, -apple-system, sans-serif" text-anchor="middle" dominant-baseline="central" class="aim-portal-chevron">›</text>\n`;
			svg += `      </a>\n`;
		}

		return svg;
	}

	/**
	 * An Object card: its outline with the top-right corner folded, and the flap. The rectangle stays in
	 * front of them, invisible, because its size is what extraction reads back.
	 */
	private renderObjectCard(width: number, height: number, stroke: string, extraAttrs: string): string {
		return `      <rect width="${width}" height="${height}" fill="none" stroke="none" />\n`
			+ `      <path d="${objectCardOutline(width, height)}" fill="${CascaisPalette.ChalkWhite}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"${extraAttrs} class="aim-obj-card" />\n`
			+ `      <path d="${objectFoldFlap(width)}" fill="${CascaisPalette.SilverLine}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round" class="aim-obj-fold" />\n`;
	}

	public generateFreshSvg(model: RaidMetamodel, options: SerializationOptions): string {
		model = projectRoleAttributes({ ...model, nodes: model.nodes.map(layoutDescription) });
		const width = Math.max(800, ...model.nodes.map((n) => n.bounds.x + n.bounds.width + 100));
		const height = Math.max(600, ...model.nodes.map((n) => n.bounds.y + n.bounds.height + 100));

		const diagramRouting = options.routingMode ?? model.routing;
		const routingAttr = diagramRouting ? ` ${AimSvgContract.ATTR_ROUTING}="${escapeXmlAttr(diagramRouting)}"` : '';

		let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" id="${escapeXmlAttr(model.diagramId)}" aim-archetype="${escapeXmlAttr(model.archetype)}"${routingAttr} aim-show-expressions="${model.showExpressions ?? true}">\n`;

		// Definitions & Markers
		svg += `  <defs>\n`;
		for (const { svg: markerSvg } of edgeMarkersSvg()) svg += `    ${markerSvg}\n`;
		if (options.embedStyles !== false) {
			svg += `    <style>\n`;
			svg += `      .aim-node { cursor: pointer; transition: filter 0.15s ease; }\n`;
			svg += `      .aim-portal-seam { stroke: ${CascaisPalette.NetGoldStroke}; stroke-width: 1.5; pointer-events: none; }\n`;
			svg += `      ${PORTAL_FEEDBACK_STYLES}\n`;
			svg += `      .aim-edge { fill: none; stroke: ${CascaisPalette.WarmGraphite}; stroke-width: 1.5; }\n`;
			svg += `      text { font-family: Inter, system-ui, sans-serif; }\n`;
			svg += `      .aim-node[aim-instance="true"] text.aim-name, .aim-node[aim-instance="true"] tspan.aim-name { text-decoration: underline; }\n`;
			svg += `    </style>\n`;
		}
		svg += `  </defs>\n\n`;

		// Render Edges
		svg += `  <!-- Edges -->\n`;
		svg += `  <g class="aim-edges-layer">\n`;
		for (const edge of model.edges) {
			const bendsFormatted = this.formatBendPoints(edge.bendPoints);
			const line = edgeLineOf(edge);
			const edgeLabel = edgeLabelOf(edge);
			const strokeDash = line.dash ? ` stroke-dasharray="${line.dash}"` : '';
			const markerEnd = (line.head === 'none' ? '' : ` marker-end="url(#${edgeHeadMarkerId(line.head)})"`)
				+ (line.tail ? ` marker-start="url(#${edgeTailMarkerId(line.tail)})"` : '');

			// Path data construction
			let pathD = edge.pathData;
			if (!pathD) {
				const sourceNode = model.nodes.find((n) => n.id === edge.sourceId);
				const targetNode = model.nodes.find((n) => n.id === edge.targetId);
				if (sourceNode && targetNode) {
					pathD = this.computeFallbackEdgePath(sourceNode, targetNode, edge.bendPoints, edge.routing ?? model.routing);
				}
			}

			const sourcePortAttr = edge.sourcePort && edge.sourcePort !== 'auto' ? ` ${AimSvgContract.ATTR_SOURCE_PORT}="${escapeXmlAttr(edge.sourcePort)}"` : '';
			const targetPortAttr = edge.targetPort && edge.targetPort !== 'auto' ? ` ${AimSvgContract.ATTR_TARGET_PORT}="${escapeXmlAttr(edge.targetPort)}"` : '';
			const routingAttr = edge.routing ? ` ${AimSvgContract.ATTR_ROUTING}="${escapeXmlAttr(edge.routing)}"` : '';
			const stereotypeAttr = edge.stereotype ? ` ${AimSvgContract.ATTR_STEREOTYPE}="${escapeXmlAttr(edge.stereotype)}"` : '';
			const edgeGlyphRef = stereotypeGlyphAttrValue(edge);
			const glyphAttr = edgeGlyphRef ? ` ${AimSvgContract.ATTR_STEREOTYPE_GLYPH}="${escapeXmlAttr(edgeGlyphRef)}"` : '';
			const sourceCardAttr = edge.sourceCardinality ? ` aim-source-cardinality="${escapeXmlAttr(edge.sourceCardinality)}"` : '';
			const targetCardAttr = edge.targetCardinality ? ` aim-target-cardinality="${escapeXmlAttr(edge.targetCardinality)}"` : '';

			svg += `    <g ${AimSvgContract.ATTR_EDGE}="true" ${AimSvgContract.ATTR_ID}="${escapeXmlAttr(edge.id)}" ${AimSvgContract.ATTR_EDGE_KIND}="${escapeXmlAttr(edge.kind)}" ${AimSvgContract.ATTR_SOURCE}="${escapeXmlAttr(edge.sourceId)}" ${AimSvgContract.ATTR_TARGET}="${escapeXmlAttr(edge.targetId)}" aim-directed="${edge.directed !== false}"${sourcePortAttr}${targetPortAttr}${routingAttr}${edge.expression !== undefined ? ` aim-expression="${escapeXmlAttr(edge.expression)}"` : ''}${edge.expressionColor !== undefined ? ` aim-expression-color="${escapeXmlAttr(edge.expressionColor)}"` : ''}${edge.satisfied !== undefined ? ` aim-satisfied="${edge.satisfied}"` : ''}${stereotypeAttr}${glyphAttr}${sourceCardAttr}${targetCardAttr} ${AimSvgContract.ATTR_BENDS}="${escapeXmlAttr(bendsFormatted)}">\n`;
			if (pathD) {
				svg += `      <path d="${pathD}" class="aim-edge" fill="none" stroke="${CascaisPalette.WarmGraphite}" stroke-width="1.5"${strokeDash}${markerEnd} />\n`;
			}
			const midPoint =
				edge.bendPoints.length > 0
					? (edge.bendPoints[Math.floor(edge.bendPoints.length / 2)] ?? { x: 50, y: 50 })
					: (() => {
							const s = model.nodes.find((n) => n.id === edge.sourceId);
							const t = model.nodes.find((n) => n.id === edge.targetId);
							if (s && t) {
								return {
									x: Math.round((s.bounds.x + s.bounds.width / 2 + t.bounds.x + t.bounds.width / 2) / 2),
									y: Math.round((s.bounds.y + s.bounds.height / 2 + t.bounds.y + t.bounds.height / 2) / 2),
								};
							}
							return { x: 50, y: 50 };
						})();
			const pillShown = Boolean(edge.expression && model.showExpressions !== false);
			if (edgeLabel) {
				svg += `      <text x="${midPoint.x}" y="${midPoint.y - (pillShown ? 20 : 8)}" font-size="11" fill="${CascaisPalette.TextSecondary}" text-anchor="middle">${escapeXmlText(edgeLabel)}</text>\n`;
			}
			// CR053: edge pictogram above the label / pill
			const glyphBox = edgeGlyphPlacement(
				edge,
				midPoint,
				edgeLabel ? midPoint.y - (pillShown ? 20 : 8) - 11 : pillShown ? midPoint.y - 10 : undefined,
			);
			if (glyphBox) {
				svg += `      <image href="${escapeXmlAttr(glyphBox.url)}" x="${glyphBox.x}" y="${glyphBox.y}" width="${glyphBox.size}" height="${glyphBox.size}" preserveAspectRatio="xMidYMid meet" class="aim-stereotype-glyph aim-stereotype-glyph-edge" />\n`;
			}
			if (edge.expression && model.showExpressions !== false) {
                const source = model.nodes.find(n => n.id === edge.sourceId);
                const target = model.nodes.find(n => n.id === edge.targetId);
                const point = edge.bendPoints[Math.floor(edge.bendPoints.length / 2)] ?? { x: ((source?.bounds.x ?? 0) + (source?.bounds.width ?? 0) / 2 + (target?.bounds.x ?? 0) + (target?.bounds.width ?? 0) / 2) / 2, y: ((source?.bounds.y ?? 0) + (source?.bounds.height ?? 0) / 2 + (target?.bounds.y ?? 0) + (target?.bounds.height ?? 0) / 2) / 2 };
                const colors = computeExpressionPillColors(edge.expressionColor, edge.satisfied);
                const width = Math.max(48, edge.expression.length * 7 + 16);
                svg += `<g class="aim-expression-pill"><rect x="${point.x-width/2}" y="${point.y-10}" width="${width}" height="22" rx="8" fill="${colors.pillBg}" stroke="${colors.pillBorder}"/><text x="${point.x}" y="${point.y+4}" text-anchor="middle" font-size="10" fill="${colors.pillText}">${escapeXmlText(edge.expression)}</text></g>`;
            }
            svg += `    </g>\n`;
		}
		svg += `  </g>\n\n`;

		// Render Nodes
		svg += `  <!-- Nodes -->\n`;
		svg += `  <g class="aim-nodes-layer">\n`;
		for (const node of model.nodes) {
			const hrefAttr = node.href && node.href.trim().length > 0 ? ` ${AimSvgContract.ATTR_HREF}="${escapeXmlAttr(node.href.trim())}"` : '';
			const stereoVal: string = node.stereotype ? (Array.isArray(node.stereotype) ? (node.stereotype as readonly string[]).join(', ') : String(node.stereotype)) : '';
			const stereotypeAttr = stereoVal ? ` ${AimSvgContract.ATTR_STEREOTYPE}="${escapeXmlAttr(stereoVal)}"` : '';
			const glyphRef = stereotypeGlyphAttrValue(node);
			const glyphAttr = glyphRef ? ` ${AimSvgContract.ATTR_STEREOTYPE_GLYPH}="${escapeXmlAttr(glyphRef)}"` : '';
			const qualifierAttr = node.qualifier ? ` ${AimSvgContract.ATTR_QUALIFIER}="${escapeXmlAttr(node.qualifier)}"` : '';
			const extraAttrs = (["description", "descriptionWidth", "visibility", "attributes", "methods", "properties", "namespace"] as const).map(field => node[field] !== undefined ? ` aim-${field}="${escapeXmlAttr(field === 'namespace' ? String(node[field]) : JSON.stringify(node[field]))}"` : '').join('');
			const instanceAttr = isInstanceNode(node) ? ` ${AimSvgContract.ATTR_INSTANCE}="true"` : '';
			const roleAttrs =
				(node.unbound === true ? ` ${AimSvgContract.ATTR_UNBOUND}="true"` : '') +
				(node.slot === true ? ` ${AimSvgContract.ATTR_SLOT}="true"` : '') +
				(node.restriction ? ` ${AimSvgContract.ATTR_RESTRICTION}="${escapeXmlAttr(node.restriction)}"` : '') +
				(node.state ? ` ${AimSvgContract.ATTR_STATE}="${escapeXmlAttr(node.state)}"` : '');
			svg += `    <g ${AimSvgContract.ATTR_NODE}="true" ${AimSvgContract.ATTR_ID}="${escapeXmlAttr(node.id)}" ${AimSvgContract.ATTR_KIND}="${escapeXmlAttr(node.kind)}" ${AimSvgContract.ATTR_DISPLAY_NAME}="${escapeXmlAttr(node.displayName)}"${hrefAttr}${qualifierAttr}${instanceAttr}${roleAttrs}${stereotypeAttr}${glyphAttr}${extraAttrs} transform="translate(${node.bounds.x}, ${node.bounds.y})">\n`;
			svg += this.renderNodeInnerSvg(node);
			svg += `    </g>\n`;
		}
		svg += `  </g>\n`;
		svg += `</svg>\n`;

		return svg;
	}

	public normalizeRouting(raw: string): AimRoutingMode {
		const lower = raw.toLowerCase().trim();
		if (lower === 'orthogonal' || lower === 'manhattan') return 'manhattan';
		if (lower === 'straight' || lower === 'normal') return 'normal';
		if (lower === 'curved' || lower === 'smooth') return 'smooth';
		return 'manhattan';
	}

	private normalizeKind(kind: string): AimOntologyKind {
		const lower = kind.toLowerCase();
		if (lower === 'uc' || lower === 'usecase') return 'uc';
		if (lower === 'act' || lower === 'activity') return 'act';
		if (lower === 'cls' || lower === 'class') return 'cls';
		if (lower === 'obj' || lower === 'object') return 'obj';
		if (lower === 'per' || lower === 'person' || lower === 'actor') return 'per';
		if (lower === 'plc' || lower === 'place' || lower === 'venue') return 'plc';
		if (lower === 'rf' || lower === 'rolefiller') return 'rf';
		if (lower === 'rol' || lower === 'role') return 'rol';
		return 'act';
	}

	private normalizeEdgeKind(kind: string): AimEdgeKind {
		const lower = kind.toLowerCase();
		if (lower.includes('depend')) return 'dependency';
		if (lower.includes('general') || lower.includes('inher')) return 'generalization';
		if (lower.includes('realiz')) return 'realization';
		if (lower.includes('aggreg')) return 'aggregation';
		if (lower.includes('compos')) return 'composition';
		return 'association';
	}

	private kindFromShape(shape: string): AimOntologyKind {
		if (shape.includes('uc')) return 'uc';
		if (shape.includes('act')) return 'act';
		if (shape.includes('cls')) return 'cls';
		if (shape.includes('obj')) return 'obj';
		if (shape.includes('per')) return 'per';
		if (shape.includes('plc')) return 'plc';
		if (shape === 'aim-rf') return 'rf';
		if (shape.includes('rol')) return 'rol';
		return 'act';
	}
}
