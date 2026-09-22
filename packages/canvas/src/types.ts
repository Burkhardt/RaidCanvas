/**
 * @file types.ts
 * @description Core ontological types, metamodel contracts, and SVG attributes
 * for the RaidCanvas AOAIM visual modeler.
 *
 * Honors Alan Kay's vision of living, reactive object systems and Rainer Burkhardt's
 * C++ GrafObj graphical object hierarchies.
 */

/**
 * Canonical AOAIM (Activity-Object-AI Model) entity archetypes.
 *
 * - 'uc'  : UseCase (elliptical boundary, Cascais Net Gold accent)
 * - 'act' : Activity (rounded rectangle process step, Heraldic Green accent)
 * - 'cls' : Class (compartmentalized class specification card)
 * - 'obj' : Object / Instance (runtime instance card with underlined title)
 * - 'per' : Person / Actor (Initiating or Defined role stick-figure/card)
 * - 'plc' : Place / Where (architectural venue or spatial stage card)
 * - 'rol' : Role (structural relationship / KL-ONE constraint)
 */
export type AimOntologyKind = 'act' | 'uc' | 'cls' | 'obj' | 'per' | 'plc' | 'rol' | 'rf';

/**
 * Routing strategy for diagram edges.
 * - 'manhattan': Obstacle-avoiding 90° orthogonal routing with rounded corners (default).
 * - 'normal': Direct straight line point-to-point connection.
 * - 'smooth': Curved cubic bezier spline between ports.
 */
export type AimRoutingMode = 'manhattan' | 'normal' | 'smooth';

/**
 * Ontological relationship classifications in AOAIM.
 */
export type AimEdgeKind =
	| 'association'
	| 'dependency'
	| 'generalization'
	| 'realization'
	| 'aggregation'
	| 'composition';

/**
 * 2D Cartesian coordinate pair for geometry and Manhattan orthogonal routing.
 */
export interface Point {
	readonly x: number;
	readonly y: number;
}

/**
 * Single bend point (vertex) along an orthogonal Manhattan edge path.
 */
export interface SvgBendPoint {
	readonly x: number;
	readonly y: number;
}

/**
 * 2D Bounding box for nodes and frames.
 */
export interface Bounds {
	readonly x: number;
	readonly y: number;
	readonly width: number;
	readonly height: number;
}

/**
 * Canonical port identifiers for 4-way orthogonal docking.
 */
export type OrthogonalPortId = 'port-top' | 'port-right' | 'port-bottom' | 'port-left';

/**
 * Metadata carried by an ontological node inside AntV X6.
 */
export interface RaidNodeData {
	/** Unique entity identifier in the metamodel (e.g., 'SignContract_UC'). */
	readonly id: string;

	/** Ontological kind of the node. */
	readonly kind: AimOntologyKind;

	/** Display label presented on the canvas. */
	readonly displayName: string;

	/** Optional upper qualifier line, styled quietly (italic or lighter tone, never underlined). */
	readonly qualifier?: string;

	/** Whether the entity represents a concrete instance (underlining the displayName line). */
	readonly instance?: boolean;

	/** Wrapped prose shown in a growing object compartment. */
	readonly description?: string;
	readonly descriptionWidth?: number;
	/** Role attribute visibility; the graph edges carry owner, type and binding references. */
	readonly visibility?: '+' | '-';

	/** Canonical deep link URI or web link associated with this entity. */
	readonly href?: string;

	/** Optional ontological stereotype (e.g., '«initiates»', '«executes»', or array of stereotypes per Ontology v1.3). */
	readonly stereotype?: string | readonly string[];

	/** Optional plural alias for multiple stereotypes per Ontology v1.3. */
	readonly stereotypes?: readonly string[];

	/** Subtitle, frame, or namespace tag. */
	readonly namespace?: string;

	/** For 'cls' / 'obj': list of attribute or field declarations. */
	readonly attributes?: readonly string[];
	/** Derived from Role edges; edit the Role to change this projection. */
	readonly roleAttributes?: readonly string[];

	/** For 'cls': list of method or operation declarations. */
	readonly methods?: readonly string[];

	/** Spatial bounds of the node. */
	readonly bounds: Bounds;

	/** Custom extension properties passed from or serialized to .raid manifests. */
	readonly properties?: Readonly<Record<string, unknown>>;

	/** Whether this slot is an unbound shadow node awaiting binding (aim-unbound="true"). */
	readonly unbound?: boolean;

	/** Identifier of enclosing boundary box (if enclosed). */
	readonly boundaryId?: string;
}

/**
 * Metadata carried by an outer namespace or class context boundary box.
 * Maps to `<g aim-boundary="Class|Package" aim-name="..." aim-package="...">`.
 */
