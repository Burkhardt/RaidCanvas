/**
 * @file EdgeGrammar.ts
 * @description How every edge is drawn: one table for the UML edge kinds, one for the stereotypes that
 * change the line. The live canvas and the SVG export both read it, so a new stereotype is a table entry.
 *
 * The Activity triad (Ontology Compendium v1.9 §10.2, ADR-0010):
 * - `«invokes»`: a parent delegates a sub-task and stays in Doing. Dashed line, open arrow.
 * - `«spawns»`: a concluding parent hands over to a successor it mints. Dashed line, open arrow, and a
 *   hook at the start of the line, like the ↪ sign: the "hooked arrow" of the Compendium.
 * - `«precedes»`: a derived causal sequence through shared object state. Solid line, open arrow.
 */

import type { AimEdgeKind, RaidEdgeData } from './types.js';

/** The arrowheads the canvas draws. `none` leaves the end bare. */
export type EdgeHead = 'filled' | 'open' | 'hollow' | 'none';
/** What the start of a line can carry: UML's aggregation and composition diamonds, or the hook of «spawns». */
export type EdgeTail = 'diamond-open' | 'diamond-filled' | 'hook';

export interface EdgeLine {
  /** `stroke-dasharray`; absent for a solid line. */
  readonly dash?: string;
  readonly head: EdgeHead;
  readonly tail?: EdgeTail;
}

/** The UML edge kinds. */
export const EDGE_KIND_LINES: Readonly<Record<AimEdgeKind, EdgeLine>> = {
  association: { head: 'filled' },
  dependency: { dash: '5,5', head: 'open' },
  generalization: { head: 'hollow' },
  realization: { dash: '5,5', head: 'hollow' },
  aggregation: { head: 'none', tail: 'diamond-open' },
  composition: { head: 'none', tail: 'diamond-filled' },
};

/** The stereotypes that change how an edge is drawn. A stereotype wins over the edge's kind. */
export const EDGE_STEREOTYPE_LINES = {
  invokes: { dash: '5,5', head: 'open' },
  spawns: { dash: '5,5', head: 'open', tail: 'hook' },
  precedes: { head: 'open' },
  // Supervisory monitoring telemetry line (ADR-0008); keeps the association's head.
  observes: { dash: '6,3,2,3', head: 'filled' },
} as const satisfies Readonly<Record<string, EdgeLine>>;

export type EdgeStereotype = keyof typeof EDGE_STEREOTYPE_LINES;

/** The Activity-to-Activity relations, which are named on the line when the host gives no label. */
export const ACTIVITY_RELATIONS: readonly EdgeStereotype[] = ['invokes', 'spawns', 'precedes'];

const WORDS = Object.keys(EDGE_STEREOTYPE_LINES) as EdgeStereotype[];

/**
 * The line-changing stereotype an edge carries, read from its stereotype first, then its label, as a
 * whole word with or without guillemets (`«invokes»`, `invokes`, `Invokes`).
 */
export function edgeStereotypeOf(edge: Pick<RaidEdgeData, 'stereotype' | 'label'>): EdgeStereotype | undefined {
  for (const text of [edge.stereotype, edge.label]) {
    if (!text) continue;
    for (const token of String(text).toLowerCase().split(/[^a-z]+/)) {
      if ((WORDS as readonly string[]).includes(token)) return token as EdgeStereotype;
    }
  }
  return undefined;
}

/** How an edge is drawn: its stereotype's line if it has one, otherwise its kind's. */
export function edgeLineOf(edge: Pick<RaidEdgeData, 'kind' | 'stereotype' | 'label' | 'directed'>): EdgeLine {
  const stereotype = edgeStereotypeOf(edge);
  const line: EdgeLine = stereotype ? EDGE_STEREOTYPE_LINES[stereotype] : (EDGE_KIND_LINES[edge.kind] ?? EDGE_KIND_LINES.association);
  return edge.directed === false ? { ...line, head: 'none' } : line;
}

/**
 * The text on an edge: the host's label, or for an Activity relation without one, the relation's name
 * in guillemets, so a delegation never reads as an unlabelled dependency.
 */
export function edgeLabelOf(edge: Pick<RaidEdgeData, 'stereotype' | 'label'>): string | undefined {
  if (edge.label) return edge.label;
  const stereotype = edgeStereotypeOf(edge);
  return stereotype && ACTIVITY_RELATIONS.includes(stereotype) ? `«${stereotype}»` : undefined;
}

/** How a marker is filled: with the line's ink, with the paper (a hollow shape), or not at all (bare strokes). */
export type MarkerFill = 'ink' | 'paper' | 'none';

export interface MarkerPath {
  readonly d: string;
  readonly fill: MarkerFill;
}

/**
 * Marker geometry, heads and tails alike, in a 10 x 10 box that touches the node at (10, 5) and reaches
 * back along the line. Both renderers turn the same drawing onto either end.
 */
export const EDGE_HEAD_PATHS: Readonly<Record<Exclude<EdgeHead, 'none'>, MarkerPath>> = {
  filled: { d: 'M 0 0 L 10 5 L 0 10 Z', fill: 'ink' },
  open: { d: 'M 1 1 L 10 5 L 1 9', fill: 'none' },
  hollow: { d: 'M 0 0 L 10 5 L 0 10 Z', fill: 'paper' },
};

export const EDGE_TAIL_PATHS: Readonly<Record<EdgeTail, MarkerPath>> = {
  'diamond-open': { d: 'M 0 5 L 5 2 L 10 5 L 5 8 Z', fill: 'paper' },
  'diamond-filled': { d: 'M 0 5 L 5 2 L 10 5 L 5 8 Z', fill: 'ink' },
  // Leaves the node along the line, then loops back towards it on the far side: the hook of ↪. Drawn below
  // the line here because a tail is turned round at the start, which puts the loop above it on the canvas.
  hook: { d: 'M 10 5 L 4 5 C 0 5 0 11 4 11', fill: 'none' },
};

/** The id of an edge head's `<marker>` in an exported SVG. */
export function edgeHeadMarkerId(head: Exclude<EdgeHead, 'none'>): string {
  return head === 'filled' ? 'arrow-classic' : `arrow-${head}`;
}

/** The id of an edge tail's `<marker>` in an exported SVG. */
export function edgeTailMarkerId(tail: EdgeTail): string {
  return `tail-${tail}`;
}
