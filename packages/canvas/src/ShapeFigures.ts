/**
 * @file ShapeFigures.ts
 * @description The Shape element: one way to draw every free-standing stereotype Shape.
 *
 * A Shape is a silhouette that stands on the canvas the way a Person's bust does, with the Class and the
 * name beneath it (RAI and Koyo, 2026-10-06). Every Shape is one {@link ShapeFigure} record: data only.
 * The live canvas and the SVG export each read that record through one renderer, so adding a Shape means
 * adding a record here and nothing else.
 *
 * The standard every record is drawn to:
 * - **Height:** the bust's. Lines run from y = 2 to y = 48 inside a box {@link SHAPE_FIGURE_HEIGHT} tall;
 *   the box sits {@link SHAPE_FIGURE_TOP} below the node's top, which puts those lines on the bust's own
 *   (y = 8 to y = 54). Width follows from the drawing.
 * - **Lines:** {@link SHAPE_LINE_WIDTH} for structure, {@link SHAPE_DETAIL_WIDTH} for what is drawn inside.
 * - **The seam:** runs down the middle of the box. The `outline` must span the full width, because the two
 *   flag washes are that outline cut in half at the seam; no Shape carries a second, hand-drawn half.
 * - **Colour:** none of its own. The line takes the node's ink, the ground is Chalk White, and an accent
 *   names a palette token.
 */

import { CascaisPalette } from './CascaisTheme.js';
import { contractStateOf, resolveStereotype, type StereotypeId } from './StereotypeIcons.js';
import type { RaidNodeData } from './types.js';

/** Height of every Shape's box. */
export const SHAPE_FIGURE_HEIGHT = 50;
/** Where the box starts below the node's top edge. */
export const SHAPE_FIGURE_TOP = 6;
/** Structural line weight: the bust's. */
export const SHAPE_LINE_WIDTH = 2.2;
/** Weight of the finer strokes inside a Shape. */
export const SHAPE_DETAIL_WIDTH = 1.4;
/** Line weight when a Shape is reduced to a chip or a badge (Koyo: 1.3 at 18 to 24 units). */
export const SHAPE_REDUCED_LINE_WIDTH = 1.3;

/** A filled accent. Without a `color` it takes the line's ink. */
export interface ShapeAccent {
  readonly d: string;
  readonly color?: string;
}

export interface ShapeFigure {
  readonly id: StereotypeId;
  /** The archetypes that can wear this Shape. On any other kind the stereotype is kept and not drawn. */
  readonly kinds: readonly RaidNodeData['kind'][];
  readonly width: number;
  /** Box height, when a drawing predates the standard. Defaults to {@link SHAPE_FIGURE_HEIGHT}. */
  readonly height?: number;
  /** Closed silhouette spanning the full width: the white ground and the area the flag washes fill. */
  readonly outline: string;
  /** Structural strokes. */
  readonly line: string;
  /** Finer strokes inside. */
  readonly detail?: string;
  /** Filled accent, which may follow the object's state. */
  readonly accent?: (state?: string) => ShapeAccent | undefined;
}

// The document sheet shared by Contract, Law, Court and Certificate: 36 wide, corner folded 8 x 8.
const SHEET = 'M 1.1 2 H 26.9 L 34.9 10 V 48 H 1.1 Z';
const SHEET_LINE = `${SHEET} M 26.9 2 V 10 H 34.9`;