export interface RaidBoundaryData {
	/** Unique boundary identifier. */
	readonly id: string;

	/** Scope kind: 'Class' | 'Package' | string. */
	readonly kind: 'Class' | 'Package' | string;

	/** Scope name (e.g. 'Meeting'). */
	readonly name: string;

	/** Optional enclosing package name (e.g. 'AIA Foundation'). */
	readonly package?: string;

	/** Identifiers of child nodes enclosed within this boundary box. */
	readonly elementIds: readonly string[];

	/** Spatial bounds of the boundary box. */
	readonly bounds: Bounds;

	/** Ontological deep link or class browser portal target (e.g. '/classes?select=Contract'). */
	readonly href?: string | undefined;

	/** Custom extension properties. */
	readonly properties?: Readonly<Record<string, unknown>>;
}

/**
 * Metadata carried by an ontological edge inside AntV X6.
 */
export interface RaidEdgeData {
	/** Unique edge identifier. */
	readonly id: string;

	/** Ontological relationship type. */
	readonly kind: AimEdgeKind;

	/** Identifier of the source node. */
	readonly sourceId: string;

	/** Identifier of the target node. */
	readonly targetId: string;

	/** Optional docking port on source node. */
	readonly sourcePort?: OrthogonalPortId | string;

	/** Optional docking port on target node. */
	readonly targetPort?: OrthogonalPortId | string;

	/** Suppress the arrow for the owner-to-role segment. */
	readonly directed?: boolean;

	/** Optional edge label text. */
	readonly label?: string;

	/** Optional edge stereotype annotation (e.g., '«DependsOn»'). */
	readonly stereotype?: string;

	/** Multiplicity / Cardinality at the source end (e.g., '1', '0..*'). */
	readonly sourceCardinality?: string;

	/** Multiplicity / Cardinality at the target end (e.g., '0..1', '*'). */
	readonly targetCardinality?: string;

	/** Routing strategy for this edge ('manhattan', 'normal', 'smooth'). */
	readonly routing?: AimRoutingMode;
	/** Per-artifact expression capsule visibility; absent means visible. */
	readonly showExpressions?: boolean;

	/** User-editable or router-computed Manhattan bend points. */
	readonly bendPoints: readonly SvgBendPoint[];

	/** Precomputed or live SVG path data ('M ... L ...') for standalone vector rendering. */
	readonly pathData?: string;

	/** Optional OPM AST expression associated with this edge (e.g., 'Host != null'). */
	readonly expression?: string;

	/** Optional color styling for the AST expression pill ('green' | 'red' | 'anthracite' | string). */
	readonly expressionColor?: AimExpressionColor | undefined;

	/** Live semantic evaluation state: true = satisfied (green), false = unsatisfied (amber/coral), null/undefined = indeterminate. */
	readonly satisfied?: boolean | null;

	/** Full parsed AST tree details for inspection/tooltip. */
	readonly ast?: unknown;
}

/**
 * Supported color accents for edge AST expression pills.
 * - 'green': Cascais Heraldic Green (#10B981)
 * - 'red': Cascais Red (#EF4444)
 * - 'anthracite': Cascais Warm Graphite / Anthracite (#1F2937)
 */
export type AimExpressionColor = 'green' | 'red' | 'anthracite' | string;

/**
 * Immutable speech-act provenance record as emitted by AIA v1.9.1 (ExternalAcceptance.cs).
 * Stored in entity `properties` under keys matching `/^s\d+$/` (e.g., `s1789873200000`),
 * where the numeric portion is the Unix epoch timestamp in milliseconds.
 */
export interface SpeechActStatement {
	/** Ingestion channel through which the speech act was received. */
	readonly Channel: 'AppleCalendar' | 'Email' | 'Chat' | 'WhatsApp' | string;

	/** PersonId of the actor who made the statement (e.g. "7000"). */
	readonly Actor: string;

	/** Verbatim speech act text (e.g. "Accepted invitation via CalDAV"). */
	readonly RawMessage: string;

	/** The AIA ingestion agent that processed this statement. */
	readonly IngestedBy: 'Umshadisi' | 'Cize' | 'System' | string;

	/** ISO 8601 UTC timestamp of the speech act (e.g. "2026-09-20T10:00:00.0000000Z"). */
	readonly AtUtc: string;
}

/** Regex pattern matching statement property keys (e.g. s1789873200000). */
export const STATEMENT_KEY_PATTERN = /^s\d+$/;

/**
 * Full in-memory metamodel representation corresponding to a `.raid` manifest.
 */
export interface RaidMetamodel {
	/** Diagram identifier (e.g., 'SignContract_UCD'). */
	readonly diagramId: string;

