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
 */
export type AimOntologyKind = 'uc' | 'act' | 'cls' | 'obj' | 'per';

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

  /** Optional ontological stereotype (e.g., '«initiates»', '«executes»'). */
  readonly stereotype?: string;

  /** Subtitle, frame, or namespace tag. */
  readonly namespace?: string;

  /** For 'cls' / 'obj': list of attribute or field declarations. */
  readonly attributes?: readonly string[];

  /** For 'cls': list of method or operation declarations. */
  readonly methods?: readonly string[];

  /** Spatial bounds of the node. */
  readonly bounds: Bounds;

  /** Custom extension properties passed from or serialized to .raid manifests. */
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

  /** Optional edge label text. */
  readonly label?: string;

  /** Optional edge stereotype annotation (e.g., '«DependsOn»'). */
  readonly stereotype?: string;

  /** Multiplicity / Cardinality at the source end (e.g., '1', '0..*'). */
  readonly sourceCardinality?: string;

  /** Multiplicity / Cardinality at the target end (e.g., '0..1', '*'). */
  readonly targetCardinality?: string;

  /** User-editable or router-computed Manhattan bend points. */
  readonly bendPoints: readonly SvgBendPoint[];
}

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

  /** Additional diagram-level metadata. */
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Contractual SVG attribute names adhering to the 'aim-*' standard.
 */
export const AimSvgContract = {
  // Node marking & attributes
  ATTR_NODE: 'aim-node',
  ATTR_ID: 'aim-id',
  ATTR_KIND: 'aim-kind',
  ATTR_DISPLAY_NAME: 'aim-display-name',
  ATTR_STEREOTYPE: 'aim-stereotype',
  ATTR_NAMESPACE: 'aim-namespace',

  // Edge marking & attributes
  ATTR_EDGE: 'aim-edge',
  ATTR_EDGE_KIND: 'aim-edge-kind',
  ATTR_SOURCE: 'aim-source',
  ATTR_TARGET: 'aim-target',
  ATTR_SOURCE_PORT: 'aim-source-port',
  ATTR_TARGET_PORT: 'aim-target-port',
  ATTR_BENDS: 'aim-bends',

  // Selectors for DOM queries
  SELECTOR_NODE: '[aim-node], [data-node], g[aim-kind]',
  SELECTOR_EDGE: '[aim-edge], path[aim-edge-kind]',
} as const;

/**
 * Options for hydrating an AntV X6 graph from an SVG document.
 */
export interface HydrationOptions {
  /** If true, clears any existing graph elements before populating. Default: true. */
  readonly clearGraph?: boolean;

  /** If true, automatically executes Manhattan routing if bend points are missing. Default: true. */
  readonly autoRouteEdges?: boolean;

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
}