const circle = (cx: number, cy: number, r: number) =>
  `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;

/** One bay of the server rack, 13.8 tall. */
const bay = (top: number) => {
  const bottom = top + 13.8;
  return `M 4.1 ${top} H 39.9 A 3 3 0 0 1 42.9 ${top + 3} V ${bottom - 3} A 3 3 0 0 1 39.9 ${bottom} H 4.1 A 3 3 0 0 1 1.1 ${bottom - 3} V ${top + 3} A 3 3 0 0 1 4.1 ${top} Z`;
};
const BAYS = [2, 18.1, 34.2];

export const SHAPE_FIGURES: readonly ShapeFigure[] = [
  {
    id: 'contract',
    kinds: ['obj'],
    width: 36,
    outline: SHEET,
    line: SHEET_LINE,
    // Three clause rules and the signature baseline; the right half of the baseline is where the pen or the tick goes
    detail: 'M 7 16 H 29 M 7 23 H 29 M 7 30 H 22 M 7 40 H 15',
    accent: (state) => {
      const drawing = contractStateOf(state);
      // ReadyToSign: a pen laid across the sheet, nib on the signature line. Gold is the pending action.
      if (drawing === 'readyToSign') return { d: 'M 18.5 39.5 L 20.5 34.4 L 32.5 22.4 L 35.6 25.5 L 23.6 37.5 Z', color: CascaisPalette.NetGoldStroke };
      // Approved: a tick where the signature was. Status green, never the flag's Verde.
      if (drawing === 'approved') return { d: 'M 15.6 34.6 L 18 32.2 L 21.3 35.5 L 28.9 25.2 L 31.7 27.3 L 21.7 40.8 Z', color: CascaisPalette.TelemetryGreen };
      // Unsigned: the rest of the baseline, drawn as a hairline bar.
      return { d: 'M 19 39.3 H 29 V 40.7 H 19 Z' };
    },
  },
  {
    id: 'law',
    kinds: ['obj'],
    width: 36,
    outline: SHEET,
    // The section mark: two S-curves interlocked, 18 tall
    line: `${SHEET_LINE} M 21.5 12.5 C 20.25 8.75 14.5 9 14.5 12.75 C 14.5 16 21.5 17.25 21.5 20.75 M 14.5 24.25 C 15.75 28 21.5 27.75 21.5 24 C 21.5 20.75 14.5 19.5 14.5 16`,
    detail: 'M 7 35 H 29 M 7 41 H 29',
  },
  {
    id: 'court',
    kinds: ['obj'],
    width: 36,
    outline: SHEET,
    // Gavel head and handle, and the baseline the ruling rests on
    line: `${SHEET_LINE} M 8.9 15.5 L 14.5 9.9 L 19.1 14.5 L 13.5 20.1 Z M 16.5 17.5 L 26 27 M 7 41 H 29`,
    detail: 'M 7 34 H 16',
  },
  {
    id: 'certificate',
    kinds: ['obj'],
    width: 36,
    outline: SHEET,
    line: SHEET_LINE,
    detail: 'M 7 16 H 22 M 7 23 H 29 M 7 30 H 15',
    // Ribbon tails over the bottom edge, then the eight-scallop seal on top of them
    accent: () => ({
      d: 'M 20.6 40 L 18.6 49 L 22.2 46.6 L 24 41.2 Z M 28.4 40 L 30.4 49 L 26.8 46.6 L 25 41.2 Z '
        + 'M 24.5 27.5 L 26.6 29.3 L 29.4 29.6 L 29.7 32.4 L 31.5 34.5 L 29.7 36.6 L 29.4 39.4 L 26.6 39.7 L 24.5 41.5 L 22.4 39.7 L 19.6 39.4 L 19.3 36.6 L 17.5 34.5 L 19.3 32.4 L 19.6 29.6 L 22.4 29.3 Z',
      color: CascaisPalette.NetGold,
    }),
  },
  {
    id: 'checklist',
    kinds: ['obj'],
    width: 34,
    // Board and clip as one silhouette
    outline: 'M 4.1 6 H 11 V 2 H 23 V 6 H 29.9 A 3 3 0 0 1 32.9 9 V 45 A 3 3 0 0 1 29.9 48 H 4.1 A 3 3 0 0 1 1.1 45 V 9 A 3 3 0 0 1 4.1 6 Z',
    line: 'M 4.1 6 H 29.9 A 3 3 0 0 1 32.9 9 V 45 A 3 3 0 0 1 29.9 48 H 4.1 A 3 3 0 0 1 1.1 45 V 9 A 3 3 0 0 1 4.1 6 Z M 11 2 H 23 V 9.5 H 11 Z',
    // Two ticked rows and one still open
    detail: 'M 7 18 L 9.4 20.4 L 13.6 15 M 18 18.5 H 27 M 7 27 L 9.4 29.4 L 13.6 24 M 18 27.5 H 27 M 7.2 33.2 H 12.6 V 38.6 H 7.2 Z M 18 36.5 H 27',
  },
  {
    id: 'system',
    kinds: ['per', 'obj'],
    width: 44,
    // Three bays, each with an indicator and a slot
    outline: BAYS.map(bay).join(' '),
    line: BAYS.map(bay).join(' '),
    detail: BAYS.map((top) => `M 15 ${top + 6.9} H 36`).join(' '),
    accent: () => ({ d: BAYS.map((top) => circle(8.5, top + 6.9, 1.9)).join(' ') }),
  },
  {
    id: 'stage',
    kinds: ['plc'],
    width: 56,
    outline: 'M 1.1 10.6 L 9.1 2 H 46.9 L 54.9 10.6 V 48 H 1.1 Z',
    // Canopy, the four truss uprights, the tower bases and the stage floor
    line: 'M 1.1 10.6 L 9.1 2 H 46.9 L 54.9 10.6 Z M 4.4 10.6 V 42.6 M 13.6 10.6 V 42.6 M 42.4 10.6 V 42.6 M 51.6 10.6 V 42.6 '
      + 'M 1.1 42.6 H 17.1 V 48 H 1.1 Z M 38.9 42.6 H 54.9 V 48 H 38.9 Z M 13.6 40.4 H 42.4',
    // Lighting rig and spots, the lattice of both towers, speaker cabinets and the front steps
    detail: 'M 13.6 12.8 H 42.4 M 18.2 12.8 L 15.9 18 M 23.4 12.8 V 18 M 28 12.8 V 18 M 32.6 12.8 V 18 M 37.8 12.8 L 40.1 18 '
      + 'M 4.4 10.6 L 13.6 21.2 M 13.6 10.6 L 4.4 21.2 M 4.4 21.2 L 13.6 31.9 M 13.6 21.2 L 4.4 31.9 M 4.4 31.9 L 13.6 42.6 M 13.6 31.9 L 4.4 42.6 '
      + 'M 42.4 10.6 L 51.6 21.2 M 51.6 10.6 L 42.4 21.2 M 42.4 21.2 L 51.6 31.9 M 51.6 21.2 L 42.4 31.9 M 42.4 31.9 L 51.6 42.6 M 51.6 31.9 L 42.4 42.6 '
      + 'M 16.2 26.6 H 24.1 V 40.4 H 16.2 Z M 31.9 26.6 H 39.8 V 40.4 H 31.9 Z M 18.8 43.6 H 37.2 M 20.8 46.5 H 35.2',
    // Four stars on the canopy
    accent: () => ({
      d: 'M 14.9 3.4 L 15.6 5.3 L 17.6 5.4 L 16.1 6.7 L 16.6 8.6 L 14.9 7.5 L 13.2 8.6 L 13.7 6.7 L 12.1 5.4 L 14.1 5.3 Z '
        + 'M 24.1 3.4 L 24.8 5.3 L 26.8 5.4 L 25.3 6.7 L 25.8 8.6 L 24.1 7.5 L 22.4 8.6 L 22.9 6.7 L 21.3 5.4 L 23.3 5.3 Z '
        + 'M 33.2 3.4 L 34 5.3 L 36 5.4 L 34.4 6.7 L 35 8.6 L 33.2 7.5 L 31.5 8.6 L 32.1 6.7 L 30.5 5.4 L 32.5 5.3 Z '
        + 'M 42.4 3.4 L 43.2 5.3 L 45.2 5.4 L 43.6 6.7 L 44.1 8.6 L 42.4 7.5 L 40.7 8.6 L 41.2 6.7 L 39.7 5.4 L 41.7 5.3 Z',
    }),
  },
  {
    id: 'bar',
    kinds: ['plc'],
    width: 36,
    outline: 'M 1.1 8.6 H 34.9 L 18 30.5 Z',
    // Bowl, stem and foot
    line: 'M 1.1 8.6 H 34.9 L 18 30.5 Z M 18 30.5 V 48 M 6.7 48 H 29.3',
    // The pick across the rim and the level of the drink
    detail: 'M 2.2 8.6 L 31.5 2 M 7 16.2 H 29',
    accent: () => ({ d: circle(20.3, 12.6, 2.4) }),
  },
  {
    id: 'venue',
    kinds: ['plc'],
    // The pin is the drawing the standard was taken from, so it keeps its own box and coordinates.
    width: 45,
    height: 54,
    outline: 'M 22.5 43.5 C 15 33.75 9 26.25 9 16.5 A 13.5 13.5 0 1 1 36 16.5 C 36 26.25 30 33.75 22.5 43.5 Z M 22.5 11.25 A 5.25 5.25 0 1 0 22.5 21.75 A 5.25 5.25 0 1 0 22.5 11.25 Z',
    line: 'M 22.5 43.5 C 15 33.75 9 26.25 9 16.5 A 13.5 13.5 0 1 1 36 16.5 C 36 26.25 30 33.75 22.5 43.5 Z M 22.5 11.25 A 5.25 5.25 0 1 0 22.5 21.75 A 5.25 5.25 0 1 0 22.5 11.25 Z '
      + 'M 7.5 49.5 C 7.5 47.25 14.25 45.75 22.5 45.75 C 30.75 45.75 37.5 47.25 37.5 49.5 C 37.5 51.75 30.75 53.25 22.5 53.25 C 14.25 53.25 7.5 51.75 7.5 49.5 Z',
  },
];

const BY_ID = new Map(SHAPE_FIGURES.map((figure) => [figure.id, figure]));

/** The Shape record for a stereotype id, whatever archetype wears it. */
export function getShapeFigure(id: StereotypeId | undefined): ShapeFigure | undefined {
  return id === undefined ? undefined : BY_ID.get(id);
}

/**
 * The Shape a node stands as, or `undefined` when it is drawn as its plain archetype.
 *
 * The first stereotype that is a Shape for this node's kind decides. An Object that shows a description
 * stays a card: the text needs the room.
 */
export function shapeFigureOf(node: Pick<RaidNodeData, 'kind' | 'stereotype' | 'description'>): ShapeFigure | undefined {
  if (node.kind === 'obj' && node.description) return undefined;
  const figure = getShapeFigure(resolveStereotype(node.stereotype, node.kind));
  return figure?.kinds.includes(node.kind) ? figure : undefined;
}

/**
 * Where a Shape sits in a node of the given width: centred, {@link SHAPE_FIGURE_TOP} from the top. A node
 * that stands as a Shape is drawn 120 wide whatever card size it was saved at, like the Person.
 */
export function shapeFigurePlacement(figure: ShapeFigure, nodeWidth: number): { cx: number; x: number; y: number; width: number; height: number } {
  const cx = Math.round(shapeNodeWidth(nodeWidth) / 2);
  return { cx, x: cx - figure.width / 2, y: SHAPE_FIGURE_TOP, width: figure.width, height: shapeFigureHeight(figure) };
}

/** Width of a node that stands as a Shape. */
export function shapeNodeWidth(savedWidth: number): number {
  return savedWidth > 140 || savedWidth < 120 ? 120 : savedWidth;
}

/** Box height of a Shape. */
export function shapeFigureHeight(figure: ShapeFigure): number {
  return figure.height ?? SHAPE_FIGURE_HEIGHT;
}

/**
 * A Shape as stand-alone SVG markup at `(x, y)`: ground, lines, detail, accent. Used by the export, and
 * with `scale` by anything that shows a Shape reduced (a chip, a badge, a stencil).
 */
export function renderShapeFigureSvg(
  figure: ShapeFigure,
  options: { x: number; y: number; ink?: string; state?: string; scale?: number; extra?: string },
): string {
  const ink = options.ink ?? CascaisPalette.WarmGraphite;
  const scale = options.scale ?? 1;
  // Reduced, the line keeps a readable weight instead of thinning with the drawing.
  const line = scale < 1 ? SHAPE_REDUCED_LINE_WIDTH / scale : SHAPE_LINE_WIDTH;
  const detail = scale < 1 ? (SHAPE_REDUCED_LINE_WIDTH * 0.8) / scale : SHAPE_DETAIL_WIDTH;
  const accent = figure.accent?.(options.state);
  const round = (value: number) => Math.round(value * 100) / 100;
  return [
    `<g class="aim-shape-figure aim-shape-${figure.id}" transform="translate(${options.x}, ${options.y})${scale === 1 ? '' : ` scale(${round(scale)})`}">`,
    `<path d="${figure.outline}" fill="${CascaisPalette.ChalkWhite}" fill-rule="evenodd" />`,
    options.extra ?? '',
    `<path d="${figure.line}" fill="none" stroke="${ink}" stroke-width="${round(line)}" stroke-linecap="round" stroke-linejoin="round" />`,
    figure.detail ? `<path d="${figure.detail}" fill="none" stroke="${ink}" stroke-width="${round(detail)}" stroke-linecap="round" stroke-linejoin="round" />` : '',
    accent ? `<path d="${accent.d}" fill="${accent.color ?? ink}" />` : '',
    `</g>`,
  ].join('');
}