	/** Optional human-readable title. */
	readonly title?: string;

	/** Archetype classification (e.g., 'OneUseCaseDiagram', 'ClassDiagram', 'ActivityDiagram'). */
	readonly archetype: string;

	/** Entity nodes projected in the diagram. */
	readonly nodes: readonly RaidNodeData[];

	/** Relationships connecting projected nodes. */
	readonly edges: readonly RaidEdgeData[];

	/** Outer context boundary boxes (e.g. Class or Package scopes). */
	readonly boundaries?: readonly RaidBoundaryData[];

	/** Diagram-level edge routing mode ('manhattan', 'normal', 'smooth'). */
	readonly routing?: AimRoutingMode;
	/** Per-artifact expression capsule visibility; absent means visible. */
	readonly showExpressions?: boolean;

	/** Additional diagram-level metadata. */
	readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Contractual SVG attribute names adhering to the 'aim-*' standard.
 */
export const AimSvgContract = {
	// Node marking & attributes
	ATTR_NODE: 'aim-node',
	ATTR_SHOW_EXPRESSIONS: 'aim-show-expressions',
	ATTR_ID: 'aim-id',
	ATTR_KIND: 'aim-kind',
	ATTR_DISPLAY_NAME: 'aim-display-name',
	ATTR_QUALIFIER: 'aim-qualifier',
	ATTR_INSTANCE: 'aim-instance',
	ATTR_HREF: 'aim-href',
	ATTR_STEREOTYPE: 'aim-stereotype',
	ATTR_NAMESPACE: 'aim-namespace',
	ATTR_UNBOUND: 'aim-unbound',

	// Boundary marking & attributes
	ATTR_BOUNDARY: 'aim-boundary',
	ATTR_BOUNDARY_NAME: 'aim-name',
	ATTR_BOUNDARY_PACKAGE: 'aim-package',
	ATTR_BOUNDARY_ELEMENTS: 'aim-elements',

	// Edge marking & attributes
	ATTR_EDGE: 'aim-edge',
	ATTR_EDGE_KIND: 'aim-edge-kind',
	ATTR_SOURCE: 'aim-source',
	ATTR_TARGET: 'aim-target',
	ATTR_SOURCE_PORT: 'aim-source-port',
	ATTR_TARGET_PORT: 'aim-target-port',
	ATTR_ROUTING: 'aim-routing',
	ATTR_BENDS: 'aim-bends',
	ATTR_EXPRESSION: 'aim-expression',
	ATTR_EXPRESSION_COLOR: 'aim-expression-color',
	ATTR_SATISFIED: 'aim-satisfied',

	// Selectors for DOM queries
	SELECTOR_NODE: '[aim-node], [data-node], g[aim-kind]',
	SELECTOR_EDGE: '[aim-edge], path[aim-edge-kind]',
	SELECTOR_BOUNDARY: '[aim-boundary], g[aim-boundary]',
} as const;

/**
 * Options for hydrating an AntV X6 graph from an SVG document.
 */
export interface HydrationOptions {
	/** If true, clears any existing graph elements before populating. Default: true. */
	readonly clearGraph?: boolean;

	/** If true, automatically executes Manhattan routing if bend points are missing. Default: true. */
	readonly autoRouteEdges?: boolean;

	/**
	 * If true, infers docking ports (e.g. port-right, port-left) based on node geometry when ports
	 * are omitted in the SVG. When false (default), edges bind directly to node cells without ports,
	 * enabling dynamic Manhattan center-aiming routing. Default: false.
	 */
	readonly inferPorts?: boolean;

	/** Default fallback dimensions when width/height are unspecified in SVG. */
	readonly defaultNodeSize?: { readonly width: number; readonly height: number };
}

/**
 * Options for serializing an AntV X6 graph to an SVG document.
 */
export interface SerializationOptions {
	/** Base SVG template to inject updated coordinates and bend points into. */
	readonly baseSvg?: string;

	/** Pretty-print XML output with indentation. Default: true. */
	readonly format?: boolean;

	/** Inject Cascais design token CSS variables into `<defs><style>`. Default: true. */
	readonly embedStyles?: boolean;

	/** Optional diagram-level routing mode to serialize onto root `<svg>` tag. */
	readonly routingMode?: AimRoutingMode;

	/**
	 * Automatically calculate and expand the root viewBox (and width/height) to encompass
	 * all node bounds and connector bend points without clipping in external viewers.
	 * Default: true.
	 */
	readonly autoBounds?: boolean;

	/**
	 * Padding in pixels added around the outermost nodes when autoBounds is enabled.
	 * Default: 60.
	 */
	readonly viewportPadding?: number;
}
